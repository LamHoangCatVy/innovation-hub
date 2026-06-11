"use client";

import { UserIdentity } from "@/lib/user-context";

export function apiFetch(path: string, options?: RequestInit & { user?: UserIdentity }) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (options?.user) {
    headers["x-vpb-user"] = JSON.stringify({
      userId: options.user.id,
      username: options.user.username,
      fullName: options.user.fullName,
      role: options.user.role,
      blockCode: options.user.blockCode,
    });
  }

  return fetch(path, { ...options, headers });
}
