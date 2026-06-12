import { Toaster } from "sonner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      {children}
      <Toaster richColors position="top-right" />
    </DashboardLayout>
  );
}
