import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInnovationCode } from "@/lib/utils";

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
    const innovation = await prisma.innovation.create({
      data: {
        code,
        title,
        executiveSummary,
        painPoints,
        detailedSolution,
        primaryBlockId,
        isBankWide: isBankWide || false,
        status,
        authorId: "seed-user-1",
        submittedAt: status !== "DRAFT" ? new Date() : null,
        classifications: {
          create: (selectedBlockIds || []).map((blockId: string) => ({
            blockId,
            isPrimary: blockId === primaryBlockId,
          })),
        },
        logs: {
          create: {
            action: status === "DRAFT" ? "DRAFT_CREATED" : "SUBMITTED",
            performedBy: "seed-user-1",
          },
        },
      },
    });

    return NextResponse.json(innovation, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create innovation" }, { status: 500 });
  }
}
