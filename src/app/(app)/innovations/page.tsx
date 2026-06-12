"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, Edit3, Eye, FileText, Lightbulb, Send, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn, formatDate } from "@/lib/utils";
import type { InnovationStatus } from "@/lib/types";

type FilterKey = "all" | "drafts" | "needs_edit" | "in_progress" | "published" | "rejected";

interface DraftApiItem {
  id: string;
  title: string | null;
  executiveSummary: string | null;
  primaryBlockId: string | null;
  isBankWide: boolean;
  savedAt: string;
  createdAt: string;
}

interface InnovationApiItem {
  id: string;
  code: string;
  title: string;
  status: InnovationStatus;
  version: number;
  isBankWide: boolean;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  primaryBlock: { code: string; name: string } | null;
  screenings: { normalisedScore: number | null }[];
  reviews: { decision: string; feedbackNotes: string | null }[];
  logs: { action: string; payload: string | null; createdAt: string }[];
}

interface DraftItem {
  kind: "draft";
  id: string;
  title: string;
  summary: string;
  primaryBlockName: string;
  isBankWide: boolean;
  savedAt: string;
}

interface PersistedItem {
  kind: "innovation";
  id: string;
  code: string;
  title: string;
  status: InnovationStatus;
  version: number;
  primaryBlockName: string;
  isBankWide: boolean;
  updatedAt: string;
  submittedAt: string | null;
  normalisedScore: number | null;
  feedback: string | null;
}

type OwnerItem = DraftItem | PersistedItem;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "drafts", label: "Nháp" },
  { key: "needs_edit", label: "Cần sửa" },
  { key: "in_progress", label: "Đang xử lý" },
  { key: "published", label: "Công khai" },
  { key: "rejected", label: "Từ chối" },
];

const STATUS_META: Record<InnovationStatus, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  DRAFT: { label: "Nháp", variant: "default" },
  PENDING_SCREENING: { label: "Chờ AI", variant: "info" },
  SCREENED: { label: "Đã chấm", variant: "info" },
  IN_REVIEW: { label: "Đang duyệt", variant: "warning" },
  APPROVED: { label: "Đã duyệt", variant: "success" },
  REJECTED: { label: "Từ chối", variant: "danger" },
  MODIFICATION_REQUESTED: { label: "Cần sửa", variant: "warning" },
  PUBLISHED: { label: "Công khai", variant: "success" },
  COMPLETED: { label: "Hoàn tất", variant: "success" },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringsFrom(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function feedbackFromLog(payload: string | null): string | null {
  if (!payload) return null;

  try {
    const parsed: unknown = JSON.parse(payload);
    if (!isRecord(parsed)) return null;

    const failReasons = stringsFrom(parsed.failReasons);
    if (failReasons.length > 0) return failReasons[0];

    const completeness = parsed.completeness;
    if (isRecord(completeness)) {
      const missing = stringsFrom(completeness.missing);
      if (missing.length > 0) return missing[0];
    }
  } catch {
    return null;
  }

  return null;
}

function feedbackFor(item: InnovationApiItem) {
  const reviewFeedback = item.reviews.find((review) => review.feedbackNotes)?.feedbackNotes;
  if (reviewFeedback) return reviewFeedback;

  const autoFeedback = item.logs.find((log) => log.action === "FEEDBACK_AUTO");
  return feedbackFromLog(autoFeedback?.payload ?? null);
}

function mapDraft(draft: DraftApiItem): DraftItem {
  return {
    kind: "draft",
    id: draft.id,
    title: draft.title?.trim() || "Sáng kiến chưa có tiêu đề",
    summary: draft.executiveSummary?.trim() || "Bản nháp đang được lưu tự động.",
    primaryBlockName: draft.isBankWide ? "Toàn ngân hàng" : draft.primaryBlockId || "Chưa chọn khối",
    isBankWide: draft.isBankWide,
    savedAt: draft.savedAt,
  };
}

function mapInnovation(item: InnovationApiItem): PersistedItem {
  return {
    kind: "innovation",
    id: item.id,
    code: item.code,
    title: item.title,
    status: item.status,
    version: item.version,
    primaryBlockName: item.isBankWide ? "Toàn ngân hàng" : item.primaryBlock?.name || "Chưa chọn khối",
    isBankWide: item.isBankWide,
    updatedAt: item.updatedAt,
    submittedAt: item.submittedAt,
    normalisedScore: item.screenings[0]?.normalisedScore ?? null,
    feedback: item.status === "MODIFICATION_REQUESTED" ? feedbackFor(item) : null,
  };
}

function matchesFilter(item: OwnerItem, filter: FilterKey) {
  if (filter === "all") return true;
  if (filter === "drafts") return item.kind === "draft" || item.status === "DRAFT";
  if (item.kind === "draft") return false;
  if (filter === "needs_edit") return item.status === "MODIFICATION_REQUESTED";
  if (filter === "in_progress") return ["PENDING_SCREENING", "SCREENED", "IN_REVIEW", "APPROVED"].includes(item.status);
  if (filter === "published") return ["PUBLISHED", "COMPLETED"].includes(item.status);
  if (filter === "rejected") return item.status === "REJECTED";
  return true;
}

function itemTimestamp(item: OwnerItem) {
  return item.kind === "draft" ? item.savedAt : item.updatedAt;
}

function statusBadge(item: OwnerItem) {
  if (item.kind === "draft") return <Badge>Nháp tự động</Badge>;
  const meta = STATUS_META[item.status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

function scoreTone(score: number) {
  if (score >= 70) return "text-emerald-500";
  if (score >= 40) return "text-amber-500";
  return "text-red-500";
}

export default function MyIdeasPage() {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [innovations, setInnovations] = useState<PersistedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [draftRes, innovationRes] = await Promise.all([
        fetch("/api/innovations/drafts"),
        fetch("/api/innovations?scope=mine"),
      ]);

      const draftData: unknown = await draftRes.json();
      const innovationData: unknown = await innovationRes.json();

      setDrafts(Array.isArray(draftData) ? draftData.map((draft) => mapDraft(draft as DraftApiItem)) : []);
      setInnovations(Array.isArray(innovationData) ? innovationData.map((item) => mapInnovation(item as InnovationApiItem)) : []);
    } catch {
      setError("Không thể tải danh sách ý tưởng của bạn.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
  }, [fetchItems]);

  const allItems = useMemo(
    () => [...drafts, ...innovations].sort((a, b) => new Date(itemTimestamp(b)).getTime() - new Date(itemTimestamp(a)).getTime()),
    [drafts, innovations]
  );

  const visibleItems = useMemo(() => allItems.filter((item) => matchesFilter(item, filter)), [allItems, filter]);

  const stats = useMemo(() => {
    const needsEdit = innovations.filter((item) => item.status === "MODIFICATION_REQUESTED").length;
    const inProgress = innovations.filter((item) => ["PENDING_SCREENING", "SCREENED", "IN_REVIEW", "APPROVED"].includes(item.status)).length;
    const live = innovations.filter((item) => ["PUBLISHED", "COMPLETED"].includes(item.status)).length;
    return { total: allItems.length, drafts: drafts.length + innovations.filter((item) => item.status === "DRAFT").length, needsEdit, inProgress, live };
  }, [allItems.length, drafts.length, innovations]);

  const deleteDraft = async (id: string) => {
    setError("");
    const res = await fetch(`/api/innovations/drafts?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Không thể xóa bản nháp này.");
      return;
    }
    setDrafts((prev) => prev.filter((draft) => draft.id !== id));
    setConfirmDelete(null);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand">
            <Sparkles size={14} />
            Owner workspace
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Ý tưởng của tôi</h1>
          <p className="mt-1 max-w-2xl text-sm text-text-secondary">
            Theo dõi bản nháp, trạng thái AI scoring, phản hồi PIC và các sáng kiến đã lên Nhà Chung.
          </p>
        </div>
        <Link href="/innovations/new">
          <Button>
            <Lightbulb size={16} />
            Đề xuất mới
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Tổng", value: stats.total, icon: Lightbulb, tone: "text-brand", bg: "bg-brand/10" },
          { label: "Nháp", value: stats.drafts, icon: FileText, tone: "text-slate-500", bg: "bg-slate-500/10" },
          { label: "Cần sửa", value: stats.needsEdit, icon: AlertTriangle, tone: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Đang xử lý", value: stats.inProgress, icon: Clock3, tone: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Công khai", value: stats.live, icon: CheckCircle2, tone: "text-emerald-500", bg: "bg-emerald-500/10" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-surface px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">{stat.label}</span>
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", stat.bg)}>
                <stat.icon size={16} className={stat.tone} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-text-primary">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={cn(
              "rounded-full border px-3.5 py-2 text-xs font-medium transition-colors",
              filter === item.key
                ? "border-brand bg-brand/10 text-brand"
                : "border-border bg-surface text-text-secondary hover:border-brand/40 hover:text-text-primary"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={32} />
        </div>
      ) : visibleItems.length === 0 ? (
        <Card className="py-14 text-center">
          <Lightbulb size={46} className="mx-auto mb-4 text-text-muted" />
          <h2 className="text-lg font-semibold text-text-primary">Chưa có ý tưởng trong nhóm này</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            Tạo đề xuất mới hoặc đổi bộ lọc để xem các bản nháp và sáng kiến đã gửi.
          </p>
          <Link href="/innovations/new">
            <Button className="mt-5">Tạo sáng kiến mới</Button>
          </Link>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="hidden grid-cols-[1fr_130px_110px_110px_104px] gap-4 border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted md:grid">
            <span>Sáng kiến</span>
            <span>Khối</span>
            <span>Điểm</span>
            <span>Trạng thái</span>
            <span className="text-right">Thao tác</span>
          </div>
          <div className="divide-y divide-border">
            {visibleItems.map((item) => (
              <div key={`${item.kind}-${item.id}`} className="grid gap-4 px-4 py-4 transition-colors hover:bg-surface-alt/60 md:grid-cols-[1fr_130px_110px_110px_104px] md:items-center">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-brand">{item.kind === "draft" ? "AUTO-SAVE" : item.code}</span>
                    {item.kind === "innovation" && item.version > 1 && <Badge>V{item.version}</Badge>}
                    <span className="md:hidden">{statusBadge(item)}</span>
                  </div>
                  <h2 className="truncate text-sm font-semibold text-text-primary">{item.title}</h2>
                  <p className="mt-1 text-xs text-text-muted">
                    {item.kind === "draft"
                      ? `Lưu lần cuối ${formatDate(item.savedAt, "relative")}`
                      : `Cập nhật ${formatDate(item.updatedAt, "relative")}`}
                  </p>
                  {item.kind === "innovation" && item.feedback && (
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-500">
                      <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{item.feedback}</span>
                    </p>
                  )}
                </div>

                <div className="text-xs text-text-secondary">
                  <span className="md:hidden text-text-muted">Khối: </span>
                  {item.primaryBlockName}
                </div>

                <div className="text-xs">
                  {item.kind === "innovation" && item.normalisedScore != null ? (
                    <span className={cn("font-bold", scoreTone(item.normalisedScore))}>{item.normalisedScore.toFixed(0)}/100</span>
                  ) : (
                    <span className="text-text-muted">-</span>
                  )}
                </div>

                <div className="hidden md:block">{statusBadge(item)}</div>

                <div className="flex items-center justify-start gap-1 md:justify-end">
                  {item.kind === "draft" ? (
                    confirmDelete === item.id ? (
                      <>
                        <Button variant="danger" size="sm" className="!px-2.5" onClick={() => deleteDraft(item.id)}>Xóa</Button>
                        <Button variant="ghost" size="sm" className="!px-2.5" onClick={() => setConfirmDelete(null)}>Hủy</Button>
                      </>
                    ) : (
                      <>
                        <Link href={`/innovations/new?draft=${item.id}`}>
                          <Button variant="ghost" size="sm" className="!px-2" title="Sửa bản nháp" aria-label="Sửa bản nháp">
                            <Edit3 size={15} />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="!px-2 text-text-muted hover:text-red-500" onClick={() => setConfirmDelete(item.id)} title="Xóa bản nháp" aria-label="Xóa bản nháp">
                          <Trash2 size={15} />
                        </Button>
                      </>
                    )
                  ) : item.status === "DRAFT" || item.status === "MODIFICATION_REQUESTED" ? (
                    <>
                      {item.status === "MODIFICATION_REQUESTED" && (
                        <Link href={`/innovations/${item.id}`}>
                          <Button variant="ghost" size="sm" className="!px-2" title="Xem chi tiết" aria-label="Xem chi tiết">
                            <Eye size={15} />
                          </Button>
                        </Link>
                      )}
                      <Link href={`/innovations/new?edit=${item.id}`}>
                        <Button variant="outline" size="sm" className="!px-2" title={item.status === "DRAFT" ? "Tiếp tục" : "Sửa & gửi lại"} aria-label={item.status === "DRAFT" ? "Tiếp tục" : "Sửa & gửi lại"}>
                          {item.status === "DRAFT" ? <Send size={15} /> : <Edit3 size={15} />}
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <Link href={`/innovations/${item.id}`}>
                      <Button variant="ghost" size="sm" className="!px-2" title="Xem chi tiết" aria-label="Xem chi tiết">
                        <Eye size={15} />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
