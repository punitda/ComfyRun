import { LoaderFunctionArgs } from "@remix-run/node";
import {
  json,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useNavigation,
} from "@remix-run/react";
import "./tailwind.css";

import { Toaster } from "~/components/ui/toaster";

import { ClerkApp, SignedIn, UserButton } from "@clerk/remix";
import { rootAuthLoader } from "@clerk/remix/ssr.server";
import LoadingIndicator from "./components/loading-indicator";
import GithubIcon from "./components/icons/github-icon";

export async function loader(args: LoaderFunctionArgs) {
  return rootAuthLoader(args, () => {
    return json({
      ENV: {
        APP_BUILDER_API_BASE_URL: process.env.APP_BUILDER_API_BASE_URL,
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
        <Toaster />
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function App() {
  const navigation = useNavigation();
  const location = useLocation();
  const isAuthPage = ["/sign-in", "/sign-up"].includes(location.pathname);

  return (
    <div className="flex flex-col">
      {!isAuthPage ? (
        <nav className="p-4 min-h-16">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-4 ml-auto">
              {location.pathname === "/" ? (
                <div className="w-5 h-5">
                  <Link
                    to="https://github.com/punitda/ComfyRun"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <GithubIcon />
                  </Link>
                </div>
              ) : null}
              <SignedIn>
                <Link to="/apps" hidden={location.pathname === "/apps"}>
                  Apps
                </Link>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </nav>
      ) : null}
      <main className="flex-grow">
        {navigation.state === "loading" ? <LoadingIndicator /> : null}
        <Outlet />
      </main>
    </div>
  );
}

export default ClerkApp(App);
