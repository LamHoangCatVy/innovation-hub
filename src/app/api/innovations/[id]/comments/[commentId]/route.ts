import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromHeaders } from "@/lib/auth";
import { canParticipateInHub } from "@/lib/business-policy";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id, commentId } = await params;
  try {
    const user = await getUserFromHeaders();
    const comment = await prisma.innovationComment.findUnique({
      where: { id: commentId },
      include: { innovation: { select: { status: true } } },
    });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }
    if (comment.innovationId !== id || !canParticipateInHub(comment.innovation.status)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (comment.authorId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.innovationComment.delete({ where: { id: commentId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
