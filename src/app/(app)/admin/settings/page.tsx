"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/user-context";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, CheckCircle2, MonitorPlay } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [animationStyle, setAnimationStyle] = useState("CLASSIC");

  useEffect(() => {
    if (user.role !== "ADMIN") {
      router.push("/");
      return;
    }

    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.LANDING_ANIMATION) {
            setAnimationStyle(data.LANDING_ANIMATION);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user, router]);

  const handleSave = async (value: string) => {
    setSaving(true);
    setAnimationStyle(value);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "LANDING_ANIMATION", value }),
      });
      if (res.ok) {
        toast.success("Đã cập nhật cấu hình giao diện");
      } else {
        throw new Error("Failed to update");
      }
    } catch (err) {
      toast.error("Lỗi khi lưu cấu hình");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand/20 to-brand-light/20 flex items-center justify-center">
          <Settings size={20} className="text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Cấu hình hệ thống</h1>
          <p className="text-sm text-text-secondary mt-1">Quản lý các thiết lập hiển thị và hoạt động của Hub</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
          <MonitorPlay className="text-brand" size={24} />
          <div>
            <h2 className="text-lg font-bold text-text-primary">Hiệu ứng Trang chủ (3D Orbit)</h2>
            <p className="text-sm text-text-secondary mt-1">Chọn hiệu ứng 3D hiển thị trên landing page</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleSave("CLASSIC")}
            disabled={saving}
            className={`relative flex flex-col items-start p-6 rounded-xl border-2 text-left transition-all ${
              animationStyle === "CLASSIC" 
                ? "border-brand bg-brand/5" 
                : "border-border hover:border-brand/30 bg-surface-alt"
            }`}
          >
            {animationStyle === "CLASSIC" && (
              <div className="absolute top-4 right-4 text-brand"><CheckCircle2 size={20} /></div>
            )}
            <h3 className="font-bold text-text-primary text-lg mb-2">Classic Orbit</h3>
            <p className="text-sm text-text-secondary">
              Hiệu ứng quỹ đạo quay mượt mà, tĩnh lặng và chuyên nghiệp. Thích hợp cho hiển thị ổn định lâu dài.
            </p>
          </button>

          <button
            onClick={() => handleSave("SUPERNOVA")}
            disabled={saving}
            className={`relative flex flex-col items-start p-6 rounded-xl border-2 text-left transition-all ${
              animationStyle === "SUPERNOVA" 
                ? "border-brand bg-brand/5" 
                : "border-border hover:border-brand/30 bg-surface-alt"
            }`}
          >
            {animationStyle === "SUPERNOVA" && (
              <div className="absolute top-4 right-4 text-brand"><CheckCircle2 size={20} /></div>
            )}
            <h3 className="font-bold text-text-primary text-lg mb-2">Supernova Burst (Phát xạ)</h3>
            <p className="text-sm text-text-secondary">
              Hiệu ứng phát xạ năng lượng với các làn sóng xung kích định kỳ, mang lại cảm giác đột phá và mạnh mẽ.
            </p>
          </button>
        </div>
      </Card>
    </div>
  );
}
