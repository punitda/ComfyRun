import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { GPU, OutputCustomNodesJson, OutputModel } from "~/lib/types";
import { useFetcher } from "@remix-run/react";
import { useState } from "react";

const machineNameRegex = new RegExp(/^[a-zA-Z0-9._-]{1,63}$/);
const machineNameErrorMsg =
  "Machine name may contain only alphanumeric characters, dashes, periods, and underscores, and must be shorter than 64 characters";
export interface GpuFormProps {
  customNodesJson: OutputCustomNodesJson;
  modelsJson: OutputModel[];
  onBackStep: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export default function GpuForm({
  onBackStep,
  customNodesJson,
  modelsJson,
}: GpuFormProps) {
  const fetcher = useFetcher();
  const isCreatingMachine = fetcher.state !== "idle";
  const [machineNameError, setMachineNameError] = useState<string | null>(null);
  return (
    <fetcher.Form action="/create-machine" method="post">
      <div className="px-4 py-6 sm:p-8">
        <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <Label htmlFor="machine-name">Machine Name</Label>
            <div className="mt-2">
              <Input
                type="text"
                id="machine-name"
                name="machine_name"
                placeholder="Machine name"
                onChange={(e) => {
                  if (machineNameRegex.test(e.target.value)) {
                    setMachineNameError(null);
                  } else {
                    setMachineNameError(machineNameErrorMsg);
                  }
                }}
                maxLength={64}
                required
              />
            </div>
            {machineNameError ? (
              <p className="mt-2 text-xs text-red-600">{machineNameError}</p>
            ) : null}
          </div>
          <div className="sm:col-span-4">
            <Label>Select GPU</Label>
            <div className="mt-2">
              <GpuSelect />
            </div>
          </div>
          <div className="sm:col-span-4 hidden">
            <Textarea
              placeholder="Type your message here."
              value={JSON.stringify(customNodesJson)}
              hidden
              id="custom-nodes"
              name="custom_nodes"
            />
            <Textarea
              placeholder="Type your message here."
              value={JSON.stringify(modelsJson)}
              id="models"
              name="models"
              hidden
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
        <Button
          variant="outline"
          onClick={onBackStep}
          disabled={isCreatingMachine}
        >
          Back
        </Button>
        <Button type="submit" disabled={isCreatingMachine}>
          Create Machine
        </Button>
      </div>
    </fetcher.Form>
  );
}

function GpuSelect() {
  return (
    <Select required name="gpu">
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select GPU" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>GPUs</SelectLabel>
          {Object.entries(GPU).map(([key, value]) => (
            <SelectItem value={value} key={value}>
              {key}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
