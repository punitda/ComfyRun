import { useParams } from "@remix-run/react";
import { useEffect } from "react";

export default function MachineLogs() {
  const { machineId } = useParams();

  useEffect(() => {
    let eventSource: EventSource | null = null;
    if (machineId) {
      const streamUrl = `http://0.0.0.0:80/machine-logs/${machineId}`;
      eventSource = new EventSource(streamUrl);
      eventSource.onmessage = (event) => {
        console.log("Event received", event.data);
      };

      eventSource.onerror = (event) => {
        console.error("Event error", event);
        eventSource?.close();
      };
    }

    return () => eventSource?.close();
  }, [machineId]);

  return <div>Logs would come over headers</div>;
}
