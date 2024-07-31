import { json, redirect, useFetcher, useLoaderData } from "@remix-run/react";

import {
  CreateMachineErrorResponseBody,
  CreateMachineResponseBody,
  CustomNode,
  FormStep,
  FormStepStatus,
  Model,
} from "~/lib/types";
import FormNav from "~/components/form-nav";
import CustomNodeForm from "~/components/custom-node-form";
import type { ActionFunctionArgs } from "@remix-run/node";
import { useEffect, useState } from "react";
import ModelsForm from "~/components/models-form";
import GpuForm from "~/components/gpu-form";
import { getCustomNodes, getModels } from "~/server/github";
import { convertCustomNodesJson, convertModelsJson } from "~/lib/utils";
import { CREATE_MACHINE_FETCHER_KEY } from "../../lib/constants";
import { useToast } from "~/components/ui/use-toast";
import { generateCreateMachineRequestBody } from "../../server/utils";

const initialSteps: FormStep[] = [
  { id: "01", name: "Nodes", href: "#", status: "current" },
  { id: "02", name: "Models", href: "#", status: "upcoming" },
  { id: "03", name: "GPU", href: "#", status: "upcoming" },
];

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const requestBody = generateCreateMachineRequestBody(formData);

  try {
    const url = `${process.env.MACHINE_BUILDER_API_BASE_URL}/create-machine`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      return json<CreateMachineErrorResponseBody>(
        { error: "Unable to create machine" },
        { status: response.status }
      );
    }

    const { machine_id } = (await response.json()) as CreateMachineResponseBody;
    return redirect(`/machine-logs/${machine_id}`);
  } catch (error) {
    console.error("create-machine-error", error);
    return json<CreateMachineErrorResponseBody>(
      { error: "Unable to create machine" },
      { status: 400 }
    );
  }
};

export const loader = async () => {
  const [custom_nodes, models] = await Promise.all([
    getCustomNodes(),
    getModels(),
  ]);

  return json({ custom_nodes, models }, { status: 200 });
};

export default function Index() {
  const createMachineFetcher = useFetcher<typeof action>({
    key: CREATE_MACHINE_FETCHER_KEY,
  });
  const { custom_nodes, models } = useLoaderData<typeof loader>();

  const { toast } = useToast();

  const [steps, setSteps] = useState<FormStep[]>(initialSteps);
  const currentStep = steps.find((step) => step.status == "current");

  const [selectedCustomNodes, setSelectedCustomNodes] = useState<CustomNode[]>(
    []
  );
  const [selectedCustomNodesFromWFFile, setSelectedCustomNodesFromWFFile] =
    useState<CustomNode[]>([]);
  const [selectedComfyUIModels, setSelectedComfyUIModels] = useState<Model[]>(
    []
  );
  const [selectedCivitaiModels, setSelectedCivitaiModels] = useState<Model[]>(
    []
  );

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

  function updateSelectedCustomNodes(customNodes: CustomNode[]) {
    setSelectedCustomNodes(customNodes);
  }

  function updateSelectedCustomNodesFromWFFile(custom_nodes: CustomNode[]) {
    setSelectedCustomNodesFromWFFile(custom_nodes);
  }

  function updateSelectedComfyUIModels(models: Model[]) {
    setSelectedComfyUIModels(models);
  }

  function updateSelectedCivitaiModels(models: Model[]) {
    setSelectedCivitaiModels(models);
  }

  useEffect(() => {
    if (!createMachineFetcher.data) return;
    if ("error" in createMachineFetcher.data) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong",
        description: createMachineFetcher.data.error,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createMachineFetcher.data]);

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <div className="container mx-auto sm:px-6 lg:px-32 my-32">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-2xl">Create Machine</h2>
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2 my-6">
            <FormNav steps={steps} />
            {currentStep?.name == "Nodes" ? (
              <CustomNodeForm
                selectedCustomNodes={selectedCustomNodes}
                nodes={custom_nodes}
                onNodesSelected={updateSelectedCustomNodes}
                onNodesGeneratedFromWFFile={updateSelectedCustomNodesFromWFFile}
                onNextStep={(e) => {
                  e.preventDefault();
                  updateSteps(steps, 1);
                }}
              />
            ) : null}
            {currentStep?.name == "Models" ? (
              <ModelsForm
                models={models}
                selectedComfyUIModels={selectedComfyUIModels}
                selectedCivitAIModels={selectedCivitaiModels}
                onComfyUIModelsSelected={updateSelectedComfyUIModels}
                onCivitAIModelsSelected={updateSelectedCivitaiModels}
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
              <>
                <GpuForm
                  customNodesJson={convertCustomNodesJson(
                    selectedCustomNodes.concat(selectedCustomNodesFromWFFile)
                  )}
                  modelsJson={convertModelsJson(
                    selectedCivitaiModels.concat(selectedComfyUIModels)
                  )}
                  onBackStep={(e) => {
                    e.preventDefault();
                    updateSteps(steps, 1);
                  }}
                />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
