"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";

export interface UserIdentity {
  id: string;
  username: string;
  fullName: string;
  role: "ADMIN" | "STAFF";
  blockCode: string;
  blockName: string;
}

// Static directory used for the admin impersonation dropdown and for resolving a
// friendly block name from the (server-trusted) blockCode returned by /api/auth/me.
export const ALL_USERS: UserIdentity[] = [
  { id: "admin-001", username: "admin", fullName: "Admin User", role: "ADMIN", blockCode: "Strategy", blockName: "Ban Chiến lược" },
  { id: "staff-vylhc", username: "vylhc", fullName: "Vũ Yến Ly", role: "STAFF", blockCode: "RB", blockName: "Khối Bán lẻ" },
  { id: "staff-trungnh4", username: "trungnh4", fullName: "Nguyễn Hữu Trung", role: "STAFF", blockCode: "CMB", blockName: "Khối DN vừa & nhỏ" },
  { id: "staff-ducldc", username: "ducldc", fullName: "Lê Đức Cường", role: "STAFF", blockCode: "CIB", blockName: "Khối DN lớn & Định chế" },
  { id: "staff-phuchh", username: "phuchh", fullName: "Hoàng Hồng Phúc", role: "STAFF", blockCode: "Treasury", blockName: "Khối Nguồn vốn" },
  { id: "staff-linhht31", username: "linhht31", fullName: "Hoàng Thùy Linh", role: "STAFF", blockCode: "IT", blockName: "Khối CNTT" },
  { id: "staff-nganht", username: "nganht", fullName: "Hoàng Thanh Ngân", role: "STAFF", blockCode: "Ops", blockName: "Khối Vận hành" },
  { id: "staff-huyennt", username: "huyennt", fullName: "Nguyễn Thu Huyền", role: "STAFF", blockCode: "Risk", blockName: "Khối Rủi ro" },
  { id: "staff-quanlm", username: "quanlm", fullName: "Lê Minh Quân", role: "STAFF", blockCode: "HR", blockName: "Khối Nhân sự" },
  { id: "staff-thanhnv", username: "thanhnv", fullName: "Nguyễn Văn Thành", role: "STAFF", blockCode: "Fin", blockName: "Khối Tài chính" },
  { id: "staff-anhtd", username: "anhtd", fullName: "Trần Đức Anh", role: "STAFF", blockCode: "Digital", blockName: "Khối NH Số" },
  { id: "staff-minhbt", username: "minhbt", fullName: "Bùi Tuấn Minh", role: "STAFF", blockCode: "Legal", blockName: "Khối Pháp chế" },
  { id: "staff-trangpt", username: "trangpt", fullName: "Phạm Thu Trang", role: "STAFF", blockCode: "Strategy", blockName: "Khối Chiến lược" },
];

// Guest placeholder used before hydration and on public pages rendered outside the
// provider (e.g. the landing page). role STAFF keeps admin-only UI hidden.
const GUEST_USER: UserIdentity = {
  id: "", username: "", fullName: "Khách", role: "STAFF", blockCode: "", blockName: "",
};

interface ServerUser {
  userId: string;
  username: string;
  fullName: string;
  role: "ADMIN" | "STAFF";
  blockCode: string;
}

function toIdentity(u: ServerUser): UserIdentity {
  const known = ALL_USERS.find((x) => x.id === u.userId);
  const blockName =
    known?.blockName ??
    ALL_USERS.find((x) => x.blockCode === u.blockCode)?.blockName ??
    u.blockCode;
  return {
    id: u.userId,
    username: u.username,
    fullName: u.fullName,
    role: u.role,
    blockCode: u.blockCode,
    blockName,
  };
}

interface UserContextType {
  user: UserIdentity;
  loading: boolean;
  isImpersonating: boolean;
  switchUser: (id: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  logout: () => Promise<void>;
  allUsers: UserIdentity[];
}

const UserContext = createContext<UserContextType>({
  user: GUEST_USER,
  loading: true,
  isImpersonating: false,
  switchUser: async () => {},
  stopImpersonation: async () => {},
  logout: async () => {},
  allUsers: ALL_USERS,
});

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserIdentity>(GUEST_USER);
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          window.location.href = "/login";
          return;
        }
        const data = await res.json();
        if (!active) return;
        setUser(toIdentity(data.user));
        setIsImpersonating(Boolean(data.impersonating));
      } catch {
        window.location.href = "/login";
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const switchUser = useCallback(async (id: string) => {
    const res = await fetch("/api/auth/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    if (res.ok) window.location.reload();
  }, []);

  const stopImpersonation = useCallback(async () => {
    const res = await fetch("/api/auth/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: null }),
    });
    if (res.ok) window.location.reload();
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }, []);

  return (
    <UserContext.Provider
      value={{ user, loading, isImpersonating, switchUser, stopImpersonation, logout, allUsers: ALL_USERS }}
    >
      {loading ? (
        <div className="flex h-screen w-full items-center justify-center">
          <Spinner size={28} />
        </div>
      ) : (
        children
      )}
    </UserContext.Provider>
  );
}
