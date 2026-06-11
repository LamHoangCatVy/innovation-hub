"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useUser } from "@/lib/user-context";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorBlock: string;
}

export function Discussion({ innovationId }: { innovationId: string }) {
  const { user } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/innovations/${innovationId}/comments`);
      if (res.ok) setComments(await res.json());
    } finally {
      setLoading(false);
    }
  }, [innovationId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    const value = content.trim();
    if (!value || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/innovations/${innovationId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: value }),
      });
      if (res.ok) {
        const created: Comment = await res.json();
        setComments((prev) => [...prev, created]);
        setContent("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/innovations/${innovationId}/comments/${id}`, { method: "DELETE" });
    if (res.ok) setComments((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <section id="discussion" className="scroll-mt-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={18} className="text-brand" />
        <h2 className="text-lg font-bold text-text-primary">Thảo luận</h2>
        {!loading && (
          <span className="text-sm text-text-muted">({comments.length})</span>
        )}
      </div>

      {/* Composer */}
      <div className="flex gap-3 mb-6">
        <Avatar fullName={user.fullName} size={36} />
        <div className="flex-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Chia sẻ góc nhìn, đặt câu hỏi, hoặc học hỏi từ sáng kiến này…"
            className="min-h-[80px]"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
            }}
          />
          <div className="flex justify-end mt-2">
            <Button size="sm" onClick={submit} disabled={!content.trim() || submitting}>
              {submitting ? <Spinner size={14} /> : <Send size={14} />}
              Gửi
            </Button>
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8"><Spinner size={24} /></div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-text-muted text-sm">
          Chưa có thảo luận nào. Hãy là người đầu tiên chia sẻ! 💬
        </div>
      ) : (
        <div className="space-y-5">
          {comments.map((c) => {
            const canDelete = c.authorId === user.id || user.role === "ADMIN";
            return (
              <div key={c.id} className="flex gap-3 group">
                <Avatar fullName={c.authorName} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-text-primary">{c.authorName}</span>
                    {c.authorBlock && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-alt text-text-muted">
                        {c.authorBlock}
                      </span>
                    )}
                    <span className="text-xs text-text-muted">· {formatDate(c.createdAt, "relative")}</span>
                    {canDelete && (
                      <button
                        onClick={() => remove(c.id)}
                        title="Xoá bình luận"
                        className="ml-auto opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-500 transition-all cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mt-1 whitespace-pre-wrap break-words">{c.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
