"use client";

import {
  RiCheckboxMultipleBlankLine,
  RiCloseLargeLine,
  RiSubtractLine,
} from "@remixicon/react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogoMono } from "./logo-mono";

export default function TitleBar() {
  const handleMinimize = () => {
    const appWindow = getCurrentWindow();
    if (appWindow) {
      appWindow.minimize();
    }
  };

  const handleMaximize = () => {
    const appWindow = getCurrentWindow();
    if (appWindow) {
      appWindow.toggleMaximize();
    }
  };

  const handleClose = () => {
    const appWindow = getCurrentWindow();
    if (appWindow) {
      appWindow.close();
    }
  };

  return (
    <nav
      data-tauri-drag-region
      className="bg-background flex h-8 w-full shrink-0 items-center"
    >
      <div className="text-foreground pointer-events-none flex w-fit items-center gap-2 px-3">
        <LogoMono className="size-5 shrink-0" />
        <p className="font-display text-muted-foreground text-sm">Dynbox</p>
      </div>
      <button
        onClick={handleMinimize}
        className="hover:bg-muted text-muted-foreground hover:text-foreground ml-auto flex h-8 w-11 items-center justify-center transition-colors"
      >
        <RiSubtractLine className="size-4" />
      </button>
      <button
        onClick={handleMaximize}
        className="hover:bg-muted text-muted-foreground hover:text-foreground flex h-8 w-11 items-center justify-center transition-colors"
      >
        <RiCheckboxMultipleBlankLine className="size-4" />
      </button>
      <button
        onClick={handleClose}
        className="hover:bg-destructive text-muted-foreground flex h-8 w-11 items-center justify-center transition-colors hover:text-white"
      >
        <RiCloseLargeLine className="size-4" />
      </button>
    </nav>
  );
}
