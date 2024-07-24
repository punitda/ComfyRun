from enum import Enum

from typing import Dict, List, Literal
from pydantic import BaseModel, HttpUrl

from fastapi import FastAPI


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
    ANY = "Any"
    T4 = "T4"
    L4 = "L4"
    A10G = "A10G"
    A100 = "A100"
    H100 = "H100"


class CreateMachinePayload(BaseModel):
    machine_name: str
    gpu: Gpu
    custom_nodes: CustomNodes
    models: List[Model]


@app.post("/create-machine")
def create_machine(payload: CreateMachinePayload):
    return {
        "machine_name": payload.machine_name,
        "gpu": payload.gpu.value,
        "custom_nodes": payload.custom_nodes,
        "models": payload.models,
    }
