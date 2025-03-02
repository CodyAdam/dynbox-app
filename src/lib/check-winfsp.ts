import { Command } from "@tauri-apps/plugin-shell";

export async function checkWinfsp(): Promise<boolean> {
  console.log("Checking WinFSP");

  // Check if WinFSP is installed by querying the registry
  const regCommand = Command.create("powershell", [
    "-C",
    "Test-Path",
    "HKLM:\\SOFTWARE\\WOW6432Node\\WinFsp",
  ]);

  const res = await regCommand.execute();

  const installed = res.stdout.includes("True");

  console.log("Winfsp status:", installed ? "installed" : "not installed");

  return installed;
}
