import {
  CreateMachineRequestBody,
  OutputCustomNodesJson,
  OutputModel,
} from "~/lib/types";

export function generateCreateMachineRequestBody(
  formData: FormData
): CreateMachineRequestBody {
  const custom_nodes = JSON.parse(
    formData.get("custom_nodes") as string
  ) as OutputCustomNodesJson;
  const models = JSON.parse(formData.get("models") as string) as OutputModel[];
  const machine_name = formData.get("machine_name") as string;
  const gpu = formData.get("gpu") as string;
  const additional_dependencies =
    (formData.get("dependencies") as string) ?? null;

  return {
    machine_name,
    gpu,
    custom_nodes,
    models,
    additional_dependencies,
  };
}
