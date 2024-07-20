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
  type: string;
  save_path: string;
  reference: string;
  url: string;
  filename: string;
  base: string;
  description: string;
  size: string;
}
