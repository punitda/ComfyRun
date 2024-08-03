import { ActionFunctionArgs } from "@remix-run/node";
import { CustomNode } from "~/lib/types";
import { sendErrorResponse, sendSuccessResponse } from "~/server/utils";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const url = `${process.env.MACHINE_BUILDER_API_BASE_URL}/generate-custom-nodes`;

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      return sendErrorResponse<CustomNode[]>(
        "Unable to fetch custom nodes from workflow file",
        response.status
      );
    }

    const custom_nodes = await response.json();
    const nodes: CustomNode[] = custom_nodes.map(
      (custom_node: string): CustomNode => ({
        reference: custom_node,
      })
    );

    if (nodes.length === 0) {
      return sendErrorResponse<CustomNode[]>(
        "No custom nodes found in the uploaded workflow file",
        400
      );
    }

    return sendSuccessResponse<CustomNode[]>(nodes, 200);
  } catch (error) {
    console.error("upload-workflow-file API error", error);
    return sendErrorResponse<CustomNode[]>(
      "Unable to fetch custom nodes from workflow file",
      500
    );
  }
}
