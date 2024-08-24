import asyncio
import os
import json
import re
import uuid

import logging
from contextlib import asynccontextmanager

from typing import Dict, Annotated

from fastapi import FastAPI, File, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse
import httpx
from httpx import ReadTimeout


from dotenv import load_dotenv
from slugify import slugify

from src.models import CreateAppPayload, App
from src.node_map import local_node_map


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)


load_dotenv()

required_env_vars = ["MODAL_TOKEN_ID",
                     "MODAL_TOKEN_SECRET", "X_API_KEY", "CORS_ALLOWED_ORIGINS"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # pylint: disable-next=global-statement

    # Check if require missing env vars are present. If not, throw error
    missing_vars = [
        env_var for env_var in required_env_vars if not os.getenv(env_var)]
    if missing_vars:
        error_msg = f"Missing required environment variables: {', '.join(missing_vars)}"
        raise RuntimeError(error_msg)

    # Fetch node map json
    global ext_node_map
    node_map = await fetch_node_map()
    # Need to reorder and put some custom_nodes at the top otherwise comfyui cli picks up other random nodes during the lookup from workflow.json files
    ext_node_map = reorder_dict(
        node_map, ["https://github.com/cubiq/ComfyUI_IPAdapter_plus"])

    # Set model credentials for running modal commands
    command = f"modal token set --token-id {os.getenv('MODAL_TOKEN_ID')} --token-secret {os.getenv('MODAL_TOKEN_SECRET')}"
    process = await asyncio.create_subprocess_shell(
        command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    await process.communicate()

    yield
    ext_node_map.clear()

app = FastAPI(lifespan=lifespan)

origins = [item.strip() for item in
           os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ext_node_map: Dict = {}
tasks = {}


@app.post("/app")
async def create_app(payload: CreateAppPayload):
    task_id = str(uuid.uuid4())
    task = deploy_app(payload)
    tasks[task_id] = task
    return {"status": "started", "task_id": task_id}


async def stream_logs(task_id: str):
    task = tasks.get(task_id)
    if task is None:
        return
    try:
        async for log_line in task:
            logger.info("Sending event: %s", log_line)
            yield f"{log_line}"
    finally:
        del tasks[task_id]


@app.get("/app-logs/{task_id}")
async def app_logs(task_id: str):
    if tasks.get(task_id) is None:
        return {"message": "Task is already finished! :)"}
    return StreamingResponse(stream_logs(task_id), media_type="text/event-stream")


@app.post("/generate-custom-nodes")
async def generate_custom_nodes(workflow_file: Annotated[bytes, File()]):
    workflow = json.loads(workflow_file.decode("utf-8"))
    custom_nodes, _ = await extract_nodes_from_workflow(workflow)
    return custom_nodes


def verify_api_key(api_key: Annotated[str, Header(alias="X_API_KEY")]):
    if api_key != os.environ.get("X_API_KEY"):
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return api_key


@app.get("/apps", dependencies=[Depends(verify_api_key)])
async def list_apps():
    try:
        workspace = await run_modal_command("modal profile current")
        logger.info("Current workspace: %s", workspace)

        app_list_json = await run_modal_command("modal app list --json")
        data = json.loads(app_list_json)
        response = []

        for item in data:
            item['url'] = f"https://{workspace}--{item['Description']}-comfyworkflow-ui.modal.run"
            updated_app = App.model_validate(item)
            response.append(updated_app.model_dump())
        return response

    except json.JSONDecodeError as e:
        logger.error("Failed to parse JSON output: %s", str(e))
        raise HTTPException(
            status_code=500, detail="Invalid response") from e

    except Exception as e:
        logger.error("Error occurred when fetching list of apps: %s", str(e))
        raise HTTPException(
            status_code=500, detail="Invalid response") from e


@app.delete("/apps/{app_id}", dependencies=[Depends(verify_api_key)])
async def delete_app(app_id: str):
    process = await asyncio.create_subprocess_exec(
        "modal", "app", "stop", app_id,
        env={**os.environ,
             "MODAL_TOKEN_ID": os.getenv("MODAL_TOKEN_ID"),
             "MODAL_TOKEN_SECRET": os.getenv("MODAL_TOKEN_SECRET"),
             "COLUMNS": "10000",
             })

    returncode = await process.wait()

    if returncode != 0:
        raise HTTPException(
            status_code=500, detail=f"Unable to delete app: {app_id}")

    return {"app_id": app_id, "deleted": True}


@app.get("/apps/{app_name}/workflow-urls", dependencies=[Depends(verify_api_key)])
async def get_workflow_urls(app_name: str):
    try:
        workspace = await run_modal_command("modal profile current")
        edit_url = f"https://{workspace}--{app_name}-get-tunnel-url.modal.run"
        run_url = f"https://{workspace}--{app_name}-comfyworkflow-ui.modal.run"

        logger.info("GET request to url %s", edit_url)

        # Set a 30-second timeout
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(edit_url)
            response.raise_for_status()
            result = response.json()
            result["run_url"] = run_url
            logger.info("Tunnel url %s", result)
            logger.info("Run url %s", run_url)
            return result
    except httpx.ReadTimeout as e:
        logger.error(
            "Request timed out while making a request to %s", e.request.url)
        raise HTTPException(
            status_code=504, detail="Request timed out while fetching edit URL") from e
    except httpx.HTTPError as e:
        logger.error("HTTP %d %s error occurred while making a request to %s",
                     response.status_code, response.reason_phrase, e.request.url)
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch edit URL: {str(e)}") from e
    except Exception as e:
        logger.error("An error occurred: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=500, detail="Internal server error") from e


async def deploy_app(payload: CreateAppPayload):
    folder_path = f"/app/builds/{payload.machine_name}"
    cp_process = await asyncio.create_subprocess_exec("cp", "-r", "/app/src/template", folder_path)
    await cp_process.wait()

    config = {
        "machine_name": slugify(payload.machine_name),
        "gpu": payload.gpu.value,
        "additional_dependencies": payload.additional_dependencies,
        "idle_timeout": payload.idle_timeout
    }

    os.makedirs(os.path.dirname(f"{folder_path}/config.py"), exist_ok=True)
    os.makedirs(os.path.dirname(f"{folder_path}/models.json"), exist_ok=True)
    os.makedirs(os.path.dirname(
        f"{folder_path}/custom_nodes.json"), exist_ok=True)

    with open(f"{folder_path}/config.py", "w", encoding='utf-8') as f:
        f.write("config = " + json.dumps(config))

    with open(f"{folder_path}/custom_nodes.json", "w", encoding='utf-8') as f:
        json.dump(jsonable_encoder(payload.custom_nodes), f, indent=4)

    with open(f"{folder_path}/models.json", "w", encoding='utf-8') as f:
        json.dump(jsonable_encoder(payload.models), f, indent=4)

    async def run_command_and_stream(command):
        process = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=folder_path,
            env={**os.environ,
                 "MODAL_TOKEN_ID": os.getenv("MODAL_TOKEN_ID"),
                 "MODAL_TOKEN_SECRET": os.getenv("MODAL_TOKEN_SECRET"),
                 "COLUMNS": "10000",
                 }
        )

        async def read_stream(stream, event_type):
            while True:
                line = await stream.readline()
                if line:
                    yield f"event: {event_type}\ndata:{line.decode().strip()}\n\n"
                else:
                    break

        async def combine_streams(*streams):
            for stream in streams:
                async for item in stream:
                    yield item

        stdout_stream = read_stream(process.stdout, "stdout")
        stderr_stream = read_stream(process.stderr, "stderr")
        combined_streams = combine_streams(stdout_stream, stderr_stream)

        async for line in combined_streams:
            yield line

        await process.wait()

    # Deploy workflows
    async for line in run_command_and_stream("modal deploy workflows"):
        yield line


async def extract_nodes_from_workflow(workflow):
    # extract nodes
    used_nodes = set()

    def extract_nodes(sub_workflow):
        for x in sub_workflow['nodes']:
            node_name = x.get('type')

            # skip virtual nodes
            if node_name in ['Reroute', 'Note']:
                continue

            if node_name is not None and not node_name.startswith('workflow/'):
                used_nodes.add(node_name)

    if 'nodes' in workflow:
        extract_nodes(workflow)

        if 'extra' in workflow:
            if 'groupNodes' in workflow['extra']:
                for x in workflow['extra']['groupNodes'].values():
                    extract_nodes(x)

    # lookup dependent custom nodes
    ext_map = ext_node_map

    rext_map = {}
    preemption_map = {}
    patterns = []
    for k, v in ext_map.items():
        if k == 'https://github.com/comfyanonymous/ComfyUI':
            for x in v[0]:
                if x not in preemption_map:
                    preemption_map[x] = []

                preemption_map[x] = k
            continue

        for x in v[0]:
            if x not in rext_map:
                rext_map[x] = []

            rext_map[x].append(k)

        if 'preemptions' in v[1]:
            for x in v[1]['preemptions']:
                if x not in preemption_map:
                    preemption_map[x] = []

                preemption_map[x] = k

        if 'nodename_pattern' in v[1]:
            patterns.append((v[1]['nodename_pattern'], k))

    # identify used extensions
    used_exts = set()
    unknown_nodes = set()

    for node_name in used_nodes:
        ext = preemption_map.get(node_name)

        if ext is None:
            ext = rext_map.get(node_name)
            if ext is not None:
                ext = ext[0]

        if ext is None:
            for pat_ext in patterns:
                if re.search(pat_ext[0], node_name):
                    ext = pat_ext[1]
                    break

        if ext == 'https://github.com/comfyanonymous/ComfyUI':
            pass
        elif ext is not None:
            if 'Fooocus' in ext:
                logger.info(">> %s", node_name)

            used_exts.add(ext)
        else:
            unknown_nodes.add(node_name)

    return used_exts, unknown_nodes


async def fetch_node_map():
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get("https://raw.githubusercontent.com/ltdrdata/ComfyUI-Manager/main/extension-node-map.json")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError:
            logger.error("Unable to fetch node map json from ComfyUIManager")
            return local_node_map


def reorder_dict(original_dict, keys_to_move_first):
    # Convert keys_to_move_first to a set for O(1) lookup
    keys_set = set(keys_to_move_first)

    reordered = dict()

    # First, add the keys we want at the beginning
    for key in keys_to_move_first:
        if key in original_dict:
            reordered[key] = original_dict[key]

    # Then add the rest of the items
    for key, value in original_dict.items():
        if key not in keys_set:
            reordered[key] = value

    return reordered


async def run_modal_command(command: str) -> str:
    try:
        env = {
            **os.environ,
            "MODAL_TOKEN_ID": os.getenv("MODAL_TOKEN_ID"),
            "MODAL_TOKEN_SECRET": os.getenv("MODAL_TOKEN_SECRET"),
            "COLUMNS": "10000",
        }
        process = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env
        )

        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            error_msg = stderr.decode().strip()
            raise RuntimeError(
                f"Command '{command}' failed with error: {error_msg}")

        return stdout.decode().strip()
    except Exception as e:
        logger.exception(
            "An error occurred while running command '%s': %s", command, str(e))
        raise
