import { ActionFunctionArgs, json } from "@remix-run/node";
import { CustomNode } from "../../lib/types";

export async function action({ request }: ActionFunctionArgs) {
  const clonedRequest = request.clone();
  const url = `${process.env.MACHINE_BUILDER_API_BASE_URL}/generate-custom-nodes`;

  try {
    const response = await fetch(url, clonedRequest);
    const custom_nodes = await response.json();
    const nodes: CustomNode[] = custom_nodes.map(
      (custom_node: string): CustomNode => ({
        reference: custom_node,
      })
    );
    return json({ nodes }, { status: 200 });
  } catch (error) {
    return json(
      { nodes: [], error: "Unable to fetch custom nodes from workflow file" },
      { status: 400 }
    );
  }
}
