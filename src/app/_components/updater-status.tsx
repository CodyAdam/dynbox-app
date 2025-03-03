"use client";

import { cn } from "@/lib/css";
import { RiDownloadLine, RiRestartLine } from "@remixicon/react";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, Update } from "@tauri-apps/plugin-updater";
import { useEffect, useState } from "react";

export function UpdaterStatus({ className }: { className?: string }) {
  const [updateStatus, setUpdateStatus] = useState<
    "checking" | "available" | "not-available" | "downloading" | "ready"
  >("checking");
  const [updateInfo, setUpdateInfo] = useState<{
    version: string;
    body: string | undefined;
  } | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        setUpdateStatus("checking");
        const update = await check();

        if (update) {
          setUpdateInfo({
            version: update.version,
            body: update.body,
          });
          // Start download immediately when update is available
          startDownload(update);
        } else {
          setUpdateStatus("not-available");
        }
      } catch (err) {
        console.error("Failed to check for updates:", err);
        setError("Failed to check for updates");
        setUpdateStatus("not-available");
      }
    };

    checkForUpdates();
  }, []);

  const startDownload = async (update: Update) => {
    try {
      setUpdateStatus("downloading");
      setDownloadProgress(0);

      let downloaded = 0;
      let contentLength = 1; // Default to 1 to avoid division by zero

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            if (event.data.contentLength) {
              contentLength = event.data.contentLength;
            }
            break;
          case "Progress":
            downloaded += event.data.chunkLength || 0;
            const progress = Math.round((downloaded / contentLength) * 100);
            setDownloadProgress(progress);
            break;
          case "Finished":
            setUpdateStatus("ready");
            break;
        }
      });
    } catch (err) {
      console.error("Failed to download update:", err);
      setError("Failed to download update");
      setUpdateStatus("available");
    }
  };

  const handleRestart = async () => {
    try {
      await relaunch();
    } catch (err) {
      console.error("Failed to restart application:", err);
      setError("Failed to restart application");
    }
  };

  return (
    <div className={cn("ml-2 flex h-8 items-center", className)}>
      {updateStatus === "available" && (
        <span className="text-muted-foreground flex items-center gap-1 text-xs">
          <RiDownloadLine className="h-3 w-3 animate-pulse" />
          <span>Update v{updateInfo?.version} available</span>
        </span>
      )}

      {updateStatus === "downloading" && (
        <span className="text-muted-foreground flex items-center gap-1 text-xs">
          <RiDownloadLine className="h-3 w-3 animate-pulse" />
          <span>Downloading {downloadProgress}%</span>
        </span>
      )}

      {updateStatus === "ready" && (
        <button
          onClick={handleRestart}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
        >
          <RiRestartLine className="h-3 w-3" />
          <span>Restart to update</span>
        </button>
      )}
    </div>
  );
}
