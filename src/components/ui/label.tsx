import { cn } from "@/lib/utils";
import { forwardRef, LabelHTMLAttributes } from "react";

const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn("block text-sm font-medium text-text-secondary mb-1.5", className)}
        {...props}
      />
    );
  }
);
Label.displayName = "Label";

export { Label };
