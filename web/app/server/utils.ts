import { json } from "@remix-run/react";
import {
  CreateAppRequestBody,
  OutputCustomNodesJson,
  OutputModel,
  APIResponse,
} from "~/lib/types";

export function generateCreateMachineRequestBody(
  formData: FormData
): CreateAppRequestBody {
  const custom_nodes = JSON.parse(
    formData.get("custom_nodes") as string
  ) as OutputCustomNodesJson;
  const models = JSON.parse(formData.get("models") as string) as OutputModel[];
  const machine_name = formData.get("machine_name") as string;
  const gpu = formData.get("gpu") as string;
  const additional_dependencies =
    (formData.get("dependencies") as string) ?? null;
  const idle_timeout = Number(formData.get("idle_timeout") as string);

  return {
    machine_name,
    gpu,
    custom_nodes,
    models,
    additional_dependencies,
    idle_timeout,
  };
}

export function sendErrorResponse<T>(
  error: string,
  status: number | undefined
) {
  return json<APIResponse<T>>(
    {
      result: "error",
      error: error,
    },
    { status: status }
  );
}

export function sendSuccessResponse<T>(data: T, status: number | undefined) {
  return json<APIResponse<T>>(
    {
      result: "success",
      data,
    },
    { status: status }
  );
}
