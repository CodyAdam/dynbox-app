import { cn } from "@/lib/css";
import { ButtonHTMLAttributes, ReactNode } from "react";

export const Button = ({
  variant = "primary",
  className,
  children,
  ...props
}: {
  className?: string;
  variant?: "primary" | "secondary" | "success" | "warning";
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) => {
  const baseStyles = "rounded-md border px-3 py-2 text-center";

  const variantStyles = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    success: "bg-green-500/30 text-green-500 hover:bg-green-500/20",
    warning: "bg-orange-500/80 text-white hover:bg-orange-500/90",
  };

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};
