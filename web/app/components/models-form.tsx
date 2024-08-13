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
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

import { Model } from "~/lib/types";
import { cn, isValidModelFileName, isValidModelUrl } from "~/lib/utils";
import { CivitAIModelComboBox, loader } from "~/routes/civitai-search/route";
import { useFetcher } from "@remix-run/react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

export interface ModelsFormProps {
  models: Model[];
  selectedComfyUIModels: Model[];
  selectedCivitAIModels: Model[];
  selectedCustomModels: Model[];
  onComfyUIModelsSelected: (model: Model[]) => void;
  onCivitAIModelsSelected: (model: Model[]) => void;
  onCustomModelAdded: (model: Model) => void;
  onNextStep: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  onBackStep: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export default function ModelsForm({
  models,
  selectedComfyUIModels,
  selectedCivitAIModels,
  selectedCustomModels,
  onComfyUIModelsSelected,
  onCivitAIModelsSelected,
  onCustomModelAdded,
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

          <div className="sm:col-span-full">
            <span className="text-sm">
              Do you want download models from a huggingface url?
              <AddCustomModelDialog onModelSaved={onCustomModelAdded} />
            </span>
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
            selectedCustomModels.length === 0 &&
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

interface AddCustomModelDialogProps {
  onModelSaved: (model: Model) => void;
}

function AddCustomModelDialog({ onModelSaved }: AddCustomModelDialogProps) {
  const [name, setName] = useState<string>("");
  const [isValidName, setIsValidName] = useState<boolean>(true);

  const [url, setUrl] = useState<string>("");
  const [isValidUrl, setIsValidUrl] = useState<boolean>(true);

  const [path, setPath] = useState<string>("");

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  function onDialogOpenChange(open: boolean) {
    if (!open) {
      setName("");
      setPath("");
      setUrl("");
      setIsValidUrl(true);
      setIsValidName(true);
    }

    setDialogOpen(open);
  }
  return (
    <Dialog open={dialogOpen} onOpenChange={onDialogOpenChange}>
      <DialogTrigger asChild>
        <Button variant="link" className="pl-1">
          Add it
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Model Info</DialogTitle>
          <DialogDescription>
            You can directly download models from HuggingFace
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          <div className="grid grid-cols-4 items-center gap-y-2 gap-x-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>

            <Input
              id="name"
              placeholder="Flux.1-dev"
              className="col-span-3"
              onChange={(e) => {
                setName(e.target.value);
                setIsValidName(isValidModelFileName(e.target.value));
              }}
            />

            <div className="col-start-2 col-span-3">
              <p
                className={`text-xs text-rose-500 transition-opacity duration-200 ${
                  !isValidName ? "opacity-100" : "opacity-0"
                }`}
              >
                Special characters not allowed in the name except _
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-y-2 gap-x-4">
            <Label htmlFor="url" className="text-right">
              Url
            </Label>

            <Input
              className="col-span-3"
              id="url"
              placeholder="https://huggingface.co/black-forest-labs/FLUX.1-dev/resolve/main/flux1-dev.safetensors"
              onChange={(e) => {
                setUrl(e.target.value);
                setIsValidUrl(isValidModelUrl(e.target.value));
              }}
            />

            <div className="col-start-2 col-span-3">
              <p
                className={`text-xs text-rose-500 transition-opacity duration-200 ${
                  !isValidUrl ? "opacity-100" : "opacity-0"
                }`}
              >
                Please enter a valid URL
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-y-2 gap-x-4">
            <Label htmlFor="path" className="text-right">
              Path
            </Label>
            <Input
              id="path"
              className="col-span-3"
              placeholder="checkpoints or clip or upscale_models or vae"
              onChange={(e) => {
                setPath(e.target.value);
              }}
            />
          </div>
        </div>
        <DialogFooter className="sm:space-x-2 sm:flex sm:justify-between sm:items-center w-full">
          <p className="text-xs mt-1 text-left">
            Note: Custom download source is not supported
          </p>
          <Button
            disabled={!isValidUrl || !isValidName || path.length == 0}
            onClick={(e) => {
              e.preventDefault();
              if (name.length == 0 || !isValidModelFileName(name)) {
                setIsValidName(false);
                return;
              }
              if (url.length == 0 || !isValidModelUrl(url)) {
                setIsValidUrl(false);
                return;
              }
              onModelSaved({
                filename: name,
                name,
                save_path: path,
                url,
                reference: "",
                description: "",
                size: "",
                base: "",
              });
              onDialogOpenChange(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
