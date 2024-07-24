from pydantic import BaseModel
from fastapi import FastAPI

app = FastAPI()

class CreateMachinePayload(BaseModel):
    machine_name: str
    gpu: str


@app.post("/create-machine")
def create_machine(payload: CreateMachinePayload):
    return {"machine_name": payload.machine_name, "gpu" : payload.gpu}
