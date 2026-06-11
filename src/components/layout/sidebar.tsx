"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Lightbulb,
  FileText,
  ClipboardCheck,
  Globe,
  Settings,
  ChevronLeft,
  Shuffle,
  BarChart3,
  GraduationCap,
} from "lucide-react";
import { useState } from "react";
import { useUser } from "@/lib/user-context";

  interface NAV_ITEM {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    tour?: string;
  }

  const NAV_ITEMS: NAV_ITEM[] = [
  { href: "/innovations/new", label: "Đề xuất mới", icon: Lightbulb, tour: "new-idea" },
  { href: "/innovations/drafts", label: "Bản nháp của tôi", icon: FileText },
  { href: "/academy", label: "Innovation Academy", icon: GraduationCap },
  { href: "/hub", label: "Nhà Chung", icon: Globe, tour: "hub" },
];

const PIC_ADMIN_ITEMS: NAV_ITEM[] = [
  { href: "/review", label: "Phê duyệt (PIC)", icon: ClipboardCheck, tour: "review" },
];

const ADMIN_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/innovations", label: "Quản lý Sáng kiến", icon: LayoutDashboard },
  { href: "/admin/frameworks", label: "Framework chấm điểm", icon: Shuffle },
  { href: "/admin/frameworks/new", label: "Thêm Framework", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useUser();
  const role = user.role;

  return (
    <aside
      data-tour="sidebar"
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-surface-alt border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      <div className="flex items-center h-16 px-4 border-b border-border gap-3">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-light flex items-center justify-center">
              <Lightbulb size={16} className="text-white" />
            </div>
            <span className="font-semibold text-sm text-text-primary">Innovation Hub</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-text-muted transition-colors cursor-pointer",
            collapsed && "mx-auto"
          )}
        >
          <ChevronLeft size={18} className={cn("transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            data-tour={item.tour}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer group",
              pathname === item.href
                ? "bg-brand/10 text-brand font-medium"
                : "text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary"
            )}
          >
            <item.icon size={20} />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}

        {role === "ADMIN" && (
          <div className="pt-4">
            <div className={cn("px-3 mb-2", collapsed ? "text-center" : "")}>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {!collapsed ? "Phê duyệt" : "..."}
              </span>
            </div>
            {PIC_ADMIN_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer group",
                  pathname === item.href
                    ? "bg-brand/10 text-brand font-medium"
                    : "text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary"
                )}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </div>
        )}

        {role === "ADMIN" && (
          <div className="pt-4">
            <div className={cn("px-3 mb-2", collapsed ? "text-center" : "")}>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {!collapsed ? "Quản trị" : "..."}
              </span>
            </div>
            {ADMIN_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer group",
                  pathname === item.href
                    ? "bg-brand/10 text-brand font-medium"
                    : "text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary"
                )}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-border">
        <div className={cn("flex items-center gap-3 px-3 py-2", collapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-light flex items-center justify-center text-xs font-bold text-white">
            {role === "ADMIN" ? "A" : "S"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {user.fullName}
              </p>
              <p className="text-xs text-text-muted truncate">
                {user.role === "ADMIN" ? "Ban Chiến lược" : user.blockCode}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
