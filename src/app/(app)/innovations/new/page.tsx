"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/user-context";
import { InnovationInputForm } from "@/components/innovations/input-form";
import { ClassificationPanel } from "@/components/innovations/classification-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ChevronRight, ChevronLeft, Send, Save, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";

const STEPS = [
  { id: 1, label: "Nhập thông tin" },
  { id: 2, label: "Phân loại khối" },
  { id: 3, label: "Xác nhận & Gửi" },
  { id: 4, label: "Kết quả AI" },
];

function NewInnovationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    executiveSummary: "",
    painPoints: "",
    detailedSolution: "",
  });
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [primaryBlockId, setPrimaryBlockId] = useState("");
  const [isBankWide, setIsBankWide] = useState(false);
  const [error, setError] = useState("");
  const [screeningResult, setScreeningResult] = useState<{
    finalScore: number;
    screeningMethod: string;
    completeness: { complete: boolean; missing: string[] };
    status: string;
    hubUrl: string | null;
  } | null>(null);
  const [innovationId, setInnovationId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(!!editId);

  useEffect(() => {
    if (editId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditLoading(true);
      fetch(`/api/innovations/${editId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.id) {
            setInnovationId(data.id);
            setFormData({
              title: data.title || "",
              executiveSummary: data.executiveSummary || "",
              painPoints: data.painPoints || "",
              detailedSolution: data.detailedSolution || "",
            });
            const blockIds = data.classifications?.map((c: { block: { code: string } }) => c.block.code) || [];
            setSelectedBlockIds(blockIds);
            setPrimaryBlockId(data.primaryBlock?.code || "");
            setIsBankWide(data.isBankWide || false);
          }
        })
        .finally(() => setEditLoading(false));
    }
  }, [editId]);

  const userHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "x-vpb-user": JSON.stringify({ userId: user.id, username: user.username, fullName: user.fullName, role: user.role, blockCode: user.blockCode }),
  };

  const handleBlocksChange = (blockIds: string[], primaryId: string, bankWide: boolean) => {
    setSelectedBlockIds(blockIds);
    setPrimaryBlockId(primaryId);
    setIsBankWide(bankWide);
  };

  const canNext = () => {
    if (step === 1) return formData.title.trim() && formData.executiveSummary.trim() && formData.painPoints.trim();
    if (step === 2) return selectedBlockIds.length > 0 && !!primaryBlockId;
    return true;
  };

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleSaveDraft = async () => {
    setSubmitting(true);
    setError("");
    try {
      await fetch("/api/innovations/drafts", {
        method: "POST",
        headers: userHeaders,
        body: JSON.stringify({ ...formData, primaryBlockId, isBankWide }),
      });
      router.push("/innovations/drafts");
    } catch {
      setError("Không thể lưu bản nháp.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/innovations", {
        method: "POST",
        headers: userHeaders,
        body: JSON.stringify({
          ...formData,
          primaryBlockId,
          selectedBlockIds,
          isBankWide,
          status: "PENDING_SCREENING",
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      const data = await res.json();
      setInnovationId(data.innovation.id);
      if (data.screening) {
        setScreeningResult(data.screening);
      }
      setStep(4);
    } catch {
      setError("Không thể gửi sáng kiến. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text-primary">Đề xuất Sáng kiến mới</h1>
        </div>

        <div className="flex items-center gap-2">
          {STEPS.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  step === s.id
                    ? "bg-brand/20 text-brand"
                    : step > s.id
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-surface-alt text-text-muted"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    step >= s.id ? "bg-brand text-white" : "bg-surface-alt text-text-muted"
                  }`}
                >
                  {s.id}
                </span>
                {s.label}
              </div>
              {s.id < 4 && <ChevronRight size={16} className="text-border" />}
            </div>
          ))}
        </div>

        <Card className="p-8">
          {editLoading ? (
            <div className="flex justify-center py-12"><Spinner size={32} /></div>
          ) : (
            <>
              {step === 1 && (
            <InnovationInputForm onDataChange={setFormData} />
          )}

          {step === 2 && (
            <ClassificationPanel
              selectedBlockIds={selectedBlockIds}
              primaryBlockId={primaryBlockId}
              isBankWide={isBankWide}
              onBlocksChange={handleBlocksChange}
            />
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-text-primary">Bước 3: Xác nhận & Gửi</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-surface-alt border border-border">
                  <p className="text-sm font-medium text-text-primary">{formData.title || "(Chưa có tiêu đề)"}</p>
                  <p className="text-xs text-text-muted mt-1 line-clamp-2">{formData.executiveSummary}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedBlockIds.map((code) => (
                    <Badge key={code} variant={code === primaryBlockId ? "info" : "default"}>
                      {code}{code === primaryBlockId ? " (Chính)" : ""}
                    </Badge>
                  ))}
                  {isBankWide && <Badge variant="warning">Toàn ngân hàng</Badge>}
                </div>
              </div>
            </div>
          )}

          {step >= 4 && screeningResult && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-text-primary">Kết quả Đánh giá AI</h2>

              {/* Score */}
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-brand text-brand mb-3">
                  <span className="text-3xl font-bold">{screeningResult.finalScore}</span>
                </div>
                <p className="text-sm text-text-muted">/100 điểm ({screeningResult.screeningMethod === "llm" ? "AI chấm" : "Chấm quy tắc"})</p>
              </div>

              {/* Status */}
              {screeningResult.completeness.complete ? (
                <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-emerald-400" />
                    <span className="font-semibold text-emerald-400">Thông tin đầy đủ</span>
                  </div>
                  <p className="text-sm text-emerald-400/80 mt-2">
                    Sáng kiến của bạn đã được AI chấm điểm thành công. Hệ thống đang chuyển tiếp đến đầu mối phê duyệt (PIC) của khối để xem xét. Bạn sẽ nhận được thông báo khi có kết quả.
                  </p>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={20} className="text-amber-400" />
                    <span className="font-semibold text-amber-400">Cần bổ sung thông tin</span>
                  </div>
                  <p className="text-sm text-amber-400/80 mt-2">
                    AI phát hiện một số thông tin chưa đầy đủ. Điểm hiện tại là đánh giá sơ bộ. Vui lòng bổ sung các nội dung sau để được chấm điểm chính xác hơn:
                  </p>
                  <ul className="mt-3 space-y-1">
                    {screeningResult.completeness.missing.map((m, i) => (
                      <li key={i} className="text-sm text-amber-400 flex items-start gap-2">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {screeningResult.hubUrl && (
                <Link href={screeningResult.hubUrl}>
                  <Button className="w-full">
                    <ExternalLink size={16} />
                    Xem trên Nhà Chung
                  </Button>
                </Link>
              )}
              {innovationId && (
                <Link href={`/innovations/${innovationId}`}>
                  <Button variant="outline" className="w-full">
                    Xem chi tiết sáng kiến
                  </Button>
                </Link>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}
            </>
          )}
        </Card>

        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            {step > 1 && (
              <Button variant="outline" onClick={handlePrev}>
                <ChevronLeft size={16} /> Quay lại
              </Button>
            )}
            <Button variant="ghost" onClick={handleSaveDraft} disabled={submitting}>
              {submitting ? <Spinner size={16} /> : <Save size={16} />}
              Lưu nháp
            </Button>
          </div>

          <div>
            {submitting && <Spinner size={20} />}
            {!submitting && step < 3 && (
              <Button onClick={handleNext} disabled={!canNext()}>
                Tiếp theo <ChevronRight size={16} />
              </Button>
            )}
            {!submitting && step === 3 && (
              <Button onClick={handleSubmit} disabled={submitting}>
                <Send size={16} /> Gửi Sáng kiến
              </Button>
            )}
            {!submitting && step === 4 && (
              <Link href="/">
                <Button>Về Tổng quan</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function NewInnovationPage() {
  return (
    <Suspense fallback={null}>
      <NewInnovationContent />
    </Suspense>
  );
}
