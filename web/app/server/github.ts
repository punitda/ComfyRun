import { custom_nodes, models } from "~/lib/data";
import { CustomNode, Model } from "~/lib/types";

const CUSTOM_NODES_URL =
  "https://raw.githubusercontent.com/ltdrdata/ComfyUI-Manager/main/custom-node-list.json";

const MODELS_URL =
  "https://raw.githubusercontent.com/ltdrdata/ComfyUI-Manager/main/model-list.json";

export async function getCustomNodes(): Promise<CustomNode[]> {
  const res = await fetch(CUSTOM_NODES_URL);
  // Return default cached custom_nodes if API fails
  if (!res.ok) return custom_nodes;
  const custom_nodes_response = await res.json();
  const result: CustomNode[] = custom_nodes_response.custom_nodes;
  return result;
}

export async function getModels(): Promise<Model[]> {
  const res = await fetch(MODELS_URL);
  // Return default cached models if API fails
  if (!res.ok) return models;

  const custom_models_response = await res.json();
  const result: Model[] = custom_models_response.models;
  return result;
}
