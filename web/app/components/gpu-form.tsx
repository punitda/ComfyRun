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

import { useFetcher, useNavigate } from "@remix-run/react";
import { useEffect, useState } from "react";
import { action } from "~/routes/create-machine/route";

import { GPU, OutputCustomNodesJson, OutputModel } from "~/lib/types";
import { CREATE_MACHINE_FETCHER_KEY } from "~/lib/constants";

const machineNameRegex = new RegExp(/^[a-zA-Z0-9._-]{1,63}$/);
const machineNameErrorMsg =
  "Machine name may contain only alphanumeric characters, dashes, periods, and underscores, and must be shorter than 64 characters";

const packageNamesRegex = new RegExp(
  /^([a-zA-Z0-9_-]+(?:==\d+(?:\.\d+)*)?(?:,\s*)?)+$/
);
const packageNamesErrorMsg =
  "Please provide values in comma separated format as suggested in examples";
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
  const fetcher = useFetcher<typeof action>({
    key: CREATE_MACHINE_FETCHER_KEY,
  });
  const navigate = useNavigate();
  const isCreatingMachine = fetcher.state !== "idle";
  const [machineNameError, setMachineNameError] = useState<string | null>(null);
  const [packageNamesError, setPackageNamesError] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (fetcher.data?.status == "started" && fetcher.data.machine_id) {
      navigate(`/machine-logs/${fetcher.data.machine_id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.data]);

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
          <div className="sm:col-span-4">
            <Label id="dependencies">
              Additional Python dependencies(optional)
            </Label>
            <div className="mt-2">
              <Input
                type="text"
                id="dependencies"
                name="dependencies"
                placeholder="Enter package names (e.g., package1==1.0.0, package2)"
                onChange={(e) => {
                  if (packageNamesRegex.test(e.target.value)) {
                    setPackageNamesError(null);
                  } else {
                    setPackageNamesError(packageNamesErrorMsg);
                  }
                }}
              />
              {packageNamesError ? (
                <p className="mt-2 text-xs text-red-600">{packageNamesError}</p>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-primary/90">
              Please provide list of additional python dependencies you want to
              include in the comma separated values
            </p>
            <p className="text-xs mt-2">
              E.x. -{" "}
              <span className="inline items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                insightface==0.7.3, onnxruntime==1.17.3, onnxruntime-gpu
              </span>
            </p>
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
