import { useParams } from "@remix-run/react";
import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";

import {
  FixedSizeList,
  FixedSizeList as List,
  ListOnScrollProps,
} from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { LogEntry } from "~/lib/types";

const MAX_LOGS = 1000;
const UPDATE_INTERVAL = 300; // ms

export default function MachineLogs() {
  const { machineId } = useParams();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const pendingLogs = useRef<LogEntry[]>([]);

  const listRef = useRef<FixedSizeList>(null);
  const listOuterRef = useRef<HTMLDivElement>(null);
  const isScrolledToBottom = useRef(true);

  const addLogs = useCallback((newLogs: LogEntry[]) => {
    setLogs((prevLogs) => {
      const updatedLogs = [...prevLogs, ...newLogs];
      return updatedLogs.slice(-MAX_LOGS);
    });
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let updateInterval: NodeJS.Timeout;
    if (machineId) {
      const streamUrl = `${
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).ENV.MACHINE_BUILDER_API_BASE_URL
      }/machine-logs/${machineId}`;
      eventSource = new EventSource(streamUrl);

      const flushPendingLogs = () => {
        if (pendingLogs.current.length > 0) {
          addLogs(pendingLogs.current);
          pendingLogs.current = [];
        }
      };

      const handleEvent = (event: MessageEvent) => {
        pendingLogs.current.push({
          timestamp: Date.now(),
          message: event.data,
          type: event.type as "stdout" | "stderr",
        });
      };

      eventSource.addEventListener("stdout", handleEvent);
      eventSource.addEventListener("stderr", handleEvent);

      eventSource.onerror = (event) => {
        console.error("Event error", event);
        eventSource?.close();
      };

      updateInterval = setInterval(flushPendingLogs, UPDATE_INTERVAL);
    }

    return () => {
      eventSource?.close();
      clearInterval(updateInterval);
    };
  }, [machineId, addLogs]);

  useEffect(() => {
    if (listRef.current && isScrolledToBottom.current) {
      listRef.current.scrollToItem(logs.length - 1);
    }
  }, [logs]);

  const handleScroll = ({
    scrollOffset,
    scrollUpdateWasRequested,
  }: ListOnScrollProps) => {
    if (!scrollUpdateWasRequested) {
      const listElement = listOuterRef.current;
      if (!listElement) return;
      isScrolledToBottom.current =
        scrollOffset >= listElement.scrollHeight - listElement.clientHeight - 1;
    }
  };

  const Row = useCallback(
    ({ index, style }: { index: number; style: CSSProperties }) => {
      const log = logs[index];
      return (
        <div style={style} className="px-4 py-1">
          <span className="text-gray-500 mr-2">{`[${new Date(
            log.timestamp
          ).toLocaleTimeString()}]`}</span>
          <span
            className={
              log.type === "stderr" ? "text-red-500" : "text-purple-400"
            }
          >
            {log.message}
          </span>
        </div>
      );
    },
    [logs]
  );

  return (
    <div className="sm:px-6 lg:px-8">
      <h2 className="text-xl text-primary/90 mt-8">Machine Logs</h2>
      <div className="h-screen pt-4 pb-8">
        <AutoSizer>
          {({ height, width }) => (
            <List
              ref={listRef}
              outerRef={listOuterRef}
              height={height}
              itemCount={logs.length}
              itemSize={35}
              width={width}
              onScroll={handleScroll}
              className="bg-black rounded-lg shadow-lg font-mono text-sm"
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
}
