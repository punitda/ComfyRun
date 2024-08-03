import { json, useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useDebounce, cn } from "~/lib/utils";
import { Model } from "~/lib/types";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";

import { Check, ChevronsUpDown, LoaderIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  const searchUrl = getUrl(query);

  const res = await fetch(searchUrl);
  const emptyModels: Model[] = [];
  if (!res.ok) return json({ models: emptyModels }, { status: 200 }); //throw new Error("Search error");

  const searchResults = await res.json();

  const models = mapModelsList(searchResults);
  return json({ models }, { status: 200 });
}

function getUrl(search: string | null) {
  const baseUrl = "https://civitai.com/api/v1/models";
  const searchParams: Record<string, string> = {
    limit: "5",
    sort: "Most Downloaded",
  };

  if (search) {
    searchParams["query"] = search;
  }

  const url = new URL(baseUrl);
  Object.keys(searchParams).forEach((key) =>
    url.searchParams.append(key, searchParams[key])
  );

  return url;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapModelsList(models: any): Model[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return models.items.flatMap((item: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return item.modelVersions.map((v: any) => {
      return {
        name: `${item.name} ${v.name} (${v.files[0].name})`,
        type: v.type,
        base: v.baseModel,
        save_path: "default",
        description: item.description,
        reference: "",
        filename: v.files[0].name,
        url: v.files[0].downloadUrl,
      };
    });
  });
}

interface CivitAIModelComboBoxProps {
  default_models?: Model[];
  selectedModels: Model[];
  onModelSelected: (model: Model[]) => void;
}

export function CivitAIModelComboBox({
  default_models,
  selectedModels,
  onModelSelected,
}: CivitAIModelComboBoxProps) {
  const searchDetails = useFetcher<typeof loader>();
  const [query, setQuery] = useState<string>();

  const [debouncedQuery] = useDebounce(query, 300);

  const models =
    query?.length ?? 0 > 0 ? searchDetails?.data?.models : default_models;

  useEffect(() => {
    if (debouncedQuery) {
      searchDetails.load(`/civitai-search?q=${debouncedQuery}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const [open, setOpen] = useState(false);

  function onSelected(node: Model) {
    const prevSelectedModels = selectedModels;
    if (
      prevSelectedModels.some(
        (selectedModel) =>
          selectedModel.url + selectedModel.name === node.url + node.name
      )
    ) {
      onModelSelected(
        prevSelectedModels.filter(
          (selectedModel) =>
            selectedModel.url + selectedModel.name !== node.url + node.name
        )
      );
    } else {
      onModelSelected([...prevSelectedModels, node]);
    }
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedModels.length == 0
            ? "Search models"
            : `Selected models : ${selectedModels.length}`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px]">
        <Command shouldFilter={false}>
          <div className="relative inline-block">
            <CommandInput
              placeholder="Search Models..."
              onValueChange={(search) => {
                setQuery(search);
              }}
            />
            {searchDetails.state !== "idle" ? (
              <LoaderIcon
                size={16}
                className="animate-spin absolute bottom-1/4 right-0"
              />
            ) : null}
          </div>

          {(query?.length ?? 0 > 0) && searchDetails.state === "idle" ? (
            <CommandEmpty>No models found.</CommandEmpty>
          ) : null}
          <CommandList>
            <CommandGroup>
              {models?.map((model) => (
                <CommandItem
                  key={model.url + model.name}
                  value={model.url}
                  onSelect={() => {
                    onSelected(model);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedModels.some(
                        (selectedNode) => selectedNode.url === model.url
                      )
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {model.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
