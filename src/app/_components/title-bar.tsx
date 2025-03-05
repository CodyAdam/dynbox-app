"use client";

import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import { FluentDismiss16Regular } from "./icons/FluentDismiss16Regular";
import { FluentLineHorizontal116Regular } from "./icons/FluentLineHorizontal116Regular";
import FluentSquare16Regular from "./icons/FluentSquare16Regular";
import FluentSquareMultiple16Regular from "./icons/FluentSquareMultiple16Regular";
import { LogoMono } from "./logo-mono";
import { UpdaterStatus } from "./updater-status";

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

  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkMaximized = async () => {
      const appWindow = getCurrentWindow();
      if (appWindow) {
        const maximized = await appWindow.isMaximized();
        setIsMaximized(maximized);
      }
    };

    checkMaximized();

    const unlisten = getCurrentWindow().onResized(() => {
      checkMaximized();
    });

    return () => {
      unlisten.then((unlistenFn) => unlistenFn());
    };
  }, []);

  return (
    <nav
      data-tauri-drag-region
      className="bg-background flex h-8 w-full shrink-0 items-center border-b"
    >
      <div className="text-foreground pointer-events-none flex w-fit items-center gap-2 px-3">
        <LogoMono className="size-5 shrink-0" />
        <p className="font-display text-muted-foreground text-sm">Dynbox</p>
      </div>
      <UpdaterStatus className="mx-auto" />
      <button
        onClick={handleMinimize}
        className="hover:bg-muted text-muted-foreground hover:text-foreground flex h-8 w-11 items-center justify-center transition-colors"
      >
        <FluentLineHorizontal116Regular className="size-4" />
      </button>
      <button
        onClick={handleMaximize}
        className="hover:bg-muted text-muted-foreground hover:text-foreground flex h-8 w-11 items-center justify-center transition-colors"
      >
        {isMaximized ? (
          <FluentSquareMultiple16Regular className="size-4" />
        ) : (
          <FluentSquare16Regular className="size-4" />
        )}
      </button>
      <button
        onClick={handleClose}
        className="hover:bg-destructive text-muted-foreground flex h-8 w-11 items-center justify-center transition-colors hover:text-white"
      >
        <FluentDismiss16Regular className="size-4" />
      </button>
    </nav>
  );
}
