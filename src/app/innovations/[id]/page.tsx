"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Brain, Star } from "lucide-react";

interface InnovationDetail {
  id: string;
  code: string;
  title: string;
  executiveSummary: string;
  painPoints: string;
  detailedSolution: string | null;
  status: string;
  version: number;
  isBankWide: boolean;
  primaryBlock: { code: string; name: string } | null;
  classifications: { block: { code: string; name: string } }[];
  author: { fullName: string; email: string };
  screenings: {
    id: string;
    normalisedScore: number | null;
    framework: { name: string };
    createdAt: string;
    scores: { score: number; reasoning: string | null; criterion: { name: string } }[];
  }[];
  reviews: {
    decision: string;
    feedbackNotes: string | null;
    block: { code: string; name: string };
    reviewer: { fullName: string };
    reviewedAt: string | null;
  }[];
}

export default function InnovationDetailPage() {
  const params = useParams();
  const innovationId = params.id as string;
  const [data, setData] = useState<InnovationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [screening, setScreening] = useState(false);

  useEffect(() => {
    fetch(`/api/innovations/${innovationId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [innovationId]);

  const triggerScreening = async () => {
    setScreening(true);
    try {
      await fetch(`/api/innovations/${innovationId}/screen`, { method: "POST" });
      const res = await fetch(`/api/innovations/${innovationId}`);
      setData(await res.json());
    } finally {
      setScreening(false);
    }
  };

  if (loading) return <DashboardLayout><div className="flex justify-center py-12"><Spinner size={32} /></div></DashboardLayout>;
  if (!data) return <DashboardLayout><Card className="text-center py-12"><p className="text-text-secondary">Không tìm thấy sáng kiến</p></Card></DashboardLayout>;

  const statusMap: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
    DRAFT: { label: "Nháp", variant: "default" },
    PENDING_SCREENING: { label: "Chờ AI chấm", variant: "info" },
    SCREENED: { label: "Đã chấm điểm", variant: "info" },
    IN_REVIEW: { label: "Đang phê duyệt", variant: "warning" },
    APPROVED: { label: "Đã phê duyệt", variant: "success" },
    REJECTED: { label: "Từ chối", variant: "danger" },
    MODIFICATION_REQUESTED: { label: "Yêu cầu sửa", variant: "warning" },
    PUBLISHED: { label: "Công khai", variant: "success" },
    COMPLETED: { label: "Hoàn tất", variant: "success" },
  };

  const latestScreening = data.screenings?.[data.screenings.length - 1];
  const statusInfo = statusMap[data.status] || statusMap.DRAFT;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/"><Button variant="ghost" size="sm"><ArrowLeft size={16} /></Button></Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-primary-light">{data.code}</span>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              {data.isBankWide && <Badge variant="warning">Toàn ngân hàng</Badge>}
            </div>
            <h1 className="text-2xl font-bold text-text-primary">{data.title}</h1>
            <p className="text-sm text-text-muted mt-1">
              Tác giả: {data.author.fullName} &middot; Khối chính: {data.primaryBlock?.name || "N/A"} &middot; Phiên bản: V{data.version}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Tóm tắt giải pháp</h3>
              <p className="text-text-primary whitespace-pre-wrap">{data.executiveSummary}</p>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Thực trạng & Nỗi đau</h3>
              <p className="text-text-primary whitespace-pre-wrap">{data.painPoints}</p>
            </Card>

            {data.detailedSolution && (
              <Card>
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Giải pháp chi tiết</h3>
                <p className="text-text-primary whitespace-pre-wrap">{data.detailedSolution}</p>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Khối thụ hưởng</h3>
              <div className="flex flex-wrap gap-1.5">
                {data.classifications.map((c) => (
                  <Badge key={c.block.code} variant="info">{c.block.code}</Badge>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Điểm AI</h3>
              {latestScreening ? (
                <div>
                  <div className="text-center mb-3">
                    <span className={`text-3xl font-bold ${
                      (latestScreening.normalisedScore ?? 0) >= 70 ? "text-emerald-400" :
                      (latestScreening.normalisedScore ?? 0) >= 40 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {latestScreening.normalisedScore?.toFixed(1) ?? "N/A"}
                    </span>
                    <p className="text-xs text-text-muted">/100 - {latestScreening.framework.name}</p>
                  </div>
                  {latestScreening.scores.map((s) => (
                    <div key={s.criterion.name} className="flex items-center justify-between py-1.5 border-t border-navy-700">
                      <span className="text-xs text-text-secondary">{s.criterion.name}</span>
                      <span className="text-xs font-medium text-text-primary">{s.score}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center">
                  <Brain size={32} className="mx-auto text-text-muted mb-2" />
                  <p className="text-sm text-text-muted mb-3">Chưa có điểm AI</p>
                  {data.status === "PENDING_SCREENING" && (
                    <Button size="sm" onClick={triggerScreening} disabled={screening}>
                      {screening ? <Spinner size={14} /> : <Star size={14} />}
                      Chạy AI chấm điểm
                    </Button>
                  )}
                </div>
              )}
            </Card>

            {data.reviews.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Kết quả phê duyệt</h3>
                <div className="space-y-2">
                  {data.reviews.map((r, i) => (
                    <div key={i} className="p-2 rounded bg-navy-900/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-text-primary">{r.block.code}</span>
                        <Badge variant={r.decision === "APPROVED" ? "success" : r.decision === "REJECTED" ? "danger" : "default"}>
                          {r.decision}
                        </Badge>
                      </div>
                      {r.feedbackNotes && <p className="text-xs text-text-muted mt-1">{r.feedbackNotes}</p>}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
