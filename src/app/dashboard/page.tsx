"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useUser } from "@/lib/user-context";
import {
  Lightbulb, CheckCircle2, ChevronRight,
  Brain, Award, Clock, XCircle, ArrowUpRight, Shield
} from "lucide-react";

interface Stats {
  total: number;
  draft: number;
  pendingScreening: number;
  screened: number;
  inReview: number;
  approved: number;
  rejected: number;
  modificationRequested: number;
  published: number;
  completed: number;
  totalScore: number;
  avgScore: number;
  topBlocks: { code: string; name: string; count: number; avgScore: number }[];
  recentInnovations: {
    id: string; code: string; title: string; status: string;
    normalisedScore: number | null; authorName: string; primaryBlockName: string;
    createdAt: string;
  }[];
}

export default function AdminDashboardPage() {
  const { user } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/innovations")
      .then((r) => r.json())
      .then((data) => {
        const items: Record<string, unknown>[] = Array.isArray(data) ? data : [];
        const total = items.length;

        let totalScore = 0;
        let scoreCount = 0;
        const blockStats = new Map<string, { name: string; count: number; totalScore: number }>();

        const countByStatus = (s: string) => items.filter((i) => i.status === s).length;

        items.forEach((i) => {
          const screening = (i.screenings as Record<string, unknown>[])?.[0];
          const score = screening?.normalisedScore as number | undefined;
          if (typeof score === "number") {
            totalScore += score;
            scoreCount++;
          }
          const block = i.primaryBlock as { code: string; name: string } | null;
          if (block?.code) {
            const existing = blockStats.get(block.code) || { name: block.name, count: 0, totalScore: 0 };
            existing.count++;
            if (typeof score === "number") existing.totalScore += score;
            blockStats.set(block.code, existing);
          }
        });

        const topBlocks = Array.from(blockStats.entries())
          .map(([code, v]) => ({
            code,
            name: v.name,
            count: v.count,
            avgScore: v.count > 0 ? Math.round((v.totalScore / v.count) * 10) / 10 : 0,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setStats({
          total,
          draft: countByStatus("DRAFT"),
          pendingScreening: countByStatus("PENDING_SCREENING"),
          screened: countByStatus("SCREENED"),
          inReview: countByStatus("IN_REVIEW"),
          approved: countByStatus("APPROVED"),
          rejected: countByStatus("REJECTED"),
          modificationRequested: countByStatus("MODIFICATION_REQUESTED"),
          published: countByStatus("PUBLISHED"),
          completed: countByStatus("COMPLETED"),
          totalScore,
          avgScore: scoreCount > 0 ? Math.round((totalScore / scoreCount) * 10) / 10 : 0,
          topBlocks,
          recentInnovations: items.slice(0, 8).map((i: Record<string, unknown>) => ({
            id: String(i.id || ""),
            code: String(i.code || ""),
            title: String(i.title || ""),
            status: String(i.status || ""),
            normalisedScore: typeof ((i.screenings as Record<string, unknown>[])?.[0]?.normalisedScore) === "number"
              ? Number(((i.screenings as Record<string, unknown>[])?.[0]?.normalisedScore)) : null,
            authorName: (i.author as { fullName: string })?.fullName || "N/A",
            primaryBlockName: (i.primaryBlock as { name: string })?.name || "N/A",
            createdAt: String(i.createdAt || ""),
          })),
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (user.role !== "ADMIN") {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <Shield size={64} className="mx-auto text-text-muted mb-4" />
          <h1 className="text-2xl font-bold text-text-primary">Quyền truy cập bị giới hạn</h1>
          <p className="text-text-secondary mt-2">Dashboard chỉ dành cho Admin. Vui lòng chuyển sang role Admin ở header.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) return <DashboardLayout><div className="flex justify-center py-12"><Spinner size={32} /></div></DashboardLayout>;

  const s = stats!;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
            <p className="text-text-secondary mt-1">Theo dõi hiệu suất đổi mới sáng tạo toàn ngân hàng</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="success">Real-time</Badge>
            <Link href="/admin/innovations">
              <Button variant="outline" size="sm">Quản lý Sáng kiến <ArrowUpRight size={14} /></Button>
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Tổng", value: s.total, icon: Lightbulb, color: "text-brand", bg: "bg-brand/10" },
            { label: "Chờ AI", value: s.pendingScreening, icon: Brain, color: "text-purple-400", bg: "bg-purple-500/10" },
            { label: "Đang duyệt", value: s.inReview, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
            { label: "Đã duyệt", value: s.approved + s.published, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "Từ chối", value: s.rejected, icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
            { label: "Điểm TB", value: s.avgScore, icon: Award, color: "text-blue-400", bg: "bg-blue-500/10", suffix: "/100" },
          ].map((m, i) => (
            <Card key={i} className="flex flex-col items-center p-5 gap-2">
              <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center`}>
                <m.icon size={20} className={m.color} />
              </div>
              <p className="text-2xl font-bold text-text-primary">
                {typeof m.value === "number" && m.value % 1 !== 0 ? m.value.toFixed(1) : m.value}
                {m.suffix || ""}
              </p>
              <p className="text-xs text-text-muted text-center">{m.label}</p>
            </Card>
          ))}
        </div>

        {/* Status Breakdown + Top Blocks */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Phân bố Trạng thái</h3>
            <div className="space-y-3">
              {[
                { label: "Nháp", value: s.draft, color: "bg-gray-400", pct: s.total > 0 ? (s.draft / s.total * 100) : 0 },
                { label: "Chờ AI", value: s.pendingScreening, color: "bg-purple-400", pct: s.total > 0 ? (s.pendingScreening / s.total * 100) : 0 },
                { label: "Đã chấm", value: s.screened, color: "bg-blue-400", pct: s.total > 0 ? (s.screened / s.total * 100) : 0 },
                { label: "Đang duyệt", value: s.inReview, color: "bg-amber-400", pct: s.total > 0 ? (s.inReview / s.total * 100) : 0 },
                { label: "Đã duyệt", value: s.approved + s.published, color: "bg-emerald-400", pct: s.total > 0 ? ((s.approved + s.published) / s.total * 100) : 0 },
                { label: "Từ chối", value: s.rejected, color: "bg-red-400", pct: s.total > 0 ? (s.rejected / s.total * 100) : 0 },
              ].map((bar) => (
                <div key={bar.label} className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary w-16">{bar.label}</span>
                  <div className="flex-1 h-5 bg-surface-alt rounded-full overflow-hidden">
                    <div
                      className={`h-full ${bar.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(bar.pct, bar.value > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-text-primary w-6 text-right">{bar.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Top Khối</h3>
            <div className="space-y-3">
              {s.topBlocks.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-4">Chưa có dữ liệu</p>
              ) : (
                s.topBlocks.map((b, i) => (
                  <div key={b.code} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-text-muted w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{b.name}</p>
                      <p className="text-xs text-text-muted">{b.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-text-primary">{b.count}</p>
                      <p className="text-xs text-text-muted">{b.avgScore}/100</p>
                    </div>
                    <div className="w-16 h-1.5 bg-surface-alt rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand rounded-full"
                        style={{ width: `${Math.min(b.count / (s.total || 1) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Recent Innovations Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Sáng kiến Gần đây</h3>
            <Link href="/admin/innovations">
              <Button variant="ghost" size="sm">Xem tất cả <ChevronRight size={14} /></Button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wider">
                  <th className="text-left py-3 px-2">Mã</th>
                  <th className="text-left py-3 px-2">Tiêu đề</th>
                  <th className="text-left py-3 px-2">Tác giả</th>
                  <th className="text-left py-3 px-2">Khối</th>
                  <th className="text-center py-3 px-2">Điểm</th>
                  <th className="text-center py-3 px-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {s.recentInnovations.map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-surface-alt transition-colors">
                    <td className="py-3 px-2">
                      <Link href={`/innovations/${item.id}`} className="text-xs font-mono text-brand hover:underline">
                        {item.code}
                      </Link>
                    </td>
                    <td className="py-3 px-2 max-w-[250px] truncate text-text-primary">{item.title}</td>
                    <td className="py-3 px-2 text-text-secondary text-xs">{item.authorName}</td>
                    <td className="py-3 px-2 text-text-secondary text-xs">{item.primaryBlockName}</td>
                    <td className="py-3 px-2 text-center">
                      {item.normalisedScore != null ? (
                        <span className={item.normalisedScore >= 70 ? "text-emerald-400 font-bold text-xs" : item.normalisedScore >= 40 ? "text-amber-400 font-bold text-xs" : "text-red-400 text-xs"}>
                          {item.normalisedScore.toFixed(0)}
                        </span>
                      ) : (
                        <span className="text-text-muted text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge variant={
                        item.status === "APPROVED" || item.status === "PUBLISHED" || item.status === "COMPLETED" ? "success"
                        : item.status === "REJECTED" ? "danger"
                        : item.status === "IN_REVIEW" || item.status === "MODIFICATION_REQUESTED" ? "warning"
                        : "info"
                      }>
                        {item.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
