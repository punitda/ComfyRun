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
  custom_nodes: OutputCustomNodesJson;
  models: OutputModel[];
  additional_dependencies?: string;
}

export interface CreateMachineResponseBody {
  status: string;
  machine_id: string;
}

export interface CreateMachineErrorResponseBody {
  error: string;
}

export interface LogEntry {
  message: string;
  timestamp: number;
  type: "stdout" | "stderr";
}

export type SignInError = LOGGED_OUT | EMAIL_NOT_ALLOWED;

export const LOGGED_OUT = "LOGGED_OUT" as const;
export type LOGGED_OUT = typeof LOGGED_OUT;

export const EMAIL_NOT_ALLOWED = "EMAIL_NOT_ALLOWED" as const;
export type EMAIL_NOT_ALLOWED = typeof EMAIL_NOT_ALLOWED;
