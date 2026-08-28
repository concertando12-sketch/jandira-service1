import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-border bg-surface p-5", className)}
      {...props}
    />
  );
}

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "brand" | "success" | "danger" | "muted" }) {
  const variants = {
    default: "bg-surface-2 text-foreground border border-border",
    brand: "bg-brand text-brand-foreground",
    success: "bg-success/15 text-success border border-success/30",
    danger: "bg-danger/15 text-danger border border-danger/30",
    muted: "bg-surface-2 text-muted border border-border",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
