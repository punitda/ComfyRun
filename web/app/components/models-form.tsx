import { useEffect, useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";

import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

import { Model } from "~/lib/types";
import { cn } from "~/lib/utils";
import { CivitAIModelComboBox, loader } from "~/routes/civitai-search/route";
import { useFetcher } from "@remix-run/react";

export interface ModelsFormProps {
  models: Model[];
  onNextStep: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  onBackStep: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export default function ModelsForm({
  models,
  onNextStep,
  onBackStep,
}: ModelsFormProps) {
  const search = useFetcher<typeof loader>();
  useEffect(() => {
    search.load(`/civitai-search`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="px-4 py-6 sm:p-8">
        <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <Label>Add Models from ComfyUIManager</Label>
            <div className="mt-2">
              <ModelComboBox models={models} />
            </div>
          </div>
          <div className="sm:col-span-4">
            <Label>Add Models from Civitai</Label>
            <div className="mt-2">
              <CivitAIModelComboBox default_models={search.data?.models} />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
        <Button onClick={onBackStep}>Back</Button>
        <Button onClick={onNextStep}>Next</Button>
      </div>
    </div>
  );
}

interface ModelComboBoxProps {
  models: Model[];
}

function ModelComboBox({ models }: ModelComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [selectedModels, setSelectedModels] = useState<Model[]>([]);

  function onSelected(node: Model) {
    const prevSelectedModels = selectedModels;
    if (
      prevSelectedModels.some(
        (selectedModel) =>
          selectedModel.url + selectedModel.name === node.url + node.name
      )
    ) {
      setSelectedModels(
        prevSelectedModels.filter(
          (selectedModel) =>
            selectedModel.url + selectedModel.name !== node.url + node.name
        )
      );
    } else {
      setSelectedModels([...prevSelectedModels, node]);
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
            ? "Select models"
            : `Selected models : ${selectedModels.length}`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px]">
        <Command>
          <CommandInput placeholder="Search Models..." />
          <CommandEmpty>No models found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {models.map((model) => (
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
