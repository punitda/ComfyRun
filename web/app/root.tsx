import {
  json,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/node";
import "./tailwind.css";

import { Toaster } from "~/components/ui/toaster";

import { rootAuthLoader } from "@clerk/remix/ssr.server";
import { ClerkApp } from "@clerk/remix";

export async function loader(args: LoaderFunctionArgs) {
  return rootAuthLoader(args, () => {
    return json({
      ENV: {
        MACHINE_BUILDER_API_BASE_URL: process.env.MACHINE_BUILDER_API_BASE_URL,
      },
    });
  });
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>();
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="flex flex-col min-h-screen">
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
          }}
        />
        {children}
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function App() {
  return <Outlet />;
}

export default ClerkApp(App);
