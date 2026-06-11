import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromHeaders } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const user = await getUserFromHeaders();
    const headersList = await headers();
    const reviewBlock = headersList.get("x-vpb-review-block") || user.blockCode;

    const where: Record<string, unknown> = {};
    if (reviewBlock !== "ALL") {
      const block = await prisma.block.findUnique({ where: { code: reviewBlock } });
      if (block) {
        where.blockId = block.id;
      }
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        innovation: {
          select: {
            id: true,
            code: true,
            title: true,
            author: { select: { fullName: true } },
            primaryBlock: { select: { name: true } },
            screenings: { select: { normalisedScore: true }, orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
        block: { select: { code: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped = reviews.map((r) => ({
      id: r.id,
      innovationId: r.innovationId,
      innovationTitle: r.innovation.title,
      innovationCode: r.innovation.code,
      primaryBlockName: r.innovation.primaryBlock?.name || "",
      normalisedScore: r.innovation.screenings[0]?.normalisedScore ?? null,
      decision: r.decision,
      reviewedAt: r.reviewedAt?.toISOString() || null,
      authorName: r.innovation.author.fullName,
      blockCode: r.block.code,
    }));

    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
