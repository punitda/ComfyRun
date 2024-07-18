import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [];
};

export default function Index() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">Form goes here</div>
    </div>
  );
}
