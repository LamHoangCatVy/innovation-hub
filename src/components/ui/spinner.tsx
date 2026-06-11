"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function Spinner({ className, size = 20 }: { className?: string; size?: number }) {
  return <Loader2 className={cn("animate-spin text-primary-light", className)} size={size} />;
}
