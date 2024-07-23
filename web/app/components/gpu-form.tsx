import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { GPU } from "~/lib/types";

export interface GpuFormProps {
  onBackStep: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export default function GpuForm({ onBackStep }: GpuFormProps) {
  return (
    <div>
      <div className="px-4 py-6 sm:p-8">
        <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <Label htmlFor="machine-name">Machine Name</Label>
            <div className="mt-2">
              <Input type="text" id="machine-name" placeholder="Machine name" />
            </div>
          </div>
          <div className="sm:col-span-4">
            <Label>Select GPU</Label>
            <div className="mt-2">
              <GpuSelect gpus={Object.keys(GPU)} />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
        <Button onClick={onBackStep}>Back</Button>
        <Button type="submit">Submit</Button>
      </div>
    </div>
  );
}

interface GpuComboBoxProps {
  gpus: string[];
}

function GpuSelect({ gpus }: GpuComboBoxProps) {
  return (
    <Select>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select GPU" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>GPUs</SelectLabel>
          {gpus.map((gpu) => (
            <SelectItem value={gpu} key={gpu}>
              {gpu}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
