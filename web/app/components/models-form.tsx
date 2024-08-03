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
import { Switch } from "~/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

import { Model } from "~/lib/types";
import { cn } from "~/lib/utils";
import { CivitAIModelComboBox, loader } from "~/routes/civitai-search/route";
import { useFetcher } from "@remix-run/react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

export interface ModelsFormProps {
  models: Model[];
  selectedComfyUIModels: Model[];
  selectedCivitAIModels: Model[];
  onComfyUIModelsSelected: (model: Model[]) => void;
  onCivitAIModelsSelected: (model: Model[]) => void;
  onNextStep: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  onBackStep: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export default function ModelsForm({
  models,
  selectedComfyUIModels,
  selectedCivitAIModels,
  onComfyUIModelsSelected,
  onCivitAIModelsSelected,
  onNextStep,
  onBackStep,
}: ModelsFormProps) {
  const search = useFetcher<typeof loader>();
  useEffect(() => {
    search.load(`/civitai-search`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [skipModelsDownload, setSkipModelsDownload] = useState<boolean>(false);
  return (
    <div>
      <div className="px-4 py-6 sm:p-8">
        <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <Label>Add Models from ComfyUIManager</Label>
            <div className="mt-2">
              <ModelComboBox
                models={models}
                selectedModels={selectedComfyUIModels}
                onModelSelected={onComfyUIModelsSelected}
              />
            </div>
          </div>
          <div className="sm:col-span-4">
            <Label>Add Models from Civitai</Label>
            <div className="mt-2">
              <CivitAIModelComboBox
                default_models={search.data?.models}
                selectedModels={selectedCivitAIModels}
                onModelSelected={onCivitAIModelsSelected}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:col-span-full">
            <Switch
              id="skip-model-download"
              onCheckedChange={(value) => {
                setSkipModelsDownload(value);
              }}
            />
            <Label htmlFor="skip-model-download">Skip Downloading Models</Label>
            <Popover>
              <PopoverTrigger asChild>
                <InformationCircleIcon className="size-6 text-primary/70" />
              </PopoverTrigger>
              <PopoverContent className="w-96">
                <p className="text-primary/90 text-sm mt-1">
                  Models are shared between apps. If you&#39;ve already
                  downloaded all the models you need during the previous app
                  builds you can skip this step :)
                </p>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
        <Button variant="outline" onClick={onBackStep}>
          Back
        </Button>
        <Button
          onClick={onNextStep}
          disabled={
            selectedCivitAIModels.length === 0 &&
            selectedComfyUIModels.length === 0 &&
            !skipModelsDownload
          }
        >
          Next
        </Button>
      </div>
    </div>
  );
}

interface ModelComboBoxProps {
  models: Model[];
  selectedModels: Model[];
  onModelSelected: (model: Model[]) => void;
}

function ModelComboBox({
  models,
  selectedModels,
  onModelSelected,
}: ModelComboBoxProps) {
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
