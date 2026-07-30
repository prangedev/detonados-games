import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-base-border bg-base-raised px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-ink-muted",
        className
      )}
      {...props}
    />
  );
}
