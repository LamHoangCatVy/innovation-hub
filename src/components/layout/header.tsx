"use client";

import { Bell, Search, UserRound } from "lucide-react";
import { RoleSwitcher } from "./role-switcher";
import { useUser } from "@/lib/user-context";

export function Header() {
  const { user, setRole, switchStaff } = useUser();

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur-md border-b border-border px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Tìm kiếm sáng kiến..."
            className="w-full bg-surface-alt border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user.role === "STAFF" && (
          <span className="text-xs text-text-secondary bg-surface-alt px-3 py-1.5 rounded-lg border border-border flex items-center gap-1.5">
            <UserRound size={12} />
            {user.fullName}
            <span className="text-text-muted">({user.blockCode})</span>
          </span>
        )}

        <RoleSwitcher role={user.role} onChange={(r) => setRole(r)} onSwitchStaff={switchStaff} />

        <button className="relative p-2 rounded-lg hover:bg-surface-alt text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand" />
        </button>
      </div>
    </header>
  );
}
