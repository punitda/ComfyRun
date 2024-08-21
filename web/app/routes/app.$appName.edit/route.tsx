import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";

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
    return json({ editUrl: data["edit_url"] as string });
  } catch (error) {
    console.error("Error fetching edit workflow URL:", error);
    return json({ error: "Failed to load edit workflow URL" }, { status: 500 });
  }
}

export default function AppEditPage() {
  const data = useLoaderData<typeof loader>();
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="h-screen flex flex-col">
      <div className="flex-grow relative">
        {isLoading ? (
          <LoadingIndicator />
        ) : (
          data.editUrl && (
            <iframe
              title={data.editUrl}
              src={data.editUrl}
              className="w-full h-full border-0"
            />
          )
        )}
      </div>
    </div>
  );
}
