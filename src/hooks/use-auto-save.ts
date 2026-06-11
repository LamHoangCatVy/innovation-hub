"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@/lib/user-context";

export function useAutoSave<T>(
  data: T,
  endpoint: string,
  intervalMs = 30000
) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string>("");
  const previousRef = useRef<string>("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useUser();

  const save = useCallback(async () => {
    const serialized = JSON.stringify(data);
    if (serialized === previousRef.current) return;

    setSaveStatus("saving");
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vpb-user": encodeURIComponent(JSON.stringify({ userId: user.id, username: user.username, fullName: user.fullName, role: user.role, blockCode: user.blockCode })),
        },
        body: serialized,
      });
      previousRef.current = serialized;
      const now = new Date();
      setLastSavedAt(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
      );
      setSaveStatus("saved");
    } catch {
      setSaveStatus("idle");
    }
  }, [data, endpoint, user]);

  useEffect(() => {
    const handler = setTimeout(() => {
      save();
      timeoutRef.current = setInterval(save, intervalMs);
    }, intervalMs);

    return () => {
      clearTimeout(handler);
      if (timeoutRef.current) clearInterval(timeoutRef.current);
    };
  }, [save, intervalMs]);

  return { saveStatus, lastSavedAt };
}
