import { cn } from "@/lib/css";
import { RiArrowDownSLine } from "@remixicon/react";
import { useState } from "react";

export type Log = {
  group: string; // the category prefix for the log
  message: string; // the log message
  timestamp: Date; // the timestamp of the log
  type: "info" | "error"; // the type of the log
  id: string; // the id of the log
};

const WINDOW_SIZE = 1000;
export function useLog() {
  const [logs, setLogs] = useState<Log[]>([]);

  const addLog = (log: Omit<Log, "id" | "timestamp">) => {
    setLogs((prevLogs) => {
      const newLogs = [...prevLogs];
      newLogs.push({
        ...log,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      });
      // Keep only the most recent WINDOW_SIZE logs to prevent memory issues
      if (newLogs.length > WINDOW_SIZE) {
        return newLogs.slice(-WINDOW_SIZE);
      }
      return newLogs;
    });
  };

  return { logs, addLog };
}

const getColorFromString = (str: string) => {
  // Use a more sophisticated hash function for better color distribution
  let hash = 0;
  const prime1 = 31;
  const prime2 = 37;

  // Use multiple hash calculations with different primes for increased variance
  for (let i = 0; i < str.length; i++) {
    // First hash calculation with prime1
    hash = ((hash * prime1) ^ str.charCodeAt(i)) & 0xffffffff;

    // Add position-weighted influence for more uniqueness
    hash = (hash + i * prime2 * str.charCodeAt(i)) & 0xffffffff;

    // Add a bit rotation for even more variance
    hash = ((hash << 5) | (hash >>> 27)) & 0xffffffff;
  }

  // Final mix to improve distribution
  hash = ((hash ^ (hash >>> 16)) * 0x85ebca6b) & 0xffffffff;
  hash = ((hash ^ (hash >>> 13)) * 0xc2b2ae35) & 0xffffffff;
  hash = (hash ^ (hash >>> 16)) & 0xffffffff;

  // Generate HSL color with good saturation and lightness for readability
  const h = hash % 360;
  return `hsl(${h}, 100%, 80%)`;
};

export function UILogger({ logs }: { logs: Log[] }) {
  const [showLogs, setShowLogs] = useState(false);
  return (
    <div
      className={cn(
        "bg-secondary w-full shrink-0 overflow-y-auto border-t",
        showLogs && "h-1/2",
      )}
    >
      <button
        onClick={() => setShowLogs(!showLogs)}
        className="sticky top-0 z-10 flex h-8 w-full items-center justify-center gap-2 border-b bg-black/5 px-2 py-1 text-sm font-medium backdrop-blur-md"
      >
        {showLogs ? "Hide logs" : "Show logs"}
        <RiArrowDownSLine
          className={cn(
            "size-4 transition-transform",
            !showLogs && "rotate-180",
          )}
        />
      </button>
      {showLogs && (
        <table className="w-full border-collapse font-mono text-sm mb-20">
          <tbody>
            {logs.map((log) => (
              <tr key={`log-${log.id}`} className={cn("group")}>
                <td
                  className="text-foreground/90 border-b px-2 py-1 align-top whitespace-nowrap"
                  title={log.timestamp.toLocaleString()}
                >
                  <span
                    style={{ backgroundColor: getColorFromString(log.group) }}
                    className="rounded-full px-2 py-0.5"
                  >
                    {log.group}
                  </span>
                </td>
                <td
                  className={cn(
                    "w-full border-b px-2 py-1 align-top",
                    log.type === "error" && "text-red-700",
                  )}
                  title={log.timestamp.toLocaleString()}
                >
                  {log.message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
