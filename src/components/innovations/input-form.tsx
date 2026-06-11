"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useAutoSave } from "@/hooks/use-auto-save";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface FormData {
  title: string;
  executiveSummary: string;
  painPoints: string;
  detailedSolution: string;
}

interface InnovationInputFormProps {
  onDataChange: (data: FormData) => void;
  initialData?: Partial<FormData>;
  autoSaveEndpoint?: string;
  autoSavePayload?: Record<string, unknown>;
  autoSaveEnabled?: boolean;
}

function buildInitialForm(initialData?: Partial<FormData>): FormData {
  return {
    title: initialData?.title || "",
    executiveSummary: initialData?.executiveSummary || "",
    painPoints: initialData?.painPoints || "",
    detailedSolution: initialData?.detailedSolution || "",
  };
}

export function InnovationInputForm({
  onDataChange,
  initialData,
  autoSaveEndpoint = "/api/innovations/drafts",
  autoSavePayload,
  autoSaveEnabled = true,
}: InnovationInputFormProps) {
  const [form, setForm] = useState<FormData>({
    title: initialData?.title || "",
    executiveSummary: initialData?.executiveSummary || "",
    painPoints: initialData?.painPoints || "",
    detailedSolution: initialData?.detailedSolution || "",
  });
  const autoSaveData = useMemo(
    () => ({ ...form, ...(autoSavePayload ?? {}) }),
    [autoSavePayload, form]
  );

  const { saveStatus, lastSavedAt } = useAutoSave(autoSaveData, autoSaveEndpoint, 30000, autoSaveEnabled);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(buildInitialForm(initialData));
  }, [initialData]);

  useEffect(() => {
    onDataChange(form);
  }, [form, onDataChange]);

  const update = useCallback(
    (field: keyof FormData, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Bước 1 & 2: Thông tin Sáng kiến</h2>
        <div className="flex items-center gap-2">
          {saveStatus === "saving" && (
            <span className="text-xs text-amber-400">Đang lưu...</span>
          )}
          {saveStatus === "saved" && (
            <span className="text-xs text-emerald-400">
              Bản nháp đã được lưu tự động lúc {lastSavedAt}
            </span>
          )}
          {saveStatus === "idle" && (
            <span className="text-xs text-text-muted">Auto-save: 30s</span>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="title">Tiêu đề Sáng kiến *</Label>
        <Input
          id="title"
          maxLength={150}
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="Nhập tiêu đề sáng kiến (tối đa 150 ký tự)"
        />
        <p className="text-xs text-text-muted mt-1">{form.title.length}/150 ký tự</p>
      </div>

      <div>
        <Label htmlFor="executiveSummary">Tóm tắt giải pháp (Executive Summary) *</Label>
        <Textarea
          id="executiveSummary"
          value={form.executiveSummary}
          onChange={(e) => update("executiveSummary", e.target.value)}
          placeholder="Mô tả tóm tắt giải pháp của bạn (tối đa 500 từ)"
          className="min-h-[150px]"
        />
        <p className="text-xs text-text-muted mt-1">
          {form.executiveSummary.split(/\s+/).filter(Boolean).length}/500 từ
        </p>
      </div>

      <div>
        <Label htmlFor="painPoints">Thực trạng & Nỗi đau (Pain-points) *</Label>
        <Textarea
          id="painPoints"
          value={form.painPoints}
          onChange={(e) => update("painPoints", e.target.value)}
          placeholder="Mô tả vấn đề hiện tại, những điểm đau, khó khăn cần giải quyết"
          className="min-h-[150px]"
        />
      </div>

      <div>
        <Label htmlFor="detailedSolution">Giải pháp chi tiết & Kế hoạch triển khai</Label>
        <Textarea
          id="detailedSolution"
          value={form.detailedSolution}
          onChange={(e) => update("detailedSolution", e.target.value)}
          placeholder="Mô tả chi tiết giải pháp, kế hoạch triển khai dự kiến"
          className="min-h-[150px]"
        />
      </div>

      <div>
        <Label>Tài liệu đính kèm (PDF/XLSX/PPTX, tối đa 20MB)</Label>
        <div className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-brand/30 transition-colors cursor-pointer">
          <p className="text-text-muted text-sm">
            Kéo thả file vào đây hoặc click để chọn file
          </p>
          <p className="text-text-muted text-xs mt-1">Hỗ trợ PDF, XLSX, PPTX - Tối đa 20MB</p>
        </div>
      </div>
    </div>
  );
}
