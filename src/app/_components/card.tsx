import { cn } from "@/lib/css";
import { ReactNode } from "react";

export const Card = ({
  title,
  description,
  children,
  className,
  warning = false,
  step = 0,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  warning?: boolean;
  step?: number;
}) => (
  <div className="flex w-full max-w-md flex-row gap-3">
    <div
      className={cn(
        "bg-muted text-muted-foreground flex size-12 shrink-0 items-center justify-center rounded-full px-2 text-lg font-semibold",
        warning && "bg-orange-500/10 text-orange-500",
      )}
    >
      {step}
    </div>
    <div
      className={cn(
        "bg-muted animate-in fade-in-0 relative flex w-full flex-col gap-6 rounded-3xl p-6 duration-500",
        warning && "bg-orange-500/10 text-orange-500",
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold">{title}</h2>
        {description && (
          <p
            className={cn(
              "text-muted-foreground text-sm",
              warning && "text-orange-500",
            )}
          >
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  </div>
);
