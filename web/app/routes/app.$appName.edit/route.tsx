import { LoaderFunctionArgs, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";

import LoadingIndicator from "~/components/loading-indicator";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { X } from "lucide-react";

export async function loader({ params }: LoaderFunctionArgs) {
  const appName = params.appName;
  const url = `${process.env.APP_BUILDER_API_BASE_URL}/apps/${appName}/workflow-urls`;

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
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log("Received message:", event);
      const data = JSON.parse(event.data);

      if (data.type === "show_edit_page_prompt") {
        setShowDialog(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  if ("error" in data) {
    return <div className="text-rose-500">{data.error}</div>;
  }

  return (
    <div className="h-screen flex flex-col relative">
      <div className="flex-grow relative">
        {!isIframeLoaded && <LoadingIndicator />}
        {data.editUrl && (
          <iframe
            title={data.editUrl}
            src={data.editUrl}
            className={`w-full h-full border-0 ${
              isIframeLoaded ? "" : "hidden"
            }`}
            onLoad={() => {
              setIsIframeLoaded(true);
            }}
          />
        )}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Heads up!</DialogTitle>
              <DialogDescription>
                You can only quickly edit your workflows on this page as it runs
                on CPU. Use the Run button below to open a new tab where you can
                run your workflows on GPUs.
                <br />
                <br />
                Note: Remember to save the workflow file before closing the
                page.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowDialog(false);
                  window.open(data.runUrl, "_blank");
                }}
              >
                Run
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {isIframeLoaded && (
          <div className="absolute top-4 left-4 right-4 z-10">
            <Alert variant="default" className="pr-12 relative">
              <AlertTitle>Heads up!</AlertTitle>
              <AlertDescription>
                You can use this page to edit your workflows. It runs on CPU to
                avoid GPU costs while editing your workflows. Please save the
                workflow file before closing the page.
                <br />
                Use the Run button to open a new tab where you can run your
                workflows on GPUs.
              </AlertDescription>
              <button
                onClick={() => {
                  const alert = document.querySelector(".alert");
                  if (alert) alert.remove();
                }}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                aria-label="Close alert"
              >
                <X size={16} />
              </button>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}
