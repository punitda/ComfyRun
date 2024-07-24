import type { MetaFunction } from "@remix-run/node";
import Hero from "~/components/hero";

export const meta: MetaFunction = () => {
  return [];
};

export default function Index() {
  return (
    <div className="container mx-auto sm:px-6 lg:px-8 bg-white min-h-screen">
      <Hero />
    </div>
  );
}
