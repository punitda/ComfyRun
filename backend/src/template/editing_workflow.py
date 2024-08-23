import subprocess
import shutil
import os
from config import config
from modal import (App, build,
                   Secret, method, forward, web_endpoint, Queue)
from helpers import (models_volume, MODELS_PATH, unzip_insight_face_models)
from comfy_config import comfyui_image

machine_name = config["machine_name"]
gpu_config = config["gpu"]
idle_timeout = config["idle_timeout"]


app = App(
    machine_name,
    image=comfyui_image,
    volumes={
        MODELS_PATH: models_volume
    },
    secrets=[Secret.from_name("civitai-secret")]
)


@app.cls(
    cpu=4.0,
    memory=16384,
    image=comfyui_image,
    timeout=idle_timeout,
)
class EditingWorkflow:
    @build()
    def download(self):
        print("Copying models to correct directory - This might take a few more seconds")
        shutil.copytree(
            MODELS_PATH, "/root/comfy/ComfyUI/models", dirs_exist_ok=True)
        print("Models copied!!")
        unzip_insight_face_models()

    @method()
    def run_comfy_in_tunnel(self, q):
        with forward(8888) as tunnel:
            url = tunnel.url
            print(f"Starting ComfyUI at {url}")
            q.put(url)
            subprocess.run(
                [
                    "comfy",
                    "--skip-prompt",
                    "launch",
                    "--",
                    "--cpu",
                    "--listen",
                    "0.0.0.0",
                    "--port",
                    "8888",
                ],
                check=False
            )


@app.function()
@web_endpoint(method="GET")
def get_tunnel_url():
    workflow = EditingWorkflow()
    with Queue.ephemeral() as q:
        workflow.run_comfy_in_tunnel.spawn(q)
        url = q.get()
    return {"edit_url": url}
