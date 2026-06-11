import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateInnovationCode(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `INNO-${year}-${random}`;
}

export function formatDate(date: Date | string, format: "short" | "long" | "relative" = "short"): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  if (format === "long") return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  if (format === "relative") {
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffSecs < 60) return "vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return `${day}/${month}/${year}`;
  }
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function getStatusBadge(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "Nháp", color: "bg-zinc-600" },
    PENDING_SCREENING: { label: "Chờ AI", color: "bg-purple-600" },
    SCREENED: { label: "Đã chấm", color: "bg-blue-600" },
    IN_REVIEW: { label: "Đang duyệt", color: "bg-yellow-600" },
    APPROVED: { label: "Đã duyệt", color: "bg-emerald-600" },
    REJECTED: { label: "Từ chối", color: "bg-red-600" },
    MODIFICATION_REQUESTED: { label: "Y/c sửa", color: "bg-orange-600" },
    PUBLISHED: { label: "Công khai", color: "bg-teal-600" },
    COMPLETED: { label: "Hoàn tất", color: "bg-green-600" },
  };
  return map[status] || { label: status, color: "bg-zinc-600" };
}
