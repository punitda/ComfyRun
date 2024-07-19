export type FormStepStatus = "complete" | "current" | "upcoming";

export type FormStep = {
  id: string;
  name: string;
  href: string;
  status: FormStepStatus;
};
