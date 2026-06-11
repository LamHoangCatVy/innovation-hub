import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromHeaders } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const innovation = await prisma.innovation.findUnique({
      where: { id },
      include: {
        primaryBlock: { select: { code: true, name: true } },
        classifications: { include: { block: { select: { code: true, name: true } } } },
        author: { select: { fullName: true, email: true } },
        screenings: { include: { scores: { include: { criterion: true } }, framework: true } },
        reviews: { include: { reviewer: { select: { fullName: true } }, block: { select: { code: true, name: true } } } },
        _count: { select: { upvotes: true, comments: true } },
        logs: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
    if (!innovation) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(innovation);
  } catch {
    return NextResponse.json({ error: "Failed to fetch innovation" }, { status: 500 });
  }
}

// Whitelist of fields that can be updated via PUT (never status/authorId/code/version)
const UPDATABLE_FIELDS = new Set([
  "title",
  "executiveSummary",
  "painPoints",
  "detailedSolution",
  "primaryBlockId",
  "isBankWide",
]);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let user;
  try {
    user = await getUserFromHeaders();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await prisma.innovation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Only the author or an ADMIN can update
    if (existing.authorId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Only allow whitelisted fields
    const safeData: Record<string, unknown> = {};
    for (const key of Object.keys(body)) {
      if (UPDATABLE_FIELDS.has(key)) {
        safeData[key] = body[key];
      }
    }

    const innovation = await prisma.innovation.update({ where: { id }, data: safeData });
    return NextResponse.json(innovation);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let user;
  try {
    user = await getUserFromHeaders();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await prisma.innovation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Only the author or an ADMIN can delete
    if (existing.authorId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.innovation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
