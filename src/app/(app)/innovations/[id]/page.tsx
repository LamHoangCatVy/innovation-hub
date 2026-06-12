"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Brain, Star, Edit3, AlertTriangle } from "lucide-react";
import { Discussion } from "@/components/innovations/discussion";
import { ImprovementQuestions, parseQuestions } from "@/components/innovations/improvement-questions";
import { useUser } from "@/lib/user-context";
import { isPublicInnovationStatus } from "@/lib/business-policy";

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
    author: { id: string; fullName: string; email: string };
    logs: { action: string; payload: string | null; createdAt: string }[];
    screenings: {
      id: string;
      normalisedScore: number | null;
      improvementQuestions: string | null;
      framework: { name: string };
      createdAt: string;
      scores: { score: number; reasoning: string | null; criterion: { name: string } }[];
    }[];
    reviews: {
      decision: string;
      feedbackNotes: string | null;
      internalNotes: string | null;
      block: { code: string; name: string };
      reviewer: { fullName: string };
      reviewedAt: string | null;
    }[];
    _count: { upvotes: number; comments: number };
  }

export default function InnovationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const innovationId = params.id as string;
  const { user } = useUser();
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

  if (loading) return <><div className="flex justify-center py-12"><Spinner size={32} /></div></>;
  if (!data) return <><Card className="text-center py-12"><p className="text-text-secondary">Không tìm thấy sáng kiến</p></Card></>;

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
  const feedbackLog = data.logs?.find((l) => l.action === "FEEDBACK_AUTO");
  const haveReviewFeedback = data.reviews?.some((r) => r.feedbackNotes);
  const canEdit =
    (data.status === "DRAFT" || data.status === "MODIFICATION_REQUESTED") &&
    (data.author.id === user.id || user.role === "ADMIN");
  const canDiscuss = isPublicInnovationStatus(data.status);

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft size={16} />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-brand">{data.code}</span>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              {data.isBankWide && <Badge variant="warning">Toàn ngân hàng</Badge>}
              {data.version > 1 && <Badge>V{data.version}</Badge>}
            </div>
            <h1 className="text-2xl font-bold text-text-primary">{data.title}</h1>
            <p className="text-sm text-text-muted mt-1">
              Tác giả: {data.author.fullName} &middot; Khối chính: {data.primaryBlock?.name || "N/A"}
            </p>
          </div>
          {canEdit && (
            <Link href={`/innovations/new?edit=${data.id}`}>
              <Button size="sm" className="whitespace-nowrap">
                <Edit3 size={14} />
                {data.status === "MODIFICATION_REQUESTED" ? "Sửa & gửi lại" : "Tiếp tục sửa"}
              </Button>
            </Link>
          )}
        </div>

        {data.status === "MODIFICATION_REQUESTED" && (
          <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-400" />
              <span className="font-semibold text-amber-400">Cần bổ sung thông tin</span>
            </div>
            {feedbackLog?.payload && (() => {
              try {
                const p = JSON.parse(feedbackLog.payload);
                return (
                  <ul className="space-y-1">
                    {p.completeness?.missing?.map((m: string, i: number) => (
                      <li key={i} className="text-sm text-amber-400 flex items-start gap-2">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />{m}
                      </li>
                    ))}
                  </ul>
                );
              } catch { return null; }
            })()}
            {haveReviewFeedback && (
              <div className="mt-2 pt-2 border-t border-amber-500/20">
                {data.reviews.filter((r) => r.feedbackNotes).map((r, i) => (
                  <div key={i} className="text-sm text-amber-400 mt-1">
                    <span className="font-medium">{r.block.code} PIC:</span> {r.feedbackNotes}
                  </div>
                ))}
              </div>
            )}
            {canEdit && (
              <Link href={`/innovations/new?edit=${data.id}`}>
                <Button size="sm">
                  <Edit3 size={14} /> Sửa & gửi lại
                </Button>
              </Link>
            )}
          </div>
        )}

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
                    <div key={s.criterion.name} className="flex items-center justify-between py-1.5 border-t border-border">
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

            {(() => {
              const questions = parseQuestions(latestScreening?.improvementQuestions);
              if (questions.length === 0) return null;
              return (
                <Card>
                  <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
                    Câu hỏi gợi mở để hoàn thiện
                  </h3>
                  <ImprovementQuestions questions={questions} />
                </Card>
              );
            })()}

            {data.reviews.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Kết quả phê duyệt</h3>
                <div className="space-y-2">
                  {data.reviews.map((r, i) => (
                    <div key={i} className="p-2 rounded bg-surface-alt/50">
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

        {canDiscuss && (
          <Card>
            <Discussion innovationId={data.id} />
          </Card>
        )}
      </div>
    </>
  );
}
