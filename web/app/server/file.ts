import { CloudCog } from "lucide-react";

export type FileSystemItem = {
  Filename: string;
  Type: "dir" | "file";
  Size?: string;
};

export async function fetchModelsFileForPath(
  path: string
): Promise<FileSystemItem[]> {
  const baseUrl = process.env.APP_BUILDER_API_BASE_URL;

  const url = new URL(`${baseUrl}/models`);
  if (path !== "") {
    url.searchParams.append("path", encodeURIComponent(path));
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      X_API_KEY: process.env.APP_BUILDER_API_KEY!,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
