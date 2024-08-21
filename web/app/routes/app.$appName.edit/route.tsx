import { LoaderFunctionArgs, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { X } from "lucide-react";

import LoadingIndicator from "~/components/loading-indicator";

export async function loader({ params }: LoaderFunctionArgs) {
  const appName = params.appName;
  const url = `${process.env.APP_BUILDER_API_BASE_URL}/apps/${appName}/edit-workflow`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        X_API_KEY: process.env.APP_BUILDER_API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch edit URL");
    }

    const data = await response.json();
    console.log("Edit workflow url", data["edit_url"]);
    console.log("Run workflow url", data["run_url"]);
    return json({
      editUrl: data["edit_url"] as string,
      runUrl: data["run_url"] as string,
    });
  } catch (error) {
    console.error("Error fetching edit workflow URL:", error);
    return json({ error: "Failed to load edit workflow URL" }, { status: 500 });
  }
}

export default function AppEditPage() {
  const data = useLoaderData<typeof loader>();
  const [isLoading, setIsLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(true);

  // Once the edit url is loaded, wait 15 seconds before setting isLoading to false
  // This is to prevent the iframe from loading too quickly and giving error because the tunnel is not ready
  useEffect(() => {
    if ("editUrl" in data) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 15000);

      return () => clearTimeout(timer);
    }
  }, [data]);

  if ("error" in data) {
    return <div className="text-rose-500">{data.error}</div>;
  }

  return (
    <div className="h-screen flex flex-col relative">
      <div className="flex-grow relative">
        {isLoading ? (
          <LoadingIndicator />
        ) : (
          <>
            {data.editUrl && (
              <iframe
                title={data.editUrl}
                src={data.editUrl}
                className="w-full h-full border-0"
              />
            )}
            {showAlert && (
              <div className="absolute top-4 left-4 right-4 z-10">
                <Alert variant="default" className="pr-12 relative">
                  <AlertTitle>Heads up!</AlertTitle>
                  <AlertDescription>
                    You can use this page to edit your workflows. Please save
                    the workflow before closing the page. It runs on CPU to
                    avoid GPU costs while editing your workflows.
                    <br />
                    Please use this{" "}
                    <Link
                      to={data.runUrl}
                      className="underline"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      link
                    </Link>{" "}
                    to run your workflows on GPUs
                  </AlertDescription>
                  <button
                    onClick={() => setShowAlert(false)}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                    aria-label="Close alert"
                  >
                    <X size={16} />
                  </button>
                </Alert>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
