import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInnovationCode } from "@/lib/utils";
import { autoScreenInnovation } from "@/lib/screening-service";
import { getUserFromHeaders } from "@/lib/auth";

export async function GET() {
  try {
    const innovations = await prisma.innovation.findMany({
      include: {
        primaryBlock: { select: { code: true, name: true } },
        classifications: { include: { block: { select: { code: true, name: true } } } },
        author: { select: { fullName: true, email: true } },
        screenings: { include: { scores: { include: { criterion: true } } } },
        reviews: true,
        _count: { select: { upvotes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(innovations);
  } catch {
    return NextResponse.json({ error: "Failed to fetch innovations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromHeaders();
    const body = await request.json();
    const {
      title,
      executiveSummary,
      painPoints,
      detailedSolution,
      primaryBlockId,
      selectedBlockIds,
      isBankWide,
      status = "DRAFT",
      editId,
    } = body;

    // -----------------------------------------------------------------------
    // Resubmit / version: update existing innovation instead of duplicating
    // -----------------------------------------------------------------------
    if (editId) {
      const existing = await prisma.innovation.findUnique({
        where: { id: editId },
        include: { classifications: true },
      });
      if (!existing) {
        return NextResponse.json({ error: "Innovation not found" }, { status: 404 });
      }
      if (existing.authorId !== user.userId && user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (!["DRAFT", "MODIFICATION_REQUESTED"].includes(existing.status)) {
        return NextResponse.json(
          { error: `Cannot edit innovation in status "${existing.status}"` },
          { status: 409 }
        );
      }

      // Resolve block UUIDs
      const blockMap = new Map<string, string>();
      if (primaryBlockId || selectedBlockIds?.length) {
        const allCodes = [...new Set([primaryBlockId, ...(selectedBlockIds || [])].filter(Boolean))];
        const blocks = await prisma.block.findMany({ where: { code: { in: allCodes } } });
        blocks.forEach((b) => blockMap.set(b.code, b.id));
      }
      const primaryUuid = primaryBlockId ? blockMap.get(primaryBlockId) : existing.primaryBlockId;

      // Delete old classifications, screenings
      await prisma.innovationBlock.deleteMany({ where: { innovationId: editId } });
      await prisma.innovationScreening.deleteMany({ where: { innovationId: editId } });

      const isSubmit = status !== "DRAFT";

      const innovation = await prisma.innovation.update({
        where: { id: editId },
        data: {
          title,
          executiveSummary,
          painPoints,
          detailedSolution,
          primaryBlockId: primaryUuid,
          isBankWide: isBankWide || false,
          version: { increment: 1 },
          status: isSubmit ? "PENDING_SCREENING" : "DRAFT",
          submittedAt: isSubmit ? new Date() : existing.submittedAt,
          classifications: {
            create: (selectedBlockIds || [])
              .filter((blockId: string) => blockMap.has(blockId))
              .map((blockId: string) => ({
                blockId: blockMap.get(blockId)!,
                isPrimary: blockId === primaryBlockId,
              })),
          },
          logs: {
            create: {
              action: isSubmit ? "RESUBMITTED" : "DRAFT_UPDATED",
              performedBy: user.userId,
            },
          },
        },
        include: { author: { select: { fullName: true } } },
      });

      let screeningResult = null;
      if (isSubmit) {
        try {
          screeningResult = await autoScreenInnovation(innovation.id);
        } catch (err) {
          console.error("Auto-screen failed on resubmit:", err);
          // Leave status PENDING_SCREENING; log the failure for retry
          await prisma.innovationLog.create({
            data: {
              innovationId: innovation.id,
              action: "SCREENING_FAILED",
              payload: JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
              performedBy: "system",
            },
          });
        }
      }

      return NextResponse.json({ innovation, screening: screeningResult }, { status: 200 });
    }

    // -----------------------------------------------------------------------
    // New innovation (original path)
    // -----------------------------------------------------------------------
    const code = generateInnovationCode();

    const blockMap = new Map<string, string>();
    if (primaryBlockId || selectedBlockIds?.length) {
      const allCodes = [...new Set([primaryBlockId, ...(selectedBlockIds || [])].filter(Boolean))];
      const blocks = await prisma.block.findMany({ where: { code: { in: allCodes } } });
      blocks.forEach((b) => blockMap.set(b.code, b.id));
    }

    const primaryUuid = primaryBlockId ? blockMap.get(primaryBlockId) : null;
    const isSubmit = status !== "DRAFT";

    const innovation = await prisma.innovation.create({
      data: {
        code,
        title,
        executiveSummary,
        painPoints,
        detailedSolution,
        primaryBlockId: primaryUuid,
        isBankWide: isBankWide || false,
        status: isSubmit ? "PENDING_SCREENING" : "DRAFT",
        authorId: user.userId,
        submittedAt: isSubmit ? new Date() : null,
        classifications: {
          create: (selectedBlockIds || [])
            .filter((blockId: string) => blockMap.has(blockId))
            .map((blockId: string) => ({
              blockId: blockMap.get(blockId)!,
              isPrimary: blockId === primaryBlockId,
            })),
        },
        logs: {
          create: {
            action: isSubmit ? "SUBMITTED" : "DRAFT_CREATED",
            performedBy: user.userId,
          },
        },
      },
      include: { author: { select: { fullName: true } } },
    });

    let screeningResult = null;
    if (isSubmit) {
      try {
        screeningResult = await autoScreenInnovation(innovation.id);
      } catch (err) {
        console.error("Auto-screen failed:", err);
        // Leave status PENDING_SCREENING; log the failure for retry via detail page
        await prisma.innovationLog.create({
          data: {
            innovationId: innovation.id,
            action: "SCREENING_FAILED",
            payload: JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
            performedBy: "system",
          },
        });
      }
    }

    return NextResponse.json({ innovation, screening: screeningResult }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create innovation" }, { status: 500 });
  }
}
