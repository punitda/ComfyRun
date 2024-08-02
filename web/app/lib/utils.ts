import { type ClassValue, clsx } from "clsx";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import {
  CustomNode,
  Model,
  OutputCustomNodesJson,
  OutputModel,
  TimeInterval,
} from "./types";

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
    if (!item.type) {
      path = "checkpoints";
    } else if (item.type === "upscale") {
      path = "upscale_models";
    } else if (
      (item.type === "checkpoint" || item.type === "checkpoints") &&
      item.save_path === "default"
    ) {
      path = "checkpoints";
    } else if (item.type && item.save_path === "default") {
      path = item.type;
    } else {
      path = item.save_path;
    }

    return {
      name: nameWithoutExtension,
      url: item.url,
      path: path.toLocaleLowerCase(),
    };
  });
}

export function formatRelativeTime(dateTimeString: string): string {
  const date = new Date(dateTimeString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals: TimeInterval[] = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "always" });

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return rtf.format(-count, interval.label);
    }
  }

  return rtf.format(0, "second");
}
