"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { YumAIPanel } from "./yumai-panel";
import { ReactNode, useState } from "react";
import { UserProvider, useUser } from "@/lib/user-context";

function DashboardInner({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [yumaiOpen, setYumaiOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[260px] min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      {user.role === "ADMIN" && <YumAIPanel open={yumaiOpen} onToggle={() => setYumaiOpen(!yumaiOpen)} />}
    </div>
  );
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <DashboardInner>{children}</DashboardInner>
    </UserProvider>
  );
}
