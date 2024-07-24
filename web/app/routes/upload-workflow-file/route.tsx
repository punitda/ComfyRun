import { ActionFunctionArgs, json } from "@remix-run/node";
import { custom_nodes } from "~/lib/data";
import { CustomNode } from "~/lib/types";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  for (const value of formData.values()) {
    console.log(value);
  }
  const nodes: CustomNode[] = [custom_nodes[0], custom_nodes[1]];
  return json({ nodes }, { status: 200 });
}
