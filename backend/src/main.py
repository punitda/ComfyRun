from enum import Enum
import asyncio
import os
import json

from typing import Dict, List, Literal
from pydantic import BaseModel, HttpUrl

from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder

from dotenv import load_dotenv
from slugify import slugify

load_dotenv()
app = FastAPI()


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
