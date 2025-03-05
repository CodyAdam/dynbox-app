"use client";

import { env } from "@/env.mjs";
import { api } from "@/lib/api-react";
import { checkWinfsp } from "@/lib/check-winfsp";
import { useTauriStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { open } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Child, Command } from "@tauri-apps/plugin-shell";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "./_components/button";
import { Card } from "./_components/card";
import { LogoMono } from "./_components/logo-mono";
import { UILogger, useLog } from "./_components/ui-logger";
import { Switch } from "./_components/ui/switch";

export default function Home() {
  const { data: token, update: setToken } = useTauriStore("token", undefined);
  const { data: configVaults, update: updateConfigVaults } = useTauriStore(
    "vaults",
    undefined,
  );
  
  const { logs, add: addLog, clear: clearLogs } = useLog();
  const [runningChildren, setRunningChildren] = useState<
    { process: Child; vaultId: string }[]
  >([]);
  const [runningConfigSnapshot, setRunningConfigSnapshot] = useState<typeof configVaults>(undefined);
  const [configChanged, setConfigChanged] = useState(false);
  const {
    data: account,
    error,
    isPending,
  } = api.useQuery(
    "get",
    "/account",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    {
      enabled: !!token,
    },
  );
  const { data: vaults } = api.useQuery(
    "get",
    "/vaults",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    {
      enabled: !!account && !!token,
    },
  );
  const { data: winfspInstalled } = useQuery({
    queryKey: ["check-winfsp"],
    queryFn: async () => await checkWinfsp(),
  });

  // Check if config has changed while running
  useEffect(() => {
    if (runningChildren.length > 0 && runningConfigSnapshot) {
      // Deep comparison of configs
      const hasChanged = JSON.stringify(configVaults) !== JSON.stringify(runningConfigSnapshot);
      setConfigChanged(hasChanged);
    } else {
      setConfigChanged(false);
    }
  }, [configVaults, runningConfigSnapshot, runningChildren.length]);

  const handleDirectorySelect = async (
    vaultId: string,
    asVolume: boolean = true,
  ) => {
    const vault = vaults?.find((v) => v.vault.id === vaultId);
    if (!vault) return;

    if (asVolume) {
      updateConfigVaults({
        ...configVaults,
        [vaultId]: {
          enabled: true,
        },
      });
    }

    try {
      const selectedDir = await open({
        multiple: false,
        directory: true,
      });

      if (selectedDir && typeof selectedDir === "string") {
        updateConfigVaults({
          ...configVaults,
          [vaultId]: {
            directory: selectedDir.replace(/\\/g, "/"),
            enabled: true,
          },
        });
      }
    } catch (err) {
      console.error("Error selecting directory:", err);
    }
  };

  const handleRemoveDirectory = (vaultId: string) => {
    if (configVaults) {
      const { [vaultId]: config, ...rest } = configVaults;
      config.directory = undefined;
      updateConfigVaults({ ...rest, [vaultId]: config });
    }
  };

  const handleToggleVault = (vaultId: string) => {
    updateConfigVaults({
      ...configVaults,
      [vaultId]: {
        ...configVaults?.[vaultId],
        enabled: !configVaults?.[vaultId]?.enabled,
      },
    });
  };
  const handleSignOut = () => {
    setToken(undefined);
  };

  const handleStartSync = useCallback(async () => {
    if (runningChildren.length > 0) {
      // Kill all running children
      try {
        await Promise.all(
          runningChildren.map(async (child) => {
            await child.process.kill();
          }),
        );
        setRunningChildren([]);
        setRunningConfigSnapshot(undefined);
        addLog({
          group: "System",
          message: "Stopped sync processes",
          type: "info",
        });
      } catch {
        addLog({
          group: "System",
          message: "Error killing processes",
          type: "error",
        });
      }
      return;
    }

    addLog({
      group: "System",
      message: "Starting sync processes",
      type: "info",
    });

    // Take a snapshot of the current config
    setRunningConfigSnapshot(JSON.parse(JSON.stringify(configVaults)));

    const configVaultsList = Object.entries(configVaults ?? {});

    try {
      const newRunningChildren: { process: Child; vaultId: string }[] = [];

      // Process vaults sequentially instead of using Promise.all
      for (const vault of configVaultsList) {
        const [vaultId, config] = vault;
        if (!config.enabled) continue;

        const name = vaults?.find((v) => v.vault.id === vaultId)?.vault.name;
        if (!name || !vaultId || !token) {
          console.error("Vault not found");
          continue;
        }

        const command = Command.sidecar(
          "bin/rclone-dynbox",
          [
            "mount",
            `:dynbox,vault_id=${vaultId},access_token=${token},endpoint='${env.NEXT_PUBLIC_APP_URL}/api':`,
            config.directory ? `${config.directory}/${name}` : "*",
            !config.directory && `--volname=${name}`,
            "--vfs-cache-mode=full",
            "--links",
            "--use-cookies",
            // "--dump-bodies",
          ].filter(Boolean) as string[],
        );

        command.addListener("close", () => {
          setRunningChildren((prev) =>
            prev.filter((child) => child.vaultId !== vaultId),
          );
          addLog({
            group: name,
            message: "Process exited",
            type: "info",
          });
        });

        command.addListener("error", (err) => {
          addLog({
            group: name,
            message: err,
            type: "error",
          });
        });

        command.stdout.on("data", (data) => {
          addLog({
            group: name,
            message: data,
            type: "info",
          });
        });

        command.stderr.on("data", (data) => {
          addLog({
            group: name,
            message: data,
            type: "info",
          });
        });

        const handle = await command.spawn();
        newRunningChildren.push({
          process: handle,
          vaultId,
        });

        // Add a 2 second wait before proceeding
        await new Promise((resolve) => setTimeout(resolve, 4000));
      }

      setRunningChildren(newRunningChildren);
    } catch (err) {
      console.error("Error starting sync processes:", err);
      addLog({
        group: "System",
        message: "Error starting sync processes",
        type: "error",
      });
      setRunningConfigSnapshot(undefined);
    }
  }, [addLog, configVaults, runningChildren, token, vaults]);

  useEffect(() => {
    if (runningChildren.length === 0) {
      setRunningConfigSnapshot(undefined);
    }
  }, [runningChildren]);

  const renderLoginContent = () => {
    if (!token) {
      return (
        <div className="flex flex-col gap-4">
          <Link
            target="_blank"
            href={`${env.NEXT_PUBLIC_APP_URL}/account/authorize?clientId=dynbox-app&redirectUri=dynbox://authorize`}
            className="bg-primary text-primary-foreground hover:bg-primary/80 rounded-md border px-3 py-2 text-center"
            onClick={() => {
              openUrl(
                `${env.NEXT_PUBLIC_APP_URL}/account/authorize?clientId=dynbox-app&redirectUri=dynbox://authorize`,
              );
            }}
          >
            Authenticate with your browser
          </Link>
        </div>
      );
    }

    return (
      <>
        {isPending && (
          <div className="text-muted-foreground animate-pulse text-center">
            Loading account information...
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3">
            <p className="font-medium">Error</p>
            <p className="text-sm">Could not fetch account information</p>
          </div>
        )}

        {account && (
          <div className="flex flex-row items-center gap-4">
            {account.image && (
              <img
                src={account.image}
                alt={account.name}
                className="size-12 rounded-full object-cover"
              />
            )}
            <div className="flex flex-col">
              <div className="text-base font-bold">{account.name}</div>
              <div className="text-muted-foreground text-base">
                {account.email}
              </div>
            </div>
          </div>
        )}
        <Button variant="secondary" onClick={handleSignOut}>
          Sign out
        </Button>
      </>
    );
  };

  const renderVaultConfigurations = () => {
    return (
      <div className="flex flex-col gap-4">
        {vaults?.map((vault) => (
          <div
            key={vault.vault.id}
            className="flex flex-col gap-2 rounded-xl border p-4"
          >
            <h3 className="text-muted-foreground text-base">
              Vault{" "}
              <span className="text-foreground font-medium">
                {vault.vault.name}
              </span>
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex flex-row items-center gap-2">
                <Switch
                  checked={configVaults?.[vault.vault.id]?.enabled}
                  onCheckedChange={() => handleToggleVault(vault.vault.id)}
                />
                <p className="text-muted-foreground text-sm">
                  Enable syncronization
                </p>
              </div>
              <div className="flex flex-row items-center gap-2">
                <Switch
                  checked={!!configVaults?.[vault.vault.id]?.directory}
                  onCheckedChange={() => {
                    if (configVaults?.[vault.vault.id]?.directory) {
                      // If directory exists, remove it to use volume instead
                      handleRemoveDirectory(vault.vault.id);
                    } else {
                      // If using volume, prompt to select directory
                      handleDirectorySelect(vault.vault.id, false);
                    }
                  }}
                />
                <p className="text-muted-foreground text-sm">
                  Use folder instead of drive
                </p>
              </div>
              {configVaults?.[vault.vault.id]?.directory ? (
                <p className="text-muted-foreground text-sm">
                  Selected folder:{" "}
                  <span className="bg-foreground/10 rounded-xs px-1 font-mono">
                    {configVaults?.[vault.vault.id]?.directory}
                  </span>
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Using virtual drive (e.g.{" "}
                  <span className="bg-foreground/10 rounded-xs px-1 font-mono">
                    Z:/
                  </span>
                  )
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-full flex-col items-center gap-10 overflow-y-auto p-8 py-20">
        <div className="relative size-10">
          <LogoMono className="size-10" />
          <span className="bg-background/60 absolute -right-1 -bottom-1 rounded-xs px-0.5 text-xs font-medium backdrop-blur-md">
            App
          </span>
        </div>

        {winfspInstalled === false && (
          <Card
            title="Finish installation"
            warning
            step={0}
            description="To use the Dynbox desktop app, you need to install Winfsp."
          >
            <p>
              Status: <span className="font-medium">Missing</span>
            </p>
            <Button
              onClick={() => openUrl("https://winfsp.dev/rel/")}
              variant="warning"
            >
              Download WinFSP
            </Button>
          </Card>
        )}

        <Card title="Login to your account" step={1}>
          {renderLoginContent()}
        </Card>

        {token && account && (
          <Card
            title="Configure your vaults"
            description="Select a path to syncronize your vaults to. If not provided, the vault will be mounted as a volume."
            step={2}
          >
            {renderVaultConfigurations()}
          </Card>
        )}

        {token &&
          account &&
          Object.values(configVaults ?? {}).some((v) => v.enabled) && (
            <Card title="Synchronization" step={3}>
              {configChanged && (
                <div className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 mb-4 rounded-md p-3 text-sm">
                  Configuration has changed. You need to restart synchronization to apply changes.
                </div>
              )}
              <Button
                variant={runningChildren.length > 0 ? "success" : "primary"}
                onClick={handleStartSync}
              >
                {runningChildren.length > 0
                  ? `Stop syncronizing (${runningChildren.length} running)`
                  : "Start syncronizing"}
              </Button>
            </Card>
          )}
      </div>

      {logs.length > 0 && <UILogger logs={logs} clearLogs={clearLogs} />}
    </div>
  );
}
