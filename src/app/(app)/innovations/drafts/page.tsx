"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FileText, Trash2, Edit3 } from "lucide-react";
import { useUser, UserIdentity } from "@/lib/user-context";

function buildUserHeaders(u: UserIdentity): Record<string, string> {
  return { "x-vpb-user": JSON.stringify({ userId: u.id, username: u.username, fullName: u.fullName, role: u.role, blockCode: u.blockCode }) };
}

interface Draft {
  id: string;
  title: string;
  savedAt: string;
  status: string;
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    fetch("/api/innovations/drafts", { headers: buildUserHeaders(user) })
      .then((r) => r.json())
      .then(setDrafts)
      .finally(() => setLoading(false));
  }, [user]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/innovations/drafts?id=${id}`, { method: "DELETE" });
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    setConfirmDelete(null);
  };

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Bản nháp của tôi</h1>
          <p className="text-text-secondary mt-1">Quản lý các sáng kiến đang soạn thảo</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size={32} />
          </div>
        ) : drafts.length === 0 ? (
          <Card className="text-center py-12">
            <FileText size={48} className="mx-auto text-text-muted mb-4" />
            <p className="text-text-secondary">Chưa có bản nháp nào</p>
            <Link href="/innovations/new">
              <Button className="mt-4">Tạo sáng kiến mới</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {drafts.map((draft) => (
              <Card key={draft.id} className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text-primary truncate">
                    {draft.title || "Sáng kiến chưa có tiêu đề"}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    Lưu lần cuối: {new Date(draft.savedAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Link href={`/innovations/new?draft=${draft.id}`}>
                    <Button variant="ghost" size="sm"><Edit3 size={14} /> Sửa</Button>
                  </Link>
                  {confirmDelete === draft.id ? (
                    <div className="flex items-center gap-1">
                      <Button variant="danger" size="sm" onClick={() => handleDelete(draft.id)}>Xóa</Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>Hủy</Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(draft.id)}>
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
