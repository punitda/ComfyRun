import os
from modal import Image
from config import config

current_directory = os.path.dirname(os.path.realpath(__file__))

default_dependencies = "comfy-cli==1.0.36"
additional_dependencies = config["additional_dependencies"]
dependencies_str = default_dependencies if not additional_dependencies else f"{default_dependencies}, {additional_dependencies}"
dependencies: list[str] = [item.strip()
                           for item in dependencies_str.split(',')]


def create_comfyui_image(use_nvidia: bool = True):
    install_command = "comfy --skip-prompt install --nvidia" if use_nvidia else "comfy --skip-prompt install --cpu"

    return (Image.debian_slim(python_version="3.10")
            .apt_install("git")
            .pip_install(dependencies)
            .run_commands(install_command)
            .run_commands("rm -rf /root/comfy/ComfyUI/models")
            .copy_local_dir(f"{current_directory}/comfyrun", "/root/comfy/ComfyUI/custom_nodes/comfyrun")
            .copy_local_file(f"{current_directory}/custom_nodes.json", "/root/")
            .run_commands("comfy --skip-prompt node install-deps --deps=/root/custom_nodes.json")
            .copy_local_file(f"{current_directory}/models.json", "/root/")
            )
