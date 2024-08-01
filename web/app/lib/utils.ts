import { type ClassValue, clsx } from "clsx";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { CustomNode, Model, OutputCustomNodesJson, OutputModel } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function useDebounce<T = unknown>(
  value: T,
  delay: number
): [T, boolean] {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [isDebouncing, setDebouncing] = useState(false);
  useEffect(
    () => {
      // Update debounced value after delay
      setDebouncing(true);
      const handler = setTimeout(() => {
        setDebouncing(false);

        setDebouncedValue(value);
      }, delay);
      // Cancel the timeout if value changes (also on delay change or unmount)
      // This is how we prevent debounced value from updating if value is changed ...
      // .. within the delay period. Timeout gets cleared and restarted.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Only re-call effect if value or delay changes
  );
  return [debouncedValue, isDebouncing];
}

export function convertCustomNodesJson(nodes: CustomNode[]) {
  const output: OutputCustomNodesJson = {
    custom_nodes: {},
    unknown_nodes: [],
  };

  new Set(nodes).forEach((node) => {
    output.custom_nodes[node.reference] = {
      state: "not-installed",
      hash: "-",
    };
  });

  return output;
}

export function convertModelsJson(input: Model[]): OutputModel[] {
  return input.map((item) => {
    const nameWithoutExtension = item.filename.split(".")[0];

    let path: string;
    if (!item.type || item.type === "default" || item.type == "checkpoint") {
      path = "checkpoints";
    } else if (item.type === "IP-Adapter") {
      path = "ipadapter";
    } else {
      path = item.type;
    }

    return {
      name: nameWithoutExtension,
      url: item.url,
      path: path,
    };
  });
}
