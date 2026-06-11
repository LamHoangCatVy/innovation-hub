"use client";

import { useUser } from "@/lib/user-context";
import { ChevronDown, UserRound, Check, ShieldAlert, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function UserSwitcher() {
  const { user, allUsers, switchUser, stopImpersonation, isImpersonating } = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // The impersonation dropdown is only available to admins (real admin session)
  // or while an impersonation is active (so the admin can exit it).
  const canImpersonate = user.role === "ADMIN" || isImpersonating;

  if (!canImpersonate) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-alt border border-border text-xs">
        <UserRound size={12} className="text-text-muted" />
        <span className="text-text-primary font-medium">{user.fullName}</span>
        {user.blockCode && <span className="text-text-muted">({user.blockCode})</span>}
      </div>
    );
  }

  const admins = allUsers.filter((u) => u.role === "ADMIN");
  const staff = allUsers.filter((u) => u.role === "STAFF");

  return (
    <div ref={ref} className="relative" data-tour="role-switcher">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-alt border border-border hover:border-border-hover transition-colors cursor-pointer text-xs"
      >
        {isImpersonating && <ShieldAlert size={12} className="text-amber-500" />}
        <UserRound size={12} className="text-text-muted" />
        <span className="text-text-primary font-medium">{user.fullName}</span>
        <span className="text-text-muted">({user.blockCode || "—"})</span>
        <ChevronDown size={12} className="text-text-muted" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-surface-elevated border border-border rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
          {isImpersonating && (
            <div className="p-2 border-b border-border">
              <div className="flex items-center gap-2 text-xs text-amber-500 px-3 py-1.5">
                <ShieldAlert size={14} />
                <span>Đang mạo danh người dùng</span>
              </div>
              <button
                onClick={() => { stopImpersonation(); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-alt transition-colors cursor-pointer text-left text-sm text-text-primary"
              >
                <LogOut size={14} className="text-text-muted" /> Thoát mạo danh
              </button>
            </div>
          )}
          <div className="p-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted px-3 py-1">Admin</p>
            {admins.map((u) => (
              <button
                key={u.id}
                onClick={() => { switchUser(u.id); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-alt transition-colors cursor-pointer text-left"
              >
                <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                  <UserRound size={12} className="text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{u.fullName}</p>
                  <p className="text-xs text-text-muted">@{u.username}</p>
                </div>
                {user.id === u.id && <Check size={14} className="text-brand" />}
              </button>
            ))}
          </div>
          <div className="border-t border-border p-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted px-3 py-1">Nhân sự các Khối</p>
            {staff.map((u) => (
              <button
                key={u.id}
                onClick={() => { switchUser(u.id); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-alt transition-colors cursor-pointer text-left"
              >
                <div className="w-7 h-7 rounded-full bg-surface-alt border border-border flex items-center justify-center flex-shrink-0">
                  <UserRound size={12} className="text-text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{u.fullName}</p>
                  <p className="text-xs text-text-muted">{u.blockCode} &middot; @{u.username}</p>
                </div>
                {user.id === u.id && <Check size={14} className="text-brand" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
