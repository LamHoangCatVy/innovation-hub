import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateInnovationCode } from "@/lib/utils";
import { autoScreenInnovation } from "@/lib/screening-service";
import { getUserFromHeaders } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromHeaders();
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const scope = searchParams.get("scope")?.trim() || "";
    const where: Prisma.InnovationWhereInput = {};

    if (user.role !== "ADMIN" || scope === "mine") {
      where.authorId = user.userId;
    }

    if (status) {
      where.status = status;
    }

    if (keyword) {
      where.OR = [
        { code: { contains: keyword } },
        { title: { contains: keyword } },
        { executiveSummary: { contains: keyword } },
      ];
    }

    const innovations = await prisma.innovation.findMany({
      where,
      include: {
        primaryBlock: { select: { code: true, name: true } },
        classifications: { include: { block: { select: { code: true, name: true } } } },
        author: { select: { fullName: true, email: true } },
        screenings: {
          include: { scores: { include: { criterion: true } } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        reviews: true,
        logs: { orderBy: { createdAt: "desc" }, take: 5 },
        _count: { select: { upvotes: true, comments: true } },
      },
      orderBy: { updatedAt: "desc" },
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
          ...(isSubmit ? { version: { increment: 1 } } : {}),
          status: isSubmit ? "PENDING_SCREENING" : "DRAFT",
          ...(isSubmit ? { submittedAt: new Date() } : {}),
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

      if (isSubmit) {
        // Fire-and-forget
        autoScreenInnovation(innovation.id).catch(async (err) => {
          console.error("Auto-screen failed on resubmit:", err);
          await prisma.innovationLog.create({
            data: {
              innovationId: innovation.id,
              action: "SCREENING_FAILED",
              payload: JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
              performedBy: "system",
            },
          });
        });
      }

      return NextResponse.json({ innovation, screening: null }, { status: 200 });
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

    if (isSubmit) {
      // Fire-and-forget
      autoScreenInnovation(innovation.id).catch(async (err) => {
        console.error("Auto-screen failed:", err);
        await prisma.innovationLog.create({
          data: {
            innovationId: innovation.id,
            action: "SCREENING_FAILED",
            payload: JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
            performedBy: "system",
          },
        });
      });
    }

    return NextResponse.json({ innovation, screening: null }, { status: 201 });
  } catch (err) {
    console.error("POST /api/innovations error:", err);
    return NextResponse.json({ error: "Failed to create innovation" }, { status: 500 });
  }
}
