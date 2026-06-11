"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ClipboardList, Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";

interface InnovationItem {
  id: string;
  code: string;
  title: string;
  status: string;
  authorName: string;
  primaryBlockName: string;
  normalisedScore: number | null;
  createdAt: string;
  version: number;
}

export default function AdminInnovationsPage() {
  const [items, setItems] = useState<InnovationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set("keyword", keyword);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/innovations?${params}`);
      const data = await res.json();
      const mapped = data.map((i: Record<string, unknown>) => ({
        id: i.id,
        code: i.code,
        title: i.title,
        status: i.status,
        authorName: (i.author as { fullName: string })?.fullName || "N/A",
        primaryBlockName: (i.primaryBlock as { name: string })?.name || "N/A",
        normalisedScore: ((i.screenings as Record<string, unknown>[])?.[0]?.normalisedScore as number) ?? null,
        createdAt: i.createdAt as string,
        version: i.version as number,
      }));
      setItems(mapped);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { fetchItems(); }, [keyword, statusFilter]);

  const statusMap: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
    DRAFT: { label: "Nháp", variant: "default" },
    PENDING_SCREENING: { label: "Chờ AI", variant: "info" },
    SCREENED: { label: "Đã chấm", variant: "info" },
    IN_REVIEW: { label: "Đang duyệt", variant: "warning" },
    APPROVED: { label: "Đã duyệt", variant: "success" },
    REJECTED: { label: "Từ chối", variant: "danger" },
    MODIFICATION_REQUESTED: { label: "Y/c sửa", variant: "warning" },
    PUBLISHED: { label: "Công khai", variant: "success" },
    COMPLETED: { label: "Hoàn tất", variant: "success" },
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Quản lý Sáng kiến</h1>
          <p className="text-text-secondary mt-1">Xem tất cả sáng kiến toàn ngân hàng</p>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input placeholder="Tìm kiếm..." value={keyword} onChange={(e) => setKeyword(e.target.value)} className="pl-10" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-alt border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusMap).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={32} /></div>
        ) : items.length === 0 ? (
          <Card className="text-center py-12">
            <ClipboardList size={48} className="mx-auto text-text-muted mb-4" />
            <p className="text-text-secondary">Chưa có sáng kiến nào</p>
          </Card>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_120px_100px_80px_80px_120px] gap-4 px-4 text-xs font-semibold text-text-muted uppercase tracking-wider py-2">
              <span>Sáng kiến</span>
              <span>Tác giả</span>
              <span>Khối</span>
              <span>Điểm</span>
              <span>Trạng thái</span>
              <span></span>
            </div>
            {items.map((item) => {
              const st = statusMap[item.status] || statusMap.DRAFT;
              return (
                <Card key={item.id} className="grid grid-cols-[1fr_120px_100px_80px_80px_120px] gap-4 items-center p-4">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-brand">{item.code}</p>
                    <p className="text-sm font-medium text-text-primary truncate">{item.title}</p>
                    <p className="text-[10px] text-text-muted">{new Date(item.createdAt).toLocaleString("vi-VN")}</p>
                  </div>
                  <span className="text-xs text-text-secondary truncate">{item.authorName}</span>
                  <span className="text-xs text-text-secondary truncate">{item.primaryBlockName}</span>
                  <span className={item.normalisedScore != null
                    ? (item.normalisedScore >= 70 ? "text-emerald-400 font-bold" : item.normalisedScore >= 40 ? "text-amber-400 font-bold" : "text-red-400")
                    : "text-text-muted"
                  }>
                    {item.normalisedScore?.toFixed(0) ?? "-"}/100
                  </span>
                  <Badge variant={st.variant}>{st.label}</Badge>
                  <Link href={`/innovations/${item.id}`}>
                    <Button variant="ghost" size="sm"><Eye size={14} /> Xem</Button>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
