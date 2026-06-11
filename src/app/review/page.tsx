"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ClipboardCheck, ThumbsUp, ThumbsDown, RotateCcw, MessageSquare } from "lucide-react";

interface ReviewItem {
  id: string;
  innovationId: string;
  innovationTitle: string;
  innovationCode: string;
  primaryBlockName: string;
  normalisedScore: number | null;
  decision: string;
  reviewedAt: string | null;
  authorName: string;
}

export default function ReviewPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/review")
      .then((r) => r.json())
      .then(setReviews)
      .finally(() => setLoading(false));
  }, []);

  const handleDecision = async (innovationId: string, blockId: string, decision: string) => {
    await fetch(`/api/review/${innovationId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    setReviews((prev) =>
      prev.map((r) =>
        r.innovationId === innovationId ? { ...r, decision, reviewedAt: new Date().toISOString() } : r
      )
    );
  };

  const getDecisionBadge = (decision: string) => {
    const map: Record<string, { label: string; variant: "success" | "danger" | "warning" | "default" }> = {
      PENDING: { label: "Chờ duyệt", variant: "default" },
      APPROVED: { label: "Đã duyệt", variant: "success" },
      REJECTED: { label: "Từ chối", variant: "danger" },
      MODIFICATION_REQUESTED: { label: "Yêu cầu sửa", variant: "warning" },
    };
    const m = map[decision] || map.PENDING;
    return <Badge variant={m.variant}>{m.label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Phê duyệt Sáng kiến (PIC)</h1>
          <p className="text-text-secondary mt-1">Duyệt các sáng kiến thuộc khối phụ trách</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={32} /></div>
        ) : reviews.length === 0 ? (
          <Card className="text-center py-12">
            <ClipboardCheck size={48} className="mx-auto text-text-muted mb-4" />
            <p className="text-text-secondary">Chưa có sáng kiến nào cần phê duyệt</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.innovationId} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-primary-light">{review.innovationCode}</span>
                      {getDecisionBadge(review.decision)}
                    </div>
                    <h3 className="text-base font-semibold text-text-primary">{review.innovationTitle}</h3>
                    <p className="text-xs text-text-muted mt-1">
                      Tác giả: {review.authorName} &middot; Khối chính: {review.primaryBlockName}
                    </p>
                  </div>
                  {review.normalisedScore != null && (
                    <div className="text-center ml-4">
                      <div className={`text-2xl font-bold ${
                        review.normalisedScore >= 70 ? "text-emerald-400" :
                        review.normalisedScore >= 40 ? "text-amber-400" : "text-red-400"
                      }`}>
                        {review.normalisedScore}
                      </div>
                      <p className="text-[10px] text-text-muted">/100</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {review.decision === "PENDING" && (
                    <>
                      <Button size="sm" variant="primary" onClick={() => handleDecision(review.innovationId, "", "APPROVED")}>
                        <ThumbsUp size={14} /> Phê duyệt
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDecision(review.innovationId, "", "REJECTED")}>
                        <ThumbsDown size={14} /> Từ chối
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDecision(review.innovationId, "", "MODIFICATION_REQUESTED")}>
                        <RotateCcw size={14} /> Yêu cầu chỉnh sửa
                      </Button>
                    </>
                  )}
                  <Link href={`/review/${review.innovationId}`}>
                    <Button size="sm" variant="ghost">
                      <MessageSquare size={14} /> Xem chi tiết
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
