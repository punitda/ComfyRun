import { useLoaderData, useNavigate } from "@remix-run/react";
import { Folder, File, ChevronLeft } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { json, LoaderFunction } from "@remix-run/node";
import { fetchModelsFileForPath } from "~/server/file";

// Updated types
type FileSystemItem = {
  Filename: string;
  Type: "dir" | "file";
  Size?: string; // Optional size for files
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
    console.error("Error fetching items:", error);
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

  const renderItem = (item: FileSystemItem) => (
    <div key={item.Filename} className="py-2">
      {item.Type === "dir" ? (
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => navigateToFolder(item.Filename)}
        >
          <Folder size={16} className="mr-2" />
          {item.Filename.split("/").pop()}
        </Button>
      ) : (
        <div className="flex items-center px-3 py-2 justify-between">
          <div className="flex items-center">
            <File size={16} className="mr-2" />
            {item.Filename.split("/").pop()}
          </div>
          {item.Size && (
            <span className="text-sm text-muted-foreground">{item.Size}</span>
          )}
        </div>
      )}
    </div>
  );

  const title = currentPath
    ? currentPath.split("/").pop() || "Models"
    : "Models";

  return (
    <div className="h-[calc(100vh-2rem)] mx-4 my-2 flex flex-col">
      <div className="flex items-center mb-4">
        {currentPath && (
          <Button
            variant="ghost"
            size="sm"
            className="mr-2"
            onClick={navigateBack}
          >
            <ChevronLeft size={16} />
          </Button>
        )}
        <h1 className="text-base font-semibold leading-6 text-primary/90">
          {title}
        </h1>
      </div>
      <Card className="mb-8">
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-12rem)] rounded-md">
            {items.length > 0 ? (
              items.map(renderItem)
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No files
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
