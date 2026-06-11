"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Avatar } from "@/components/ui/avatar";
import { Globe, Search, MessageSquare, ChevronUp, Flame, Lightbulb } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

type SortBy = "latest" | "highest_score" | "most_upvotes" | "most_discussed";

interface InnovationHubItem {
  id: string;
  code: string;
  title: string;
  executiveSummary: string;
  primaryBlockName: string;
  normalisedScore: number | null;
  upvoteCount: number;
  commentCount: number;
  authorName: string;
  publishedAt: string;
  lastActivityAt: string;
  isUpvoted: boolean;
}

const SORT_LABELS: Record<SortBy, string> = {
  latest: "Mới nhất",
  most_discussed: "Thảo luận nhiều",
  most_upvotes: "Upvote",
  highest_score: "Điểm cao",
};

function isHot(item: InnovationHubItem) {
  return item.commentCount >= 5 || item.upvoteCount >= 20;
}

export default function HubPage() {
  const router = useRouter();
  const [items, setItems] = useState<InnovationHubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("latest");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (blockFilter) params.set("blockId", blockFilter);
    params.set("sortBy", sortBy);
    try {
      const res = await fetch(`/api/hub?${params}`);
      setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }, [keyword, blockFilter, sortBy]);

  const initialFetchDone = useRef(false);
  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when filters/sort change (after the initial load).
  useEffect(() => {
    if (!initialFetchDone.current) return;
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockFilter, sortBy]);

  const handleUpvote = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Optimistic toggle.
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, isUpvoted: !it.isUpvoted, upvoteCount: it.upvoteCount + (it.isUpvoted ? -1 : 1) }
          : it
      )
    );
    await fetch(`/api/hub/${id}/upvote`, { method: "POST" });
  };

  const goToDiscussion = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/innovations/${id}#discussion`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Nhà Chung</h1>
        <p className="text-text-secondary mt-1">
          Trong đây là mấy cái hay hay được duyệt, ae vào xem học hỏi 👀
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Tìm kiếm sáng kiến..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchItems()}
            className="pl-10"
          />
        </div>
        <select
          value={blockFilter}
          onChange={(e) => setBlockFilter(e.target.value)}
          className="bg-surface-alt border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand"
        >
          <option value="">Tất cả khối</option>
          <option value="RB">RB - Bán lẻ</option>
          <option value="CMB">CMB - Doanh nghiệp vừa</option>
          <option value="CIB">CIB - Doanh nghiệp lớn</option>
          <option value="IT">IT - Công nghệ</option>
          <option value="Ops">Ops - Vận hành</option>
          <option value="Risk">Risk - Rủi ro</option>
          <option value="HR">HR - Nhân sự</option>
          <option value="Fin">Fin - Tài chính</option>
          <option value="Legal">Legal - Pháp chế</option>
          <option value="Digital">Digital - NH Số</option>
        </select>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(["latest", "most_discussed", "most_upvotes", "highest_score"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={cn(
                "px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap",
                sortBy === s ? "bg-brand/20 text-brand" : "text-text-muted hover:text-text-secondary"
              )}
            >
              {SORT_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={32} /></div>
      ) : items.length === 0 ? (
        <Card className="text-center py-12">
          <Globe size={48} className="mx-auto text-text-muted mb-4" />
          <p className="text-text-secondary">Chưa có sáng kiến nào được công khai</p>
        </Card>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/innovations/${item.id}`}
              className="flex items-start gap-3 px-4 py-3.5 bg-surface hover:bg-surface-alt/60 transition-colors group"
            >
              {/* Upvote */}
              <button
                onClick={(e) => handleUpvote(e, item.id)}
                className={cn(
                  "flex flex-col items-center justify-center w-11 rounded-lg py-1 transition-colors cursor-pointer flex-shrink-0",
                  item.isUpvoted
                    ? "bg-brand/10 text-brand"
                    : "text-text-muted hover:bg-surface-alt hover:text-brand"
                )}
              >
                <ChevronUp size={16} />
                <span className="text-xs font-semibold">{item.upvoteCount}</span>
              </button>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {isHot(item) ? (
                    <Flame size={15} className="text-orange-500 flex-shrink-0" />
                  ) : (
                    <Lightbulb size={15} className="text-amber-400 flex-shrink-0" />
                  )}
                  <h3 className="font-semibold text-text-primary truncate group-hover:text-brand transition-colors">
                    {item.title}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-text-muted flex-wrap">
                  <Avatar fullName={item.authorName} size={18} />
                  <span className="text-text-secondary">{item.authorName}</span>
                  <span>·</span>
                  <span>{item.primaryBlockName}</span>
                  {item.normalisedScore != null && (
                    <>
                      <span>·</span>
                      <span className="font-medium text-text-secondary">{item.normalisedScore}đ</span>
                    </>
                  )}
                  <span>·</span>
                  <span>cập nhật {formatDate(item.lastActivityAt, "relative")}</span>
                </div>
              </div>

              {/* Replies */}
              <button
                onClick={(e) => goToDiscussion(e, item.id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-text-muted hover:bg-surface-alt hover:text-brand transition-colors cursor-pointer flex-shrink-0 self-center"
                title="Vào thảo luận"
              >
                <MessageSquare size={15} />
                <span className="text-xs font-medium">{item.commentCount}</span>
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
