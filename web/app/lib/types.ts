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
  filename?: string;
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

export const Timeout = {
  "5 mins": 300,
  "10 mins": 600,
  "15 mins": 900,
  "20 mins": 1200,
} as const;

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
  filename?: string;
}

export interface CreateAppRequestBody {
  machine_name: string;
  gpu: string;
  custom_nodes: OutputCustomNodesJson;
  models: OutputModel[];
  additional_dependencies?: string;
  idle_timeout: number;
}

export interface CreateAppSuccessResponseBody {
  status: string;
  task_id: string;
}

export interface CreateAppErrorResponseBody {
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

export interface App {
  app_id: string;
  description: string;
  state: string;
  tasks: string;
  created_at: string;
  stopped_at: string | null;
  url: string;
}

export interface TimeInterval {
  label: Intl.RelativeTimeFormatUnit;
  seconds: number;
}

export type APIResponse<T> =
  | { result: "success"; data: T }
  | { result: "error"; error: string };

export type UploadWorkflowFileResponse = {
  nodes: CustomNode[];
  models: Model[];
};
