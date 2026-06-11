import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("glass-card p-6 hover:border-navy-600 transition-colors duration-200", className)}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export { Card };
