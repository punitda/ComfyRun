import subprocess
import shutil
import json
import os
from config import config

from modal import (App, web_server, Secret, build)
from helpers import (models_volume, MODELS_PATH,
                     download_models, unzip_insight_face_models)
from comfy_config import create_comfyui_image

machine_name = config["machine_name"]
gpu_config = config["gpu"]
idle_timeout = config["idle_timeout"]

image = create_comfyui_image(use_nvidia=True)
app = App(
    machine_name,
    image=image,
    volumes={
        MODELS_PATH: models_volume
    },
    secrets=[Secret.from_name("civitai-secret")]
)


@app.cls(
    gpu=gpu_config,
    image=image,
    timeout=idle_timeout,
    container_idle_timeout=idle_timeout,
    allow_concurrent_inputs=100,
    # Restrict to 1 container because we want to our ComfyUI session state
    # to be on a single container.
    concurrency_limit=1,
)
class ComfyWorkflow:
    @build()
    def download(self):
        with open("/root/models.json", 'r', encoding='utf-8') as file:
            models = json.load(file)
            downloaded = download_models(models, os.environ["CIVITAI_TOKEN"])
            models_volume.commit()
            if downloaded:
                print("Copying models")
                shutil.move(MODELS_PATH, "/root/comfy/ComfyUI/models")
                print("Models copied!!")
                unzip_insight_face_models()

    def _run_comfyui_server(self, port=8188):
        cmd = f"comfy --skip-prompt launch -- --listen 0.0.0.0 --port {port}"
        subprocess.Popen(cmd, shell=True)

    @web_server(8188, startup_timeout=60)
    def ui(self):
        self._run_comfyui_server()
