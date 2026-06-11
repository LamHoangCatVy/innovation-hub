"use client";

import { cn } from "@/lib/utils";
import { Shield, User, Shuffle } from "lucide-react";

interface RoleSwitcherProps {
  role: "ADMIN" | "STAFF";
  onChange: (role: "ADMIN" | "STAFF") => void;
  onSwitchStaff?: () => void;
}

export function RoleSwitcher({ role, onChange, onSwitchStaff }: RoleSwitcherProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative inline-flex rounded-lg bg-surface-alt border border-border p-0.5">
        <button
          onClick={() => onChange("ADMIN")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
            role === "ADMIN"
              ? "bg-brand text-white shadow-sm"
              : "text-text-muted hover:text-text-secondary"
          )}
        >
          <Shield size={12} />
          Admin
        </button>
        <button
          onClick={() => onChange("STAFF")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
            role === "STAFF"
              ? "bg-brand text-white shadow-sm"
              : "text-text-muted hover:text-text-secondary"
          )}
        >
          <User size={12} />
          Staff
        </button>
      </div>
      {role === "STAFF" && onSwitchStaff && (
        <button
          onClick={onSwitchStaff}
          className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          title="Đổi staff khác"
        >
          <Shuffle size={14} />
        </button>
      )}
    </div>
  );
}
