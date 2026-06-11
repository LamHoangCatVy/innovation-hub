"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { InnovationInputForm } from "@/components/innovations/input-form";
import { ClassificationPanel } from "@/components/innovations/classification-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ChevronRight, ChevronLeft, Send, Save } from "lucide-react";

const STEPS = [
  { id: 1, label: "Nhập thông tin" },
  { id: 2, label: "Phân loại khối" },
  { id: 3, label: "Xác nhận & Gửi" },
];

export default function NewInnovationPage() {
  const router = useRouter();
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
      const res = await fetch("/api/innovations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          primaryBlockId,
          selectedBlockIds,
          isBankWide,
          status: "DRAFT",
        }),
      });
      if (!res.ok) throw new Error("Failed to save draft");
      router.push("/innovations/drafts");
    } catch {
      setError("Không thể lưu bản nháp. Vui lòng thử lại.");
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
        headers: { "Content-Type": "application/json" },
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
      router.push(`/innovations/${data.id}`);
    } catch {
      setError("Không thể gửi sáng kiến. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
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
                    ? "bg-primary/20 text-primary-light"
                    : step > s.id
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-navy-800 text-text-muted"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    step >= s.id ? "bg-primary text-white" : "bg-navy-700 text-text-muted"
                  }`}
                >
                  {s.id}
                </span>
                {s.label}
              </div>
              {s.id < 3 && <ChevronRight size={16} className="text-navy-700" />}
            </div>
          ))}
        </div>

        <Card className="p-8">
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
                <div className="p-4 rounded-lg bg-navy-900 border border-navy-700">
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

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
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
            {step < 3 ? (
              <Button onClick={handleNext} disabled={!canNext()}>
                Tiếp theo <ChevronRight size={16} />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Spinner size={16} /> : <Send size={16} />}
                Gửi Sáng kiến
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
