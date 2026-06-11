import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const existing = await prisma.innovationUpvote.findUnique({
      where: { innovationId_userId: { innovationId: id, userId: "seed-user-1" } },
    });

    if (existing) {
      await prisma.innovationUpvote.delete({ where: { id: existing.id } });
    } else {
      await prisma.innovationUpvote.create({
        data: { innovationId: id, userId: "seed-user-1" },
      });
    }

    const count = await prisma.innovationUpvote.count({ where: { innovationId: id } });
    return NextResponse.json({ upvoted: !existing, count });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
