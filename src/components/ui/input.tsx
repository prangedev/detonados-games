import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-base-border bg-base-surface px-3 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-brand",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
