import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromHeaders } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import {
  isPendingReviewDecision,
  isReviewableInnovationStatus,
  isValidReviewDecision,
} from "@/lib/business-policy";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUserFromHeaders();
  try {
    const { decision, internalNotes, feedbackNotes } = await request.json().catch(() => ({}));

    if (!isValidReviewDecision(decision)) {
      return NextResponse.json({ error: "Invalid review decision" }, { status: 400 });
    }

    const block = await prisma.block.findUnique({ where: { code: user.blockCode } });
    if (!block && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Block not found" }, { status: 400 });
    }

    const review = await prisma.review.findFirst({
      where: user.role === "ADMIN" ? { innovationId: id } : { innovationId: id, blockId: block?.id },
      include: {
        innovation: { select: { authorId: true, title: true, status: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    if (!isReviewableInnovationStatus(review.innovation.status)) {
      return NextResponse.json(
        { error: `Cannot review innovation in status "${review.innovation.status}"` },
        { status: 409 }
      );
    }
    if (!isPendingReviewDecision(review.decision)) {
      return NextResponse.json({ error: "Review has already been decided" }, { status: 409 });
    }

    const updated = await prisma.review.update({
      where: { id: review.id },
      data: {
        decision,
        reviewerId: user.userId,
        internalNotes: internalNotes ?? review.internalNotes,
        feedbackNotes: feedbackNotes ?? review.feedbackNotes,
        reviewedAt: new Date(),
      },
    });

    const innovation = review.innovation;

    if (decision === "APPROVED") {
      // Primary-block PIC or ADMIN approving = publish
      await prisma.innovation.update({
        where: { id },
        data: { status: "PUBLISHED", approvedAt: new Date(), publishedAt: new Date() },
      });
      await prisma.innovationLog.create({
        data: { innovationId: id, action: "APPROVED_BY_PIC", performedBy: user.userId },
      });
      await createNotification(innovation.authorId, {
        type: "APPROVED",
        title: "Sáng kiến đã được duyệt & công khai!",
        body: `Sáng kiến "${innovation.title}" đã được ${user.fullName} phê duyệt và công khai trên Nhà Chung Sáng kiến.`,
        innovationId: id,
      });
    } else if (decision === "REJECTED") {
      await prisma.innovation.update({ where: { id }, data: { status: "REJECTED" } });
      await prisma.innovationLog.create({
        data: { innovationId: id, action: "REJECTED_BY_PIC", performedBy: user.userId },
      });
      await createNotification(innovation.authorId, {
        type: "REJECTED",
        title: "Sáng kiến bị từ chối",
        body: `Sáng kiến "${innovation.title}" đã bị từ chối bởi ${user.fullName}.${feedbackNotes ? ` Lý do: ${feedbackNotes}` : ""}`,
        innovationId: id,
      });
    } else if (decision === "MODIFICATION_REQUESTED") {
      await prisma.innovation.update({ where: { id }, data: { status: "MODIFICATION_REQUESTED" } });
      await prisma.innovationLog.create({
        data: { innovationId: id, action: "MODIFICATION_REQUESTED", performedBy: user.userId },
      });
      await createNotification(innovation.authorId, {
        type: "MODIFICATION_REQUESTED",
        title: "Sáng kiến cần chỉnh sửa",
        body: `PIC ${user.fullName} yêu cầu chỉnh sửa sáng kiến "${innovation.title}".${feedbackNotes ? ` Ghi chú: ${feedbackNotes}` : ""}`,
        innovationId: id,
      });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
