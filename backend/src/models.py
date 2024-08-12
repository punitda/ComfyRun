
from enum import Enum
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, HttpUrl, Field
from pydantic.alias_generators import to_snake


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


class CreateAppPayload(BaseModel):
    machine_name: str
    gpu: Gpu
    custom_nodes: CustomNodes
    models: List[Model]
    additional_dependencies: Optional[str] = None,
    idle_timeout: int


class App(BaseModel):
    app_id: str = Field(alias="App ID")
    description: str = Field(alias="Description")
    state: str = Field(alias="State")
    tasks: str = Field(alias="Tasks")
    created_at: str = Field(alias="Created at")
    stopped_at: Optional[str] = Field(alias="Stopped at")
    url: str

    class Config:
        alias_generator = to_snake
        populate_by_name = True
