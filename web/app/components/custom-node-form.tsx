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
import { useState } from "react";
import { CustomNode } from "~/lib/types";

import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "~/lib/utils";
import { custom_nodes } from "~/lib/data";

export default function CustomNodeForm() {
  return (
    <div className="px-4 py-6 sm:p-8">
      <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        <div className="sm:col-span-4">
          <Label htmlFor="workflow-file">Upload workflow file</Label>
          <div className="mt-2">
            <Input id="workflow-file" type="file" />
          </div>
        </div>
        <div className="sm:col-span-4">
          <Label>Add Custom Nodes</Label>
          <div className="mt-2">
            <CustomNodesComboBox nodes={custom_nodes} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface CustomNodesComboxBoxProps {
  nodes: CustomNode[];
}

function CustomNodesComboBox({ nodes }: CustomNodesComboxBoxProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? nodes.find((node) => node.title === value)?.title
            : "Select Node..."}
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
                  key={node.reference}
                  value={node.title}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === node.reference ? "opacity-100" : "opacity-0"
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
