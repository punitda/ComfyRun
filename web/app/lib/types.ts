export type FormStepStatus = "complete" | "current" | "upcoming";
export type StepName = "Nodes" | "Models" | "GPU";

export type FormStep = {
  id: string;
  name: StepName;
  href: string;
  status: FormStepStatus;
};

export interface CustomNode {
  author?: string;
  title?: string;
  reference: string;
}

export interface Model {
  name: string;
  type?: string;
  save_path: string;
  reference: string;
  url: string;
  filename: string;
  base: string;
  description: string;
  size: string;
}

export enum GPU {
  Any = "any",
  T4 = "t4",
  L4 = "l4",
  A10G = "a10g",
  A100SMALL = "a100-40gb",
  A100BIG = "a100-80gb",
  H100 = "h100",
}

export interface OutputNode {
  state: string;
  hash: string;
}

export interface OutputCustomNodesJson {
  custom_nodes: {
    [key: string]: OutputNode;
  };
  unknown_nodes: string[];
}

export interface OutputModel {
  name: string;
  url: string;
  path: string;
}


export interface CreateMachineRequestBody {
  machine_name: string;
  gpu: string;
  custom_nodes: OutputCustomNodesJson,
  models: OutputModel[]
}