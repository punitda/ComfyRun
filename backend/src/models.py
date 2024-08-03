
from enum import Enum
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, HttpUrl, Field


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
    additional_dependencies: Optional[str] = None,


class App(BaseModel):
    app_id: str = Field(alias="App ID")
    description: str = Field(alias="Description")
    state: str = Field(alias="State")
    tasks: str = Field(alias="Tasks")
    created_at: str = Field(alias="Created at")
    stopped_at: Optional[str] = Field(alias="Stopped at")

    class Config:
        allow_population_by_field_name = True

    def to_snake_case_dict(self):
        return {
            "app_id": self.app_id,
            "description": self.description,
            "state": self.state,
            "tasks": self.tasks,
            "created_at": self.created_at,
            "stopped_at": self.stopped_at
        }
