import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromHeaders } from "@/lib/auth";

const DRAFT_SELECT = {
  id: true,
  title: true,
  executiveSummary: true,
  painPoints: true,
  detailedSolution: true,
  primaryBlockId: true,
  isBankWide: true,
  savedAt: true,
  createdAt: true,
} as const;

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromHeaders();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const draft = await prisma.innovationDraft.findFirst({
        where: { id, userId: user.userId },
        select: DRAFT_SELECT,
      });
      if (!draft) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(draft);
    }

    const drafts = await prisma.innovationDraft.findMany({
      where: { userId: user.userId },
      orderBy: { savedAt: "desc" },
      select: DRAFT_SELECT,
    });
    return NextResponse.json(drafts);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromHeaders();
    const body = await request.json();
    const { draftId, title, executiveSummary, painPoints, detailedSolution, primaryBlockId, isBankWide } = body;

    const existing = draftId
      ? await prisma.innovationDraft.findFirst({ where: { id: draftId, userId: user.userId } })
      : await prisma.innovationDraft.findFirst({
          where: { userId: user.userId },
          orderBy: { savedAt: "desc" },
        });

    if (draftId && !existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const draft = existing
      ? await prisma.innovationDraft.update({
          where: { id: existing.id },
          data: { title, executiveSummary, painPoints, detailedSolution, primaryBlockId, isBankWide, savedAt: new Date() },
        })
      : await prisma.innovationDraft.create({
          data: { userId: user.userId, title, executiveSummary, painPoints, detailedSolution, primaryBlockId, isBankWide },
        });

    return NextResponse.json(draft);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    const user = await getUserFromHeaders();
    const draft = await prisma.innovationDraft.findFirst({
      where: { id, userId: user.userId },
      select: { id: true },
    });
    if (!draft) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await prisma.innovationDraft.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
