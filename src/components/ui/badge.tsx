import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants: Record<string, string> = {
      default: "bg-surface-alt text-text-secondary",
      success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      danger: "bg-red-500/15 text-red-400 border-red-500/30",
      info: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-0.5 text-xs font-medium",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
