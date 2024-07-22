import { json, useLoaderData } from "@remix-run/react";

import { FormStep, FormStepStatus } from "~/lib/types";
import FormNav from "~/components/form-nav";
import CustomNodeForm from "~/components/custom-node-form";
import type { ActionFunctionArgs } from "@remix-run/node";
import { useState } from "react";
import ModelsForm from "~/components/models-form";
import GpuForm from "~/components/gpu-form";
import { getCustomNodes, getModels } from "../../server/github";

const initialSteps: FormStep[] = [
  { id: "01", name: "Nodes", href: "#", status: "current" },
  { id: "02", name: "Models", href: "#", status: "upcoming" },
  { id: "03", name: "GPU", href: "#", status: "upcoming" },
];

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const value = formData.get("create-machine-action");
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 4000);
  });

  return json({ ok: value }, { status: 200 });
};

export const loader = async () => {
  const [custom_nodes, models] = await Promise.all([
    getCustomNodes(),
    getModels(),
  ]);

  return json({ custom_nodes, models }, { status: 200 });
};

export default function Index() {
  const { custom_nodes, models } = useLoaderData<typeof loader>();
  const [steps, setSteps] = useState<FormStep[]>(initialSteps);
  const currentStep = steps.find((step) => step.status == "current");

  function updateSteps(steps: FormStep[], currentPage: number) {
    const updatedSteps = steps.map((step, index) => {
      let status: FormStepStatus;

      if (index < currentPage) {
        status = "complete";
      } else if (index === currentPage) {
        status = "current";
      } else {
        status = "upcoming";
      }

      return {
        ...step,
        status,
      };
    });
    setSteps(updatedSteps);
  }
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <div className="container mx-auto sm:px-6 lg:px-32 my-32">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-2xl">Create Machine</h2>
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2 my-6">
            <FormNav steps={steps} />
            {currentStep?.name == "Nodes" ? (
              <CustomNodeForm
                nodes={custom_nodes}
                onNextStep={(e) => {
                  e.preventDefault();
                  updateSteps(steps, 1);
                }}
              />
            ) : null}
            {currentStep?.name == "Models" ? (
              <ModelsForm
                models={models}
                onNextStep={(e) => {
                  e.preventDefault();
                  updateSteps(steps, 2);
                }}
                onBackStep={(e) => {
                  e.preventDefault();
                  updateSteps(steps, 0);
                }}
              />
            ) : null}
            {currentStep?.name == "GPU" ? (
              <GpuForm
                onBackStep={(e) => {
                  e.preventDefault();
                  updateSteps(steps, 1);
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
