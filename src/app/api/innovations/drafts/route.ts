import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromHeaders } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUserFromHeaders();
    const drafts = await prisma.innovationDraft.findMany({
      where: { userId: user.userId },
      orderBy: { savedAt: "desc" },
      select: { id: true, title: true, savedAt: true },
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
    const { title, executiveSummary, painPoints, detailedSolution, primaryBlockId, isBankWide } = body;

    const existing = await prisma.innovationDraft.findFirst({
      where: { userId: user.userId },
      orderBy: { savedAt: "desc" },
    });

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
    await prisma.innovationDraft.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
