"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Plus, Edit3, Trash2, Shuffle } from "lucide-react";

interface Framework {
  id: string;
  name: string;
  description: string | null;
  formula: string;
  isActive: boolean;
  criteriaCount: number;
  blockCount: number;
  createdAt: string;
}

export default function FrameworksPage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFrameworks = () => {
    fetch("/api/frameworks")
      .then((r) => r.json())
      .then(setFrameworks)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFrameworks(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa framework này?")) return;
    await fetch(`/api/frameworks/${id}`, { method: "DELETE" });
    fetchFrameworks();
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/frameworks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    fetchFrameworks();
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Quản lý Framework Chấm Điểm</h1>
            <p className="text-text-secondary mt-1">Cấu hình bộ tiêu chí cho LLM sử dụng ở Bước 4 - Sàng lọc tự động</p>
          </div>
          <Link href="/admin/frameworks/new">
            <Button><Plus size={16} /> Thêm Framework</Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={32} /></div>
        ) : frameworks.length === 0 ? (
          <Card className="text-center py-12">
            <Shuffle size={48} className="mx-auto text-text-muted mb-4" />
            <p className="text-text-secondary mb-4">Chưa có framework nào. Hãy tạo bộ tiêu chí đầu tiên.</p>
            <Link href="/admin/frameworks/new"><Button>Thêm Framework</Button></Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {frameworks.map((fw) => (
              <Card key={fw.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-text-primary">{fw.name}</h3>
                      <Badge variant={fw.isActive ? "success" : "default"}>
                        {fw.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {fw.description && (
                      <p className="text-sm text-text-muted mt-1">{fw.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-text-muted">
                        Công thức: <code className="text-brand bg-brand/10 px-1.5 py-0.5 rounded">{fw.formula}</code>
                      </span>
                      <span className="text-xs text-text-muted">{fw.criteriaCount} tiêu chí</span>
                      <span className="text-xs text-text-muted">{fw.blockCount} khối áp dụng</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(fw.id, fw.isActive)}
                    >
                      {fw.isActive ? "Vô hiệu" : "Kích hoạt"}
                    </Button>
                    <Link href={`/admin/frameworks/${fw.id}/edit`}>
                      <Button variant="ghost" size="sm"><Edit3 size={14} /></Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(fw.id)}>
                      <Trash2 size={14} className="text-red-400" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
