import subprocess
import shutil
from config import config
from modal import (App, enter, Secret, web_server)
from helpers import (models_volume, MODELS_PATH, unzip_insight_face_models)
from comfy_config import create_comfyui_image

machine_name = config["machine_name"]
gpu_config = config["gpu"]
idle_timeout = config["idle_timeout"]

image = create_comfyui_image()

app = App(
    f"{machine_name}-editing",
    image=image,
    volumes={
        MODELS_PATH: models_volume
    },
    secrets=[Secret.from_name("civitai-secret")]
)


@app.cls(
    cpu=4.0,
    image=image,
    timeout=idle_timeout,
    allow_concurrent_inputs=100,
    concurrency_limit=1,
)
class EditingWorkflow:
    @enter()
    def move_files(self):
        print("Copying models")
        shutil.move(MODELS_PATH, "/root/comfy/ComfyUI/models")
        print("Models copied!!")
        unzip_insight_face_models()

    def _run_comfyui_server(self, port=8188):
        cmd = f"comfy --skip-prompt launch -- --cpu --listen 0.0.0.0 --port {port}"
        subprocess.Popen(cmd, shell=True)

    @web_server(8188, startup_timeout=60)
    def ui(self):
        self._run_comfyui_server()
