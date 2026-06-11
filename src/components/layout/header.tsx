"use client";

import { Bell, Search, Compass } from "lucide-react";
import { UserSwitcher } from "./user-switcher";

export function Header() {
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

      <div className="flex items-center gap-3">
        <UserSwitcher />

        <button
          onClick={() => {
            localStorage.removeItem("vpb_tour_done");
            localStorage.removeItem("vpb_onboarding_done");
            window.location.href = window.location.href;
          }}
          title="Show me around"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-brand hover:bg-brand/5 transition-colors cursor-pointer"
        >
          <Compass size={14} /> Tour
        </button>

        <button className="relative p-2 rounded-lg hover:bg-surface-alt text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
