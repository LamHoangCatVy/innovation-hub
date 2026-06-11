"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { YumAIPanel } from "./yumai-panel";
import { OnboardingGuide } from "./onboarding-guide";
import { ReactNode, useState } from "react";
import { UserProvider } from "@/lib/user-context";

function DashboardInner({ children }: { children: ReactNode }) {
  const [yumaiOpen, setYumaiOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[260px] min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <YumAIPanel open={yumaiOpen} onToggle={() => setYumaiOpen(!yumaiOpen)} />
      <OnboardingGuide />
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
