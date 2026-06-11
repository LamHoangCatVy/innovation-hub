import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromHeaders } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUserFromHeaders();
  try {
    const { decision, internalNotes, feedbackNotes } = await request.json();

    const block = await prisma.block.findUnique({ where: { code: user.blockCode } });
    if (!block && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Block not found" }, { status: 400 });
    }

    const review = await prisma.review.findFirst({
      where: user.role === "ADMIN" ? { innovationId: id } : { innovationId: id, blockId: block?.id },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const updated = await prisma.review.update({
      where: { id: review.id },
      data: {
        decision,
        reviewerId: user.userId,
        internalNotes: internalNotes ?? review.internalNotes,
        feedbackNotes: feedbackNotes ?? review.feedbackNotes,
        reviewedAt: decision !== "PENDING" ? new Date() : null,
      },
    });

    if (decision === "APPROVED") {
      await prisma.innovation.update({ where: { id }, data: { status: "APPROVED", approvedAt: new Date() } });
      await prisma.innovationLog.create({ data: { innovationId: id, action: "APPROVED_BY_PIC", performedBy: user.userId } });
    } else if (decision === "REJECTED") {
      await prisma.innovation.update({ where: { id }, data: { status: "REJECTED" } });
      await prisma.innovationLog.create({ data: { innovationId: id, action: "REJECTED_BY_PIC", performedBy: user.userId } });
    } else if (decision === "MODIFICATION_REQUESTED") {
      await prisma.innovation.update({ where: { id }, data: { status: "MODIFICATION_REQUESTED" } });
      await prisma.innovationLog.create({ data: { innovationId: id, action: "MODIFICATION_REQUESTED", performedBy: user.userId } });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
