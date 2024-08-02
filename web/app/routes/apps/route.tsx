import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { requireAuth } from "~/server/auth";
import { App } from "~/lib/types";
import { Link, useLoaderData } from "@remix-run/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { MoreHorizontal, PlusIcon } from "lucide-react";
import { formatRelativeTime } from "~/lib/utils";

export const loader = async (args: LoaderFunctionArgs) => {
  const data = await requireAuth(args);
  if ("error" in data) {
    return redirect("/sign-in");
  }

  return json({ apps }, { status: 200 });
};

export default function AppsPage() {
  const { apps } = useLoaderData<typeof loader>();
  return (
    <div className="lg:px-32 px-16 mt-32">
      {apps.length === 0 ? <NoAppsLayout /> : <AppsLayout apps={apps} />}
    </div>
  );
}

function NoAppsLayout() {
  return (
    <div className="text-center">
      <svg
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="mx-auto h-12 w-12 text-gray-400"
      >
        <path
          d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <h3 className="mt-2 text-sm font-semibold text-primary/90">No apps</h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by creating a new app.
      </p>
      <div className="mt-6">
        <Button>
          <PlusIcon aria-hidden="true" className="-ml-0.5 mr-1.5 h-5 w-5" />
          <Link to="/create-machine">New App</Link>
        </Button>
      </div>
    </div>
  );
}

interface AppsLayoutProps {
  apps: App[];
}

function AppsLayout({ apps }: AppsLayoutProps) {
  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-primary/90">
            Apps
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of apps that are currently deployed/running or recently
            stopped.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Button>
            <Link to="/create-machine">Create App</Link>
          </Button>
        </div>
      </div>
      <div className="bg-white py-10">
        <table className="mt-6 w-full whitespace-nowrap text-left rounded-md">
          <colgroup>
            <col className="w-full sm:w-4/12" />
            <col className="lg:w-4/12" />
            <col className="lg:w-2/12" />
            <col className="lg:w-1/12" />
            <col className="lg:w-1/12" />
          </colgroup>
          <thead className="border-b border-border/10 text-sm leading-6 text-primary">
            <tr>
              <th
                scope="col"
                className="py-2 pl-4 pr-8 font-semibold sm:pl-6 lg:pl-8"
              >
                Name
              </th>
              <th
                scope="col"
                className="py-2 pl-0 pr-4 text-right font-semibold sm:pr-8 sm:text-left lg:pr-20"
              >
                Status
              </th>
              <th
                scope="col"
                className="hidden py-2 pl-0 pr-8 font-semibold md:table-cell lg:pr-20"
              >
                Deployed at
              </th>
              <th
                scope="col"
                className="py-2 pl-0 pr-4 text-right font-semibold sm:table-cell sm:pr-6 lg:pr-8"
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {apps.map((app) => {
              const relativeTime = formatRelativeTime(app.created_at);
              return (
                <tr key={app.app_id}>
                  <td className="py-4 pl-4 pr-8 sm:pl-6 lg:pl-8">
                    <div className="truncate text-sm font-medium leading-6 text-primary/80">
                      {app.description}
                    </div>
                  </td>

                  <td className="py-4 pl-0 pr-4 text-sm leading-6 sm:pr-8 lg:pr-20">
                    <div className="flex items-center justify-end gap-x-2 sm:justify-start">
                      <time
                        dateTime={app.created_at}
                        className="text-gray-400 sm:hidden"
                      >
                        {relativeTime}
                      </time>
                      <div
                        className={`
                ${
                  app.state === "deployed"
                    ? "text-green-400 bg-green-400/10"
                    : "text-rose-400 bg-rose-400/10"
                }
                flex-none rounded-full p-1`}
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-current" />
                      </div>
                      <div className="hidden text-primary/80 sm:block">
                        {app.state}
                      </div>
                    </div>
                  </td>

                  <td className="hidden py-4 pl-0 pr-4 md:table-cell sm:pr-8 text-sm leading-6 text-primary/40">
                    <time dateTime={app.created_at}>{relativeTime}</time>
                  </td>

                  <td className="py-2 pl-0 pr-4 text-right sm:table-cell sm:pr-6 lg:pr-8">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const apps: App[] = [
  {
    app_id: "ap-V47fsI4kz1NyYn3xBKz31K",
    description: "upscalermachine",
    state: "deployed",
    tasks: "0",
    created_at: "2024-07-31 17:56:39+05:30",
    stopped_at: null,
  },
  {
    app_id: "ap-uuNuRZpkhaF8Y5gV5Fu6W5",
    description: "upscaler-machine",
    state: "deployed",
    tasks: "0",
    created_at: "2024-07-25 15:58:32+05:30",
    stopped_at: null,
  },
  {
    app_id: "ap-uEwZw6Dmr9ZLsAc778n6CA",
    description: "instantid-workflow",
    state: "deployed",
    tasks: "0",
    created_at: "2024-07-05 16:22:57+05:30",
    stopped_at: null,
  },
  {
    app_id: "ap-RB6wFDmpvOrOdqZLVFyDRz",
    description: "ipadapter-workflow",
    state: "deployed",
    tasks: "0",
    created_at: "2024-07-03 16:41:28+05:30",
    stopped_at: null,
  },
  {
    app_id: "ap-H9pWzs5PivoGyuFkoH3E6j",
    description: "upscaling-workflow",
    state: "stopped",
    tasks: "0",
    created_at: "2024-07-30 18:38:02+05:30",
    stopped_at: "2024-08-02 12:09:05+05:30",
  },
  {
    app_id: "ap-L0qDTQwXdKVYcUXhoKpRdW",
    description: "ipadapterlearning",
    state: "stopped",
    tasks: "0",
    created_at: "2024-07-28 17:34:56+05:30",
    stopped_at: "2024-08-02 11:55:18+05:30",
  },
];
