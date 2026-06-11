import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
      },
    });
    if (!innovation) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(innovation);
  } catch {
    return NextResponse.json({ error: "Failed to fetch innovation" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const innovation = await prisma.innovation.update({ where: { id }, data: body });
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
  try {
    await prisma.innovation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
