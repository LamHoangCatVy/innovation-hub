"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";

interface ReviewDetail {
  innovationId: string;
  innovationCode: string;
  innovationTitle: string;
  executiveSummary: string;
  painPoints: string;
  detailedSolution: string | null;
  authorName: string;
  primaryBlockName: string;
  isBankWide: boolean;
  normalisedScore: number | null;
  scores: { criterion: string; score: number; reasoning: string | null }[];
  frameworkName: string;
  decision: string;
  internalNotes: string | null;
  feedbackNotes: string | null;
}

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const innovationId = params.id as string;
  const [data, setData] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [internalNotes, setInternalNotes] = useState("");
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/innovations/${innovationId}`)
      .then((r) => r.json())
      .then((innovation) => {
        const screening = innovation.screenings?.[0];
        setData({
          innovationId: innovation.id,
          innovationCode: innovation.code,
          innovationTitle: innovation.title,
          executiveSummary: innovation.executiveSummary,
          painPoints: innovation.painPoints,
          detailedSolution: innovation.detailedSolution,
          authorName: innovation.author?.fullName || "",
          primaryBlockName: innovation.primaryBlock?.name || "",
          isBankWide: innovation.isBankWide,
          normalisedScore: screening?.normalisedScore ?? null,
          scores: screening?.scores?.map((s: { criterion: { name: string }; score: number; reasoning: string | null }) => ({
            criterion: s.criterion.name,
            score: s.score,
            reasoning: s.reasoning,
          })) || [],
          frameworkName: screening?.framework?.name || "",
          decision: innovation.reviews?.[0]?.decision || "PENDING",
          internalNotes: innovation.reviews?.[0]?.internalNotes || "",
          feedbackNotes: innovation.reviews?.[0]?.feedbackNotes || "",
        });
        setInternalNotes(innovation.reviews?.[0]?.internalNotes || "");
        setFeedbackNotes(innovation.reviews?.[0]?.feedbackNotes || "");
      })
      .finally(() => setLoading(false));
  }, [innovationId]);

  const handleDecision = async (decision: string) => {
    setSubmitting(true);
    try {
      await fetch(`/api/review/${innovationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, internalNotes, feedbackNotes }),
      });
      router.push("/review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DashboardLayout><div className="flex justify-center py-12"><Spinner size={32} /></div></DashboardLayout>;
  if (!data) return <DashboardLayout><Card className="text-center py-12"><p className="text-text-secondary">Không tìm thấy</p></Card></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/review"><Button variant="ghost" size="sm"><ArrowLeft size={16} /></Button></Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-brand">{data.innovationCode}</span>
              <Badge>{data.decision === "PENDING" ? "Chờ duyệt" : data.decision}</Badge>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">{data.innovationTitle}</h1>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">Tóm tắt giải pháp</h3>
              <p className="text-text-primary text-sm whitespace-pre-wrap">{data.executiveSummary}</p>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">Thực trạng & Nỗi đau</h3>
              <p className="text-text-primary text-sm whitespace-pre-wrap">{data.painPoints}</p>
            </Card>

            {data.detailedSolution && (
              <Card>
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">Giải pháp chi tiết</h3>
                <p className="text-text-primary text-sm whitespace-pre-wrap">{data.detailedSolution}</p>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Thông tin</h3>
              <div className="space-y-2 text-sm">
                <p className="text-text-secondary">Tác giả: <span className="text-text-primary">{data.authorName}</span></p>
                <p className="text-text-secondary">Khối: <span className="text-text-primary">{data.primaryBlockName}</span></p>
                <p className="text-text-secondary">Phạm vi: <span className="text-text-primary">{data.isBankWide ? "Toàn ngân hàng" : "Theo khối"}</span></p>
              </div>
            </Card>

            {data.normalisedScore != null && (
              <Card>
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Điểm AI ({data.frameworkName})
                </h3>
                <div className="text-center mb-3">
                  <span className={`text-3xl font-bold ${
                    data.normalisedScore >= 70 ? "text-emerald-400" :
                    data.normalisedScore >= 40 ? "text-amber-400" : "text-red-400"
                  }`}>
                    {data.normalisedScore.toFixed(1)}
                  </span>
                  <p className="text-xs text-text-muted">/100</p>
                </div>
                {data.scores.map((s) => (
                  <div key={s.criterion} className="py-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-text-primary">{s.criterion}</span>
                      <span className="text-xs font-bold text-brand">{s.score}</span>
                    </div>
                    {s.reasoning && <p className="text-xs text-text-muted mt-1">{s.reasoning}</p>}
                  </div>
                ))}
              </Card>
            )}

            <Card>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Internal Notes (Ẩn với người tạo)
              </h3>
              <Textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Ghi chú nội bộ cho PIC..."
                className="min-h-[100px]"
              />
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Feedback cho người tạo
              </h3>
              <Textarea
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                placeholder="Phản hồi gửi tới tác giả (bắt buộc nếu từ chối/yêu cầu sửa)..."
                className="min-h-[100px]"
              />
            </Card>

            {data.decision === "PENDING" && (
              <div className="flex flex-col gap-2">
                <Button onClick={() => handleDecision("APPROVED")} disabled={submitting}>
                  {submitting ? <Spinner size={16} /> : <ThumbsUp size={16} />}
                  Phê duyệt
                </Button>
                <Button variant="danger" onClick={() => handleDecision("REJECTED")} disabled={submitting}>
                  {submitting ? <Spinner size={16} /> : <ThumbsDown size={16} />}
                  Từ chối
                </Button>
                <Button variant="outline" onClick={() => handleDecision("MODIFICATION_REQUESTED")} disabled={submitting}>
                  {submitting ? <Spinner size={16} /> : <RotateCcw size={16} />}
                  Yêu cầu chỉnh sửa
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
