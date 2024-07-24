export type FormStepStatus = "complete" | "current" | "upcoming";
export type StepName = "Nodes" | "Models" | "GPU";

export type FormStep = {
  id: string;
  name: StepName;
  href: string;
  status: FormStepStatus;
};

export interface CustomNode {
  author: string;
  title: string;
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
  Any = "Any",
  L4 = "L4",
  T4 = "T4",
  A10G = "A10G",
  A100 = "A100",
  H100 = "H100",
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