import { useLoaderData, useNavigate } from "@remix-run/react";
import { Folder, File, ChevronLeft } from "lucide-react";
import { json, LoaderFunction } from "@remix-run/node";
import { fetchModelsFileForPath } from "~/server/file";
import { Button } from "~/components/ui/button";
import { formatRelativeTime } from "~/lib/utils";

// Updated types
type FileSystemItem = {
  Filename: string;
  Type: "dir" | "file";
  Size: string;
  "Created/Modified": string;
};

type LoaderData = {
  items: FileSystemItem[];
  currentPath: string;
};

// Loader function
export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const currentPath = url.searchParams.get("path") || "";

  try {
    const items = await fetchModelsFileForPath(currentPath);
    return json({ items, currentPath });
  } catch (error) {
    console.error(`Error fetching list of models for ${currentPath}`, error);
    return json(
      { items: [], currentPath, error: "Failed to fetch items" },
      { status: 500 }
    );
  }
};

// Main component
export default function FileBrowser() {
  const { items, currentPath } = useLoaderData<LoaderData>();
  const navigate = useNavigate();

  const navigateToFolder = (path: string) => {
    navigate(`?path=${encodeURIComponent(path)}`);
  };

  const navigateBack = () => {
    navigate(-1);
  };

  const isRootDirectory = currentPath === "";

  const renderItem = (item: FileSystemItem) => (
    <div
      key={item.Filename}
      className="flex items-center py-4 px-4 hover:bg-accent cursor-pointer"
      onClick={() => item.Type === "dir" && navigateToFolder(item.Filename)}
    >
      <div className="flex-1 flex items-center min-w-0">
        {item.Type === "dir" ? (
          <Folder size={16} className="mr-2 text-primary flex-shrink-0" />
        ) : (
          <File size={16} className="mr-2 text-primary/90 flex-shrink-0" />
        )}
        <span className="text-sm truncate">
          {item.Filename.split("/").pop()}
        </span>
      </div>
      <div className="hidden sm:flex items-center space-x-4 flex-shrink-0">
        <span className="text-xs text-primary w-20">
          {item.Type === "dir" ? "Directory" : "File"}
        </span>
        <span className="text-xs text-primary w-32">
          {formatRelativeTime(item["Created/Modified"])}
        </span>
        {item.Type === "file" && item.Size && (
          <span className="text-xs text-primary w-16">{item.Size}</span>
        )}
      </div>
    </div>
  );

  const hasFiles = items.some((item) => item.Type === "file");

  return (
    <div className="lg:px-32 px-16 mt-32">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center min-w-0">
            {!isRootDirectory && (
              <Button
                variant="ghost"
                size="sm"
                className="mr-2 flex-shrink-0"
                onClick={navigateBack}
              >
                <ChevronLeft size={16} />
              </Button>
            )}
            <h1 className="text-base font-semibold leading-6 text-primary/90">
              {isRootDirectory
                ? "comfyui-models"
                : currentPath.split("/").pop()}
            </h1>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <div className="hidden sm:flex items-center py-4 text-sm font-medium text-primary border-b bg-accent/50 px-4">
              <span className="flex-1">Name</span>
              <div className="flex items-center space-x-4 flex-shrink-0">
                <span className="w-20">Type</span>
                <span className="w-32">Last modified</span>
                {hasFiles && <span className="w-16">Size</span>}
              </div>
            </div>
            <div className="divide-y">
              {items.length > 0 ? (
                items.map(renderItem)
              ) : (
                <div className="py-4 text-center text-primary">No files</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
