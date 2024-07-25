from pathlib import Path
import subprocess
import shutil
import os
from modal import (Volume)

models_volume = Volume.from_name("model-checkpoints", create_if_missing=True)

MOUNT_PATH: Path = Path("/mnt")
MODELS_PATH: Path = MOUNT_PATH / "models"


CLIP_VISION_ROOT_PATH: Path = Path("/mnt/models/clip_vision")
SOURCE_CLIP_VISION_BIG_PATH: Path = CLIP_VISION_ROOT_PATH / \
    "ipadapter-clip-vision-big/model.safetensors"
SOURCE_CLIP_VISION_SMALL_PATH: Path = CLIP_VISION_ROOT_PATH / \
    "ipadapter-clip-vision-small/model.safetensors"

DEST_CLIP_VISION_BIG_PATH: Path = CLIP_VISION_ROOT_PATH / \
    "CLIP-ViT-bigG-14-laion2B-39B-b160k.safetensors"
DEST_CLIP_VISION_SMALL_PATH: Path = CLIP_VISION_ROOT_PATH / \
    "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors"

ANTELOPEV2_MODEL_ZIP_PATH: Path = Path(
    "/mnt/models/insightface/models/antelopev2.zip")
ANTELOPEV2_DEST_PATH: Path = Path("/mnt/models/insightface/models")

common_model_names = ["model.safetensors", "diffusion_pytorch_model.safetensors",
                      "diffusion_pytorch_model.fp16.safetensors", "model.bin", "diffusion_pytorch_model.fp16.bin"]
CIVITAI_BASE_URL = "https://civitai.com"


def download_models(models, civitai_token) -> bool:
    for model in models:
        model_name = model["name"]
        download_url = model["url"]
        download_path = model["download_path"]
        file_name = download_url.split("/")[-1]
        if CIVITAI_BASE_URL in download_url or file_name in common_model_names:
            checkpoint_path: Path = Path(download_path) / model_name
            relative_path: Path = checkpoint_path
        else:
            checkpoint_path: Path = Path(download_path) / file_name
            relative_path = Path(download_path)
        print(f"checkpoint_path: {checkpoint_path}")
        print(f"checkpoint_path exists : {checkpoint_path.exists()}")

        if not checkpoint_path.exists():
            print(f"Downloading {model_name} ....")
            cmd = f"comfy --skip-prompt model download --url {download_url} --relative-path {relative_path} --set-civitai-api-token {civitai_token}"
            download_process = subprocess.Popen(
                cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            # Wait for the process to complete
            download_process.wait()

            # Optionally, check the return code and handle any errors
            return_code = download_process.returncode
            if return_code != 0:
                print(f"Model download failed with return code {return_code}")
                return False
            else:
                print(f"Model {model_name} downloaded successfully.")
        else:
            print(f"skipping download of {model_name}. File exists")
    return True


def move_clip_vision_files():
    if not DEST_CLIP_VISION_BIG_PATH.exists():
        print(f"Moving big clip vision model to {DEST_CLIP_VISION_BIG_PATH}")
        shutil.move(SOURCE_CLIP_VISION_BIG_PATH, DEST_CLIP_VISION_BIG_PATH)
    if not DEST_CLIP_VISION_SMALL_PATH.exists():
        print(
            f"Moving small clip vision model to {DEST_CLIP_VISION_SMALL_PATH}")
        shutil.move(SOURCE_CLIP_VISION_SMALL_PATH, DEST_CLIP_VISION_SMALL_PATH)


def unzip_insight_face_models():
    if ANTELOPEV2_MODEL_ZIP_PATH.exists():
        print("Unzipping antelopev2..")
        shutil.unpack_archive(ANTELOPEV2_MODEL_ZIP_PATH, ANTELOPEV2_DEST_PATH)
        os.remove(ANTELOPEV2_MODEL_ZIP_PATH)
