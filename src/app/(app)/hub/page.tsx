"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Globe, Search, MessageSquare, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, UserIdentity } from "@/lib/user-context";

function buildUserHeaders(u: UserIdentity): Record<string, string> {
  return { "x-vpb-user": JSON.stringify({ userId: u.id, username: u.username, fullName: u.fullName, role: u.role, blockCode: u.blockCode }) };
}

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
}

export default function HubPage() {
  const [items, setItems] = useState<InnovationHubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "highest_score" | "most_upvotes">("latest");
  const { user } = useUser();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (blockFilter) params.set("blockId", blockFilter);
    params.set("sortBy", sortBy);
    try {
      const res = await fetch(`/api/hub?${params}`, { headers: buildUserHeaders(user) });
      setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }, [keyword, blockFilter, sortBy, user]);

  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpvote = async (id: string) => {
    await fetch(`/api/hub/${id}/upvote`, {
      method: "POST",
      headers: buildUserHeaders(user),
    });
    fetchItems();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Nhà Chung</h1>
          <p className="text-text-secondary mt-1">Khám phá và tương tác với các sáng kiến toàn ngân hàng</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Tìm kiếm sáng kiến..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
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
            {(["latest", "highest_score", "most_upvotes"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={cn(
                  "px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer",
                  sortBy === s ? "bg-brand/20 text-brand" : "text-text-muted hover:text-text-secondary"
                )}
              >
                {s === "latest" ? "Mới nhất" : s === "highest_score" ? "Điểm cao" : "Upvote"}
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card key={item.id} className="flex flex-col justify-between hover:border-brand/30 transition-all cursor-pointer group">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono text-brand">{item.code}</span>
                    <span className="text-[10px] text-text-muted">{item.primaryBlockName}</span>
                  </div>
                  <h3 className="font-semibold text-text-primary line-clamp-2 group-hover:text-brand transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-text-muted mt-2 line-clamp-3">{item.executiveSummary}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleUpvote(item.id)}
                      className="flex items-center gap-1 text-text-muted hover:text-brand transition-colors cursor-pointer"
                    >
                      <ThumbsUp size={14} />
                      <span className="text-xs">{item.upvoteCount}</span>
                    </button>
                    <span className="flex items-center gap-1 text-text-muted">
                      <MessageSquare size={14} />
                      <span className="text-xs">{item.commentCount}</span>
                    </span>
                  </div>
                  {item.normalisedScore != null && (
                    <div className={cn(
                      "text-sm font-bold px-2 py-0.5 rounded",
                      item.normalisedScore >= 70 ? "text-emerald-400 bg-emerald-500/10" :
                      item.normalisedScore >= 40 ? "text-amber-400 bg-amber-500/10" : "text-red-400 bg-red-500/10"
                    )}>
                      {item.normalisedScore}/100
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
