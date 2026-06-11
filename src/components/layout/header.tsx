"use client";

import { Bell, Search } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-30 h-16 bg-navy-950/80 backdrop-blur-md border-b border-navy-800 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Tìm kiếm sáng kiến..."
            className="w-full bg-navy-800 border border-navy-700 rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-navy-800 text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cta" />
        </button>
      </div>
    </header>
  );
}
