import { ActionFunctionArgs } from "@remix-run/node";
import { CustomNode, Model, UploadWorkflowFileResponse } from "~/lib/types";
import { sendErrorResponse, sendSuccessResponse } from "~/server/utils";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const url = `${process.env.APP_BUILDER_API_BASE_URL}/generate-custom-nodes`;

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      return sendErrorResponse<UploadWorkflowFileResponse>(
        "Unable to fetch custom nodes from workflow file",
        response.status
      );
    }

    const data = await response.json();
    const nodes: CustomNode[] = data.custom_nodes.map(
      (custom_node: string): CustomNode => ({
        reference: custom_node,
      })
    );
    const models: Model[] = data.models;

    if (nodes.length === 0) {
      return sendErrorResponse<UploadWorkflowFileResponse>(
        "No custom nodes found in the uploaded workflow file",
        400
      );
    }

    return sendSuccessResponse<UploadWorkflowFileResponse>(
      { nodes, models },
      200
    );
  } catch (error) {
    console.error("upload-workflow-file API error", error);
    return sendErrorResponse<UploadWorkflowFileResponse>(
      "Unable to fetch custom nodes from workflow file",
      500
    );
  }
}
