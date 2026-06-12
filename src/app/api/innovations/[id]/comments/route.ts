import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromHeaders } from "@/lib/auth";
import { canParticipateInHub } from "@/lib/business-policy";

type CommentWithAuthor = {
  id: string;
  content: string;
  createdAt: Date;
  authorId: string;
  author: { fullName: string; role: string; block: { code: string } | null };
};

function mapComment(c: CommentWithAuthor) {
  return {
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    authorId: c.authorId,
    authorName: c.author.fullName,
    authorRole: c.author.role,
    authorBlock: c.author.block?.code ?? "",
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const innovation = await prisma.innovation.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!innovation || !canParticipateInHub(innovation.status)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const comments = await prisma.innovationComment.findMany({
      where: { innovationId: id },
      include: { author: { select: { fullName: true, role: true, block: { select: { code: true } } } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(comments.map(mapComment));
  } catch {
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await getUserFromHeaders();
    const body = await request.json().catch(() => ({}));
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const innovation = await prisma.innovation.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!innovation || !canParticipateInHub(innovation.status)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!content) {
      return NextResponse.json({ error: "Nội dung không được để trống" }, { status: 400 });
    }
    if (content.length > 2000) {
      return NextResponse.json({ error: "Nội dung quá dài (tối đa 2000 ký tự)" }, { status: 400 });
    }

    const comment = await prisma.innovationComment.create({
      data: { innovationId: id, authorId: user.userId, content },
      include: { author: { select: { fullName: true, role: true, block: { select: { code: true } } } } },
    });

    return NextResponse.json(mapComment(comment), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
