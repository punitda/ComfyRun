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

  return (
    <div className="px-16 lg:px-32 mt-32">
      <div className="sm:flex sm:items-center">
        <div className="flex items-center">
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
          <div>
            <h1 className="text-base font-semibold leading-6 text-primary/90">
              {isRootDirectory ? "Models" : currentPath.split("/").pop()}
            </h1>
            {isRootDirectory ? (
              <p className="mt-2 text-sm text-primary/90">
                A list of models stored in{" "}
                <span>
                  <a
                    href="https://modal.com/docs/guide/volumes"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline"
                  >
                    Modal.Volume
                  </a>
                </span>{" "}
                shared between your apps.
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-accent/50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-primary sm:pl-6"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-primary"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-primary"
                    >
                      Last Modified
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-primary"
                    >
                      Size
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {items.length > 0 ? (
                    items.map((item) => (
                      <tr
                        key={item.Filename}
                        className="hover:bg-accent cursor-pointer"
                        onClick={() =>
                          item.Type === "dir" && navigateToFolder(item.Filename)
                        }
                      >
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-primary sm:pl-6">
                          <div className="flex items-center">
                            {item.Type === "dir" ? (
                              <Folder
                                size={16}
                                className="mr-2 text-primary flex-shrink-0"
                              />
                            ) : (
                              <File
                                size={16}
                                className="mr-2 text-primary/90 flex-shrink-0"
                              />
                            )}
                            <span className="truncate">
                              {item.Filename.split("/").pop()}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-primary">
                          {item.Type === "dir" ? "Directory" : "File"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-primary">
                          {formatRelativeTime(item["Created/Modified"])}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-primary">
                          {item.Type === "file" && item.Size ? item.Size : ""}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-primary">
                        No files
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
