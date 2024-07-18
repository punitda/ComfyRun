import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [];
};

export default function Index() {
  return (
    <div className="font-sans p-4">
      <h1 className="text-3xl">Create Machine</h1>
    </div>
  );
}
