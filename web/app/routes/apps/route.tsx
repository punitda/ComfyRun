import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import {
  Link,
  useFetcher,
  useLoaderData,
  useRevalidator,
} from "@remix-run/react";
import { APIResponse, App } from "~/lib/types";
import { requireAuth } from "~/server/auth";

import { MoreHorizontal, PlusIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";

import { formatRelativeTime } from "~/lib/utils";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

import { useEffect, useState } from "react";
import { useToast } from "~/components/ui/use-toast";
import { DELETE_APP_KEY } from "~/lib/constants";

export async function action({ request }: LoaderFunctionArgs) {
  const formData = await request.formData();
  const actionType = formData.get("actionType");
  const appId = formData.get("appId");

  const url = `${process.env.MACHINE_BUILDER_API_BASE_URL}/apps/${appId}`;

  if (actionType === "delete") {
    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          X_API_KEY: process.env.MACHINE_BUILDER_API_KEY!,
        },
      });
      const data = await response.json();
      console.log("data", data);
      if (!response.ok)
        return json<APIResponse<App[]>>(
          { error: "Unable to delete app", result: "error" },
          { status: 400 }
        );

      return json<APIResponse<string>>(
        { data: data["app_id"], result: "success" },
        { status: 200 }
      );
    } catch (error) {
      console.error("Delete app API error", error);
      return json<APIResponse<App[]>>(
        { error: "Unable to delete app", result: "error" },
        { status: 400 }
      );
    }
  }
}

export const loader = async (args: LoaderFunctionArgs) => {
  const data = await requireAuth(args);
  if ("error" in data) {
    return redirect("/sign-in");
  }

  const url = `${process.env.MACHINE_BUILDER_API_BASE_URL}/apps`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        X_API_KEY: process.env.MACHINE_BUILDER_API_KEY!,
      },
    });
    const apps = (await response.json()) as App[];
    return json<APIResponse<App[]>>(
      { data: apps, result: "success" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get apps API error", error);
    return json<APIResponse<App[]>>(
      { error: "Unable to fetch list of apps", result: "error" },
      { status: 400 }
    );
  }
};

export default function AppsPage() {
  const data = useLoaderData<typeof loader>();

  if (data.result === "success") {
    const apps = data.data;
    return (
      <div className="lg:px-32 px-16 mt-32">
        {apps?.length === 0 ? <NoAppsLayout /> : <AppsLayout apps={apps} />}
      </div>
    );
  }

  if (data.result === "error") {
    return <ErrorLayout />;
  }
  return null;
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
          <Link to="/create-app">New App</Link>
        </Button>
      </div>
    </div>
  );
}

interface AppsLayoutProps {
  apps: App[];
}

function AppsLayout({ apps }: AppsLayoutProps) {
  const deleteFetcher = useDeleteFetcherAction();
  const [appStateFilter, setAppStateFilter] = useState<string>("deployed");

  const displayApps = apps.filter((app) => appStateFilter === app.state);
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
            <Link to="/create-app">Create App</Link>
          </Button>
        </div>
      </div>
      <div className="bg-white py-10">
        <div className="flex justify-between">
          <ToggleGroup
            variant="outline"
            size="sm"
            type="single"
            defaultValue="deployed"
            className="ml-auto"
            onValueChange={(value) => {
              setAppStateFilter(value);
            }}
          >
            <ToggleGroupItem
              value="deployed"
              aria-label="Toggle bold"
              key="deployed"
            >
              <p>Deployed</p>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="stopped"
              aria-label="Toggle italic"
              key="stopped"
            >
              <p>Stopped</p>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
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
                {appStateFilter === "deployed" ? "Deployed at" : "Stopped at"}
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
            {displayApps.map((app) => {
              const relativeTime = formatRelativeTime(
                appStateFilter === "deployed"
                  ? app.created_at
                  : app.stopped_at ?? app.created_at
              );
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
                    {app.state === "deployed" ? (
                      <Dialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DialogTrigger asChild>
                              <DropdownMenuItem>Delete</DropdownMenuItem>
                            </DialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              Are you sure you want to delete the app?
                            </DialogTitle>
                            <DialogDescription>
                              This action cannot be undone. Are you sure you
                              want to permanently delete this app?
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <deleteFetcher.Form method="post">
                              <input
                                type="hidden"
                                name="actionType"
                                value="delete"
                              />
                              <input
                                type="hidden"
                                name="appId"
                                value={app.app_id}
                              />
                              <DialogClose asChild>
                                <Button type="submit">Delete</Button>
                              </DialogClose>
                            </deleteFetcher.Form>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {displayApps.length === 0 ? (
          <div className="flex items-center mt-32 justify-center text-primary">
            {`No ${appStateFilter} apps`}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ErrorLayout() {
  const revalidator = useRevalidator();
  return (
    <div className="lg:px-32 px-16 mt-32 flex flex-col items-center">
      <ExclamationTriangleIcon className="size-6 text-destructive" />
      <h3 className="mt-2 text-sm font-semibold text-primary">
        Uh-oh! Something went wrong
      </h3>
      <p className="mt-1 text-sm text-primary/90">
        There was a problem with your request.
      </p>
      <div className="mt-6">
        <Button onClick={() => revalidator.revalidate()}>Try again</Button>
      </div>
    </div>
  );
}

function useDeleteFetcherAction() {
  const deleteFetcher = useFetcher<typeof action>({ key: DELETE_APP_KEY });
  const { toast } = useToast();

  useEffect(() => {
    if (deleteFetcher.state === "submitting") {
      toast({
        title: "Deleting app",
      });
      return;
    }
    if (
      deleteFetcher.state === "idle" &&
      deleteFetcher.data &&
      deleteFetcher.data.result === "error"
    ) {
      toast({
        variant: "destructive",
        title: "Error deleting app",
        description: deleteFetcher.data.error,
      });
      return;
    }

    if (
      deleteFetcher.state === "idle" &&
      deleteFetcher.data &&
      deleteFetcher.data.result === "success"
    ) {
      toast({
        variant: "success",
        title: "App deleted",
      });
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteFetcher]);

  return deleteFetcher;
}
