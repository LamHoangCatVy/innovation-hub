import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromHeaders } from "@/lib/auth";
import { PUBLIC_INNOVATION_STATUSES } from "@/lib/business-policy";

export async function GET(request: NextRequest) {
  const user = await getUserFromHeaders();
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword") || "";
  const blockId = searchParams.get("blockId") || "";
  const sortBy = searchParams.get("sortBy") || "latest";

  try {
    const where: Record<string, unknown> = { status: { in: [...PUBLIC_INNOVATION_STATUSES] } };
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { executiveSummary: { contains: keyword } },
      ];
    }
    if (blockId) {
      where.classifications = { some: { block: { code: blockId } } };
    }

    const innovations = await prisma.innovation.findMany({
      where,
      include: {
        primaryBlock: { select: { name: true } },
        author: { select: { fullName: true } },
        screenings: { select: { normalisedScore: true }, orderBy: { createdAt: "desc" }, take: 1 },
        comments: { select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { upvotes: true, comments: true } },
        upvotes: { where: { userId: user.userId }, select: { id: true } },
      },
      orderBy: sortBy === "most_upvotes"
        ? { upvotes: { _count: "desc" } }
        : sortBy === "most_discussed"
          ? { comments: { _count: "desc" } }
          : sortBy === "highest_score"
            ? undefined : { publishedAt: "desc" },
    });

    const mapped = innovations.map((i) => {
      const publishedAt = i.publishedAt?.toISOString() || i.createdAt.toISOString();
      const lastActivityAt = i.comments[0]?.createdAt.toISOString() ?? publishedAt;
      return {
        id: i.id,
        code: i.code,
        title: i.title,
        executiveSummary: i.executiveSummary,
        primaryBlockName: i.primaryBlock?.name || "",
        normalisedScore: i.screenings[0]?.normalisedScore ?? null,
        upvoteCount: i._count.upvotes,
        commentCount: i._count.comments,
        authorName: i.author.fullName,
        publishedAt,
        lastActivityAt,
        isUpvoted: i.upvotes.length > 0,
      };
    });

    if (sortBy === "highest_score") {
      mapped.sort((a, b) => (b.normalisedScore ?? 0) - (a.normalisedScore ?? 0));
    }

    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
