"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface UserIdentity {
  id: string;
  username: string;
  fullName: string;
  role: "ADMIN" | "STAFF";
  blockCode: string;
  blockName: string;
}

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

const DEFAULT_USER = ALL_USERS[0];

interface UserContextType {
  user: UserIdentity;
  setUser: (u: UserIdentity) => void;
  switchUser: (id: string) => void;
  allUsers: UserIdentity[];
}

const UserContext = createContext<UserContextType>({
  user: DEFAULT_USER,
  setUser: () => {},
  switchUser: () => {},
  allUsers: ALL_USERS,
});

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserIdentity>(DEFAULT_USER);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vpb_user_id");
      if (saved) {
        const found = ALL_USERS.find((u) => u.id === saved);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (found) setUser(found);
      }
    } catch {}
  }, []);

  const persist = useCallback((u: UserIdentity) => {
    setUser(u);
    try { localStorage.setItem("vpb_user_id", u.id); } catch {}
  }, []);

  const switchUser = useCallback((id: string) => {
    const found = ALL_USERS.find((u) => u.id === id);
    if (found) persist(found);
  }, [persist]);

  return (
    <UserContext.Provider value={{ user, setUser: persist, switchUser, allUsers: ALL_USERS }}>
      {children}
    </UserContext.Provider>
  );
}
