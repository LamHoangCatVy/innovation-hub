"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Role = "ADMIN" | "STAFF";

export interface UserIdentity {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  blockId: string | null;
  blockCode: string;
  blockName: string;
}

const STAFF_POOL: Omit<UserIdentity, "id">[] = [
  { username: "vylhc", fullName: "Vũ Yến Ly", role: "STAFF", blockId: null, blockCode: "RB", blockName: "Khối Ngân hàng Bán lẻ" },
  { username: "trungnh4", fullName: "Nguyễn Hữu Trung", role: "STAFF", blockId: null, blockCode: "CMB", blockName: "Khối Doanh nghiệp vừa & nhỏ" },
  { username: "ducldc", fullName: "Lê Đức Cường", role: "STAFF", blockId: null, blockCode: "CIB", blockName: "Khối Doanh nghiệp lớn & Định chế" },
  { username: "phuchh", fullName: "Hoàng Hồng Phúc", role: "STAFF", blockId: null, blockCode: "Treasury", blockName: "Khối Nguồn vốn & Kinh doanh vốn" },
  { username: "linhht31", fullName: "Hoàng Thùy Linh", role: "STAFF", blockId: null, blockCode: "IT", blockName: "Khối Công nghệ Thông tin" },
  { username: "nganht", fullName: "Hoàng Thanh Ngân", role: "STAFF", blockId: null, blockCode: "Ops", blockName: "Khối Vận hành" },
  { username: "huyennt", fullName: "Nguyễn Thu Huyền", role: "STAFF", blockId: null, blockCode: "Risk", blockName: "Khối Quản trị Rủi ro" },
  { username: "quanlm", fullName: "Lê Minh Quân", role: "STAFF", blockId: null, blockCode: "HR", blockName: "Khối Nhân sự" },
  { username: "thanhnv", fullName: "Nguyễn Văn Thành", role: "STAFF", blockId: null, blockCode: "Fin", blockName: "Khối Tài chính Kế toán" },
  { username: "anhtd", fullName: "Trần Đức Anh", role: "STAFF", blockId: null, blockCode: "Digital", blockName: "Khối Ngân hàng Số" },
  { username: "minhbt", fullName: "Bùi Tuấn Minh", role: "STAFF", blockId: null, blockCode: "Legal", blockName: "Khối Pháp chế & Tuân thủ" },
  { username: "trangpt", fullName: "Phạm Thu Trang", role: "STAFF", blockId: null, blockCode: "Strategy", blockName: "Khối Chiến lược & Phát triển" },
];

const ADMIN_IDENTITY: UserIdentity = {
  id: "admin-001",
  username: "admin",
  fullName: "Admin User",
  role: "ADMIN",
  blockId: null,
  blockCode: "Strategy",
  blockName: "Ban Chiến lược",
};

function getRandomStaff(): UserIdentity {
  const pool = STAFF_POOL[Math.floor(Math.random() * STAFF_POOL.length)];
  return {
    ...pool,
    id: `staff-${pool.username}`,
  };
}

interface UserContextType {
  user: UserIdentity;
  setRole: (role: Role) => void;
  switchStaff: () => void;
}

const UserContext = createContext<UserContextType>({
  user: ADMIN_IDENTITY,
  setRole: () => {},
  switchStaff: () => {},
});

export function useUser() {
  return useContext(UserContext);
}

function loadUserFromStorage(): UserIdentity {
  try {
    const saved = localStorage.getItem("vpb_user");
    if (saved) {
      const parsed = JSON.parse(saved) as UserIdentity;
      if (parsed.role === "ADMIN" || parsed.role === "STAFF") {
        return parsed;
      }
    }
  } catch {}
  return ADMIN_IDENTITY;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserIdentity>(loadUserFromStorage);

  const persist = useCallback((u: UserIdentity) => {
    setUser(u);
    try { localStorage.setItem("vpb_user", JSON.stringify(u)); } catch {}
  }, []);

  const setRole = useCallback((role: Role) => {
    if (role === "ADMIN") {
      persist(ADMIN_IDENTITY);
    } else {
      persist(getRandomStaff());
    }
  }, [persist]);

  const switchStaff = useCallback(() => {
    persist(getRandomStaff());
  }, [persist]);

  return (
    <UserContext.Provider value={{ user, setRole, switchStaff }}>
      {children}
    </UserContext.Provider>
  );
}
