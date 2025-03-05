"use client";

import { cn } from "@/lib/css";
import { getVersion } from "@tauri-apps/api/app";
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
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersionAndCheckUpdates = async () => {
      try {
        // Get current app version
        const appVersion = await getVersion();
        setCurrentVersion(appVersion);

        // Check for updates
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

    fetchVersionAndCheckUpdates();
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
    <div
      className={cn(
        "text-muted-foreground flex h-8 max-w-md items-center gap-3 text-xs",
        className,
      )}
    >
      {updateStatus === "not-available" && currentVersion && (
        <div title={`Up to date`}>v{currentVersion}</div>
      )}

      {updateStatus === "available" && (
        <div>Update v{updateInfo?.version} available</div>
      )}

      {updateStatus === "downloading" && (
        <div>Downloading update ({downloadProgress}%)</div>
      )}

      {updateStatus === "ready" && (
        <button
          onClick={handleRestart}
          className="hover:text-foreground"
          title={`Restart to update to ${updateInfo?.version} (current version: ${currentVersion})`}
        >
          <span>Restart to update</span>
        </button>
      )}

      {error && (
        <div className="truncate" title={error}>
          {error}
        </div>
      )}
    </div>
  );
}
