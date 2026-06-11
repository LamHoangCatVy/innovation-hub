"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  innovationId: string | null;
  read: boolean;
  createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  APPROVED: "bg-emerald-500",
  REJECTED: "bg-red-500",
  MODIFICATION_REQUESTED: "bg-amber-500",
  SCREENING_PASSED: "bg-blue-500",
  SCREENING_FAILED: "bg-red-500",
};

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleItemClick = async (n: Notification) => {
    // Mark as read
    if (!n.read) {
      try {
        await fetch(`/api/notifications/${n.id}`, { method: "PATCH" });
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        /* silent */
      }
    }
    setOpen(false);
    if (n.innovationId) {
      router.push(`/innovations/${n.innovationId}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "POST" });
      setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
      setUnreadCount(0);
    } catch {
      /* silent */
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-surface-alt text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        aria-label="Thông báo"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[480px] bg-surface border border-border rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-brand hover:text-brand/80 transition-colors cursor-pointer"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-text-muted text-sm">
                Không có thông báo
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-surface-alt/50 transition-colors cursor-pointer ${
                    !n.read ? "bg-brand/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                        !n.read ? (TYPE_COLORS[n.type] || "bg-brand") : "bg-transparent"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.read ? "font-semibold text-text-primary" : "text-text-secondary"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-text-muted mt-1">{formatDate(n.createdAt, "relative")}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
