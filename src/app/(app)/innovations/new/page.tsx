"use client";

import { useState, useEffect, Suspense, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/user-context";
import { InnovationInputForm } from "@/components/innovations/input-form";
import { ClassificationPanel } from "@/components/innovations/classification-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ChevronRight, ChevronLeft, Send, Save, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { BANK_BLOCKS } from "@/lib/constants";

const STEPS = [
  { id: 1, label: "Nhập thông tin" },
  { id: 2, label: "Phân loại khối" },
  { id: 3, label: "Xác nhận & Gửi" },
  { id: 4, label: "Kết quả AI" },
];

interface FormData {
  title: string;
  executiveSummary: string;
  painPoints: string;
  detailedSolution: string;
}

interface InnovationLog {
  action: string;
  payload: string | null;
}

interface InnovationDetailResponse {
  id: string;
  title?: string;
  executiveSummary?: string;
  painPoints?: string;
  detailedSolution?: string | null;
  isBankWide?: boolean;
  status?: string;
  primaryBlock?: { code: string } | null;
  classifications?: { block: { code: string } }[];
  logs?: InnovationLog[];
  screenings?: { normalisedScore: number | null; promptTokens: number | null }[];
}

interface DraftResponse {
  id: string;
  title?: string | null;
  executiveSummary?: string | null;
  painPoints?: string | null;
  detailedSolution?: string | null;
  primaryBlockId?: string | null;
  isBankWide?: boolean;
}

const EMPTY_FORM: FormData = {
  title: "",
  executiveSummary: "",
  painPoints: "",
  detailedSolution: "",
};

function NewInnovationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const draftId = searchParams.get("draft");
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [initialFormData, setInitialFormData] = useState<FormData>(EMPTY_FORM);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [primaryBlockId, setPrimaryBlockId] = useState("");
  const [isBankWide, setIsBankWide] = useState(false);
  const [error, setError] = useState("");
  const [screeningResult, setScreeningResult] = useState<{
    finalScore: number;
    screeningMethod: string;
    completeness: { complete: boolean; missing: string[] };
    status: string;
  } | null>(null);
  const [innovationId, setInnovationId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [editLoading, setEditLoading] = useState(!!editId || !!draftId);

  useEffect(() => {
    if (!editId && !draftId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditLoading(false);
      setInitialFormData(EMPTY_FORM);
      setFormData(EMPTY_FORM);
      setInnovationId(null);
      setSelectedBlockIds([]);
      setPrimaryBlockId("");
      setIsBankWide(false);
      return;
    }

    let active = true;
    setEditLoading(true);
    setError("");

    const load = async () => {
      if (editId) {
        const res = await fetch(`/api/innovations/${editId}`);
        if (!res.ok) throw new Error("Cannot load innovation");
        const data = (await res.json()) as InnovationDetailResponse;
        if (!active) return;

        const nextForm = {
          title: data.title || "",
          executiveSummary: data.executiveSummary || "",
          painPoints: data.painPoints || "",
          detailedSolution: data.detailedSolution || "",
        };
        setInnovationId(data.id);
        setFormData(nextForm);
        setInitialFormData(nextForm);
        setSelectedBlockIds(data.classifications?.map((c) => c.block.code) || []);
        setPrimaryBlockId(data.primaryBlock?.code || "");
        setIsBankWide(data.isBankWide || false);
        return;
      }

      if (draftId) {
        const res = await fetch(`/api/innovations/drafts?id=${draftId}`);
        if (!res.ok) throw new Error("Cannot load draft");
        const data = (await res.json()) as DraftResponse;
        if (!active) return;

        const nextForm = {
          title: data.title || "",
          executiveSummary: data.executiveSummary || "",
          painPoints: data.painPoints || "",
          detailedSolution: data.detailedSolution || "",
        };
        const primary = data.primaryBlockId || "";
        const blockIds = data.isBankWide ? BANK_BLOCKS.map((block) => block.code) : primary ? [primary] : [];

        setInnovationId(null);
        setFormData(nextForm);
        setInitialFormData(nextForm);
        setSelectedBlockIds(blockIds);
        setPrimaryBlockId(primary || blockIds[0] || "");
        setIsBankWide(data.isBankWide || false);
      }
    };

    load()
      .catch(() => {
        if (active) setError("Không thể tải nội dung cần chỉnh sửa.");
      })
      .finally(() => {
        if (active) setEditLoading(false);
      });

    return () => {
      active = false;
    };
  }, [draftId, editId]);

  const userHeaders = useMemo<Record<string, string>>(() => ({
    "Content-Type": "application/json",
    "x-vpb-user": encodeURIComponent(JSON.stringify({ userId: user.id, username: user.username, fullName: user.fullName, role: user.role, blockCode: user.blockCode })),
  }), [user]);

  const autoSavePayload = useMemo(
    () => ({
      ...(editId ? { editId, status: "DRAFT" } : {}),
      ...(draftId ? { draftId } : {}),
      primaryBlockId,
      selectedBlockIds,
      isBankWide,
    }),
    [draftId, editId, isBankWide, primaryBlockId, selectedBlockIds]
  );

  useEffect(() => {
    if (!isPolling || !innovationId || step !== 4) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/innovations/${innovationId}`, { headers: userHeaders });
        if (res.ok) {
          const data = await res.json();
          if (data.status !== "PENDING_SCREENING") {
            setIsPolling(false);
            
            let completeness = { complete: true, missing: [] as string[] };
            const failLog = (data as InnovationDetailResponse).logs?.find((l) => l.action === "FEEDBACK_AUTO");
            if (failLog && failLog.payload) {
              try {
                const payload = JSON.parse(failLog.payload);
                if (payload.completeness) completeness = payload.completeness;
              } catch {}
            } else {
              const compLog = (data as InnovationDetailResponse).logs?.find((l) => l.action === "SCREENING_COMPLETED");
              if (compLog && compLog.payload) {
                try {
                  const payload = JSON.parse(compLog.payload);
                  if (payload.complete !== undefined) completeness.complete = payload.complete;
                } catch {}
              }
            }

            const screening = (data as InnovationDetailResponse).screenings?.[0];
            setScreeningResult({
              finalScore: screening?.normalisedScore || 0,
              screeningMethod: screening?.promptTokens ? "llm" : "rule",
              completeness,
              status: (data as InnovationDetailResponse).status || "DRAFT",
            });
          }
        }
      } catch {
        // silent
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPolling, innovationId, step, userHeaders]);

  const handleBlocksChange = useCallback((blockIds: string[], primaryId: string, bankWide: boolean) => {
    setSelectedBlockIds(blockIds);
    setPrimaryBlockId(primaryId);
    setIsBankWide(bankWide);
  }, []);

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
      const endpoint = editId ? "/api/innovations" : "/api/innovations/drafts";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: userHeaders,
        body: JSON.stringify({
          ...formData,
          primaryBlockId,
          selectedBlockIds,
          isBankWide,
          status: "DRAFT",
          ...(editId ? { editId } : {}),
          ...(draftId ? { draftId } : {}),
        }),
      });
      if (!res.ok) throw new Error("Cannot save draft");
      router.push("/innovations");
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
          ...(editId ? { editId } : {}),
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to submit: ${res.status} ${errorText}`);
      }
      const data = await res.json();
      if (draftId) {
        fetch(`/api/innovations/drafts?id=${draftId}`, { method: "DELETE" }).catch(() => {});
      }
      setInnovationId(data.innovation.id);
      setIsPolling(true);
      setStep(4);
    } catch (err) {
      console.error("handleSubmit error:", err);
      setError(`Không thể gửi sáng kiến.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text-primary">
            {editId ? "Chỉnh sửa & Gửi lại Sáng kiến" : draftId ? "Tiếp tục bản nháp" : "Đề xuất Sáng kiến mới"}
          </h1>
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
                <InnovationInputForm
                  key={`${editId || "new"}-${draftId || "none"}`}
                  onDataChange={setFormData}
                  initialData={initialFormData}
                  autoSaveEndpoint={editId ? "/api/innovations" : "/api/innovations/drafts"}
                  autoSavePayload={autoSavePayload}
                />
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

                  {/* Status-aware messaging */}
                  {screeningResult.status === "IN_REVIEW" && (
                    <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/30">
                      <div className="flex items-center gap-2">
                        <Clock size={20} className="text-blue-400" />
                        <span className="font-semibold text-blue-400">Đang chờ PIC khối duyệt</span>
                      </div>
                      <p className="text-sm text-blue-400/80 mt-2">
                        Sáng kiến đã vượt qua đánh giá AI thành công. Hệ thống đã chuyển tiếp đến đầu mối phê duyệt (PIC) của khối để xem xét. Bạn sẽ nhận được thông báo khi có kết quả.
                      </p>
                    </div>
                  )}

                  {screeningResult.status === "MODIFICATION_REQUESTED" && (
                    <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={20} className="text-amber-400" />
                        <span className="font-semibold text-amber-400">Cần bổ sung thông tin</span>
                      </div>
                      <p className="text-sm text-amber-400/80 mt-2">
                        Sáng kiến chưa đạt yêu cầu để chuyển duyệt. Vui lòng bổ sung các nội dung sau:
                      </p>
                      {!screeningResult.completeness.complete && (
                        <ul className="mt-3 space-y-1">
                          {screeningResult.completeness.missing.map((m, i) => (
                            <li key={i} className="text-sm text-amber-400 flex items-start gap-2">
                              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                              {m}
                            </li>
                          ))}
                        </ul>
                      )}
                      {screeningResult.finalScore < 40 && (
                        <p className="text-sm text-amber-400/80 mt-2">
                          Điểm AI ({screeningResult.finalScore}/100) chưa đạt ngưỡng tối thiểu. Hãy bổ sung thêm dẫn chứng, số liệu cụ thể để cải thiện điểm số.
                        </p>
                      )}
                    </div>
                  )}

                  {screeningResult.status !== "IN_REVIEW" && screeningResult.status !== "MODIFICATION_REQUESTED" && screeningResult.completeness.complete && (
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={20} className="text-emerald-400" />
                        <span className="font-semibold text-emerald-400">Thông tin đầy đủ</span>
                      </div>
                    </div>
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

              {/* Polling / Loading State */}
              {isPolling && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-text-primary">Đang xử lý</h2>
                  <div className="p-8 rounded-xl bg-surface-alt border border-border flex flex-col items-center justify-center text-center">
                    <Spinner size={32} className="text-brand mb-4" />
                    <h3 className="font-semibold text-text-primary mb-1">Đang chấm điểm bằng AI</h3>
                    <p className="text-sm text-text-muted">Quá trình này có thể mất từ 10-15 giây. Vui lòng không đóng trang.</p>
                  </div>
                </div>
              )}

              {/* Screening not returned (failed completely) */}
              {step >= 4 && !isPolling && !screeningResult && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-text-primary">Xử lý thất bại</h2>
                  <div className="p-5 rounded-xl bg-purple-500/10 border border-purple-500/30">
                    <div className="flex items-center gap-2">
                      <Clock size={20} className="text-purple-400" />
                      <span className="font-semibold text-purple-400">Không thể chấm điểm AI</span>
                    </div>
                    <p className="text-sm text-purple-400/80 mt-2">
                      Sáng kiến đã được ghi nhận nhưng quá trình chấm điểm AI gặp sự cố. Bạn có thể thử lại từ trang chi tiết sáng kiến.
                    </p>
                  </div>
                  {innovationId && (
                    <Link href={`/innovations/${innovationId}`}>
                      <Button variant="outline" className="w-full">
                        Xem chi tiết & Thử lại
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
                <Send size={16} /> {editId ? "Gửi lại Sáng kiến" : "Gửi Sáng kiến"}
              </Button>
            )}
            {!submitting && step === 4 && (
              <Link href="/innovations">
                <Button>Về Ý tưởng của tôi</Button>
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
