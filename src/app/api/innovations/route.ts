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
    } = body;

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
      } catch {}
    }

    return NextResponse.json({ innovation, screening: screeningResult }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create innovation" }, { status: 500 });
  }
}
