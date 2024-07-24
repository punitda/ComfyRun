import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useEffect, useState } from "react";
import { CustomNode } from "~/lib/types";

import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "~/lib/utils";
import { useFetcher } from "@remix-run/react";

import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { action } from "~/routes/upload-workflow-file/route";

export interface CustomNodeFormProps {
  nodes: CustomNode[];
  selectedCustomNodes: CustomNode[];
  onNodesSelected: (node: CustomNode[]) => void;
  onNextStep: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}
export default function CustomNodeForm({
  nodes,
  selectedCustomNodes,
  onNodesSelected,
  onNextStep,
}: CustomNodeFormProps) {
  return (
    <div>
      <div className="px-4 py-6 sm:p-8">
        <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <UploadWorkflowFileForm onNodesSelected={onNodesSelected} />
          </div>
          <div className="relative sm:col-span-4">
            <div
              aria-hidden="true"
              className="absolute inset-0 flex items-center"
            >
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-2 text-sm text-primary">OR</span>
            </div>
          </div>
          <div className="sm:col-span-4">
            <Label>Add Custom Nodes</Label>
            <div className="mt-2">
              <CustomNodesComboBox
                nodes={nodes}
                selectedNodes={selectedCustomNodes}
                onNodesSelected={onNodesSelected}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
        <Button onClick={onNextStep}>Next</Button>
      </div>
    </div>
  );
}

interface CustomNodesComboxBoxProps {
  nodes: CustomNode[];
  selectedNodes: CustomNode[];
  onNodesSelected: (nodes: CustomNode[]) => void;
}

function CustomNodesComboBox({
  nodes,
  selectedNodes,
  onNodesSelected,
}: CustomNodesComboxBoxProps) {
  const [open, setOpen] = useState(false);

  function onSelected(node: CustomNode) {
    const prevSelectedNodes = selectedNodes;
    if (
      prevSelectedNodes.some(
        (selectedModel) =>
          selectedModel.reference + selectedModel.title ===
          node.reference + node.title
      )
    ) {
      onNodesSelected(
        prevSelectedNodes.filter(
          (selectedModel) =>
            selectedModel.reference + selectedModel.title !==
            node.reference + node.title
        )
      );
    } else {
      onNodesSelected([...prevSelectedNodes, node]);
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
          {selectedNodes.length == 0
            ? "Select nodes"
            : `Selected nodes : ${selectedNodes.length}`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px]">
        <Command>
          <CommandInput placeholder="Search Node..." />
          <CommandEmpty>No node found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {nodes.map((node) => (
                <CommandItem
                  key={node.reference + node.title}
                  value={node.reference}
                  onSelect={() => {
                    onSelected(node);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedNodes.some(
                        (selectedNode) =>
                          selectedNode.reference === node.reference
                      )
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {node.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface UploadWorkflowFileFormProps {
  onNodesSelected: (nodes: CustomNode[]) => void;
}

function UploadWorkflowFileForm({
  onNodesSelected,
}: UploadWorkflowFileFormProps) {
  const fetcher = useFetcher<typeof action>();

  const isUploading = fetcher.state !== "idle";
  const [fileAdded, setFileAdded] = useState(false);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    const fileSize = e.target?.files?.length;
    if (fileSize != null && fileSize > 0) {
      setFileAdded(true);
    }
  }

  useEffect(() => {
    if (fetcher.data?.nodes?.length ?? 0 > 0) {
      onNodesSelected(fetcher.data?.nodes ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.data?.nodes]);
  return (
    <fetcher.Form
      action="/upload-workflow-file"
      method="post"
      encType="multipart/form-data"
    >
      <div className="flex items-center space-x-2">
        <Label htmlFor="workflow-file">Upload workflow file</Label>
        <Popover>
          <PopoverTrigger asChild>
            <InformationCircleIcon className="size-6 text-primary/70" />
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <p className="text-primary/90 text-sm mt-1">
              If you are not sure which custom nodes are used in your workflow,
              please upload the workflow file and we can generate the list of
              custom nodes required to be installed :)
            </p>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex w-full max-w-sm items-center space-x-2 mt-2">
        <Input
          id="workflow-file"
          name="workflow-file"
          accept=".json"
          type="file"
          onChange={onChange}
        />
        <div className="relative flex items-center">
          <Button
            type="submit"
            disabled={isUploading || !fileAdded}
            className="px-8"
          >
            Upload
          </Button>
          {isUploading ? (
            <svg
              className="animate-spin mr-1 h-4 w-4 text-background absolute right-1"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : null}
        </div>
      </div>
      {fetcher?.data?.nodes ? (
        <p className="text-sm mt-2">
          <span className="font-semibold">{fetcher?.data?.nodes.length}</span>
          <span> nodes selected from the workflow file</span>
        </p>
      ) : null}
    </fetcher.Form>
  );
}
