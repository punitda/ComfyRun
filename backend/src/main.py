from enum import Enum
import asyncio
import os
import json
import re

from contextlib import asynccontextmanager
from typing import Dict, List, Literal, Annotated
from pydantic import BaseModel, HttpUrl

from fastapi import FastAPI, File
from fastapi.encoders import jsonable_encoder
import httpx

from dotenv import load_dotenv
from slugify import slugify
from src.node_map import local_node_map

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global ext_node_map
    ext_node_map = await fetch_node_map()
    yield
    ext_node_map.clear()

app = FastAPI(lifespan=lifespan)

ext_node_map: Dict = {}


class CustomNode(BaseModel):
    state: Literal["not-installed"]
    hash: str


class CustomNodes(BaseModel):
    custom_nodes: Dict[HttpUrl, CustomNode]
    unknown_nodes: List[str]


class Model(BaseModel):
    name: str
    url: HttpUrl
    path: str


class Gpu(str, Enum):
    ANY = "any"
    T4 = "t4"
    L4 = "l4"
    A10G = "a10g"
    A100SMALL = "a100-40gb"
    A100BIG = "a100-80gb"
    H100 = "h100"


class CreateMachinePayload(BaseModel):
    machine_name: str
    gpu: Gpu
    custom_nodes: CustomNodes
    models: List[Model]


@app.post("/create-machine")
async def create_machine(payload: CreateMachinePayload):
    asyncio.create_task(deploy_machine(payload))
    return {
        "machine_name": payload.machine_name,
        "gpu": payload.gpu.value,
        "custom_nodes": payload.custom_nodes,
        "models": payload.models,
    }


@app.post("/generate-custom-nodes")
async def generate_custom_nodes(workflow_file: Annotated[bytes, File()]):
    workflow = json.loads(workflow_file.decode("utf-8"))
    custom_nodes, _ = await extract_nodes_from_workflow(workflow)
    return custom_nodes


async def deploy_machine(payload: CreateMachinePayload):
    folder_path = f"/app/builds/{payload.machine_name}"
    cp_process = await asyncio.create_subprocess_exec("cp", "-r", "/app/src/template", folder_path)
    await cp_process.wait()

    config = {
        "machine_name": slugify(payload.machine_name),
        "gpu": payload.gpu.value
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

    process = await asyncio.create_subprocess_shell(
        "modal deploy workflow.py",
        cwd=folder_path,
        env={**os.environ,
             "MODAL_TOKEN_ID": os.getenv("MODAL_TOKEN_ID"),
             "MODAL_TOKEN_SECRET": os.getenv("MODAL_TOKEN_SECRET"),
             "COLUMNS": "10000",
             }
    )

    await process.wait()


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
                print(f">> {node_name}")

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
            return local_node_map
