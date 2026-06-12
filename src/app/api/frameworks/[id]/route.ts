import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromHeaders } from "@/lib/auth";
import { isAdmin } from "@/lib/business-policy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await getUserFromHeaders();
    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const framework = await prisma.framework.findUnique({
      where: { id },
      include: {
        criteria: { orderBy: { orderIndex: "asc" } },
        blockMappings: { select: { blockId: true } },
      },
    });
    if (!framework) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      ...framework,
      blockMapping: framework.blockMappings.map((m) => m.blockId),
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await getUserFromHeaders();
    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, formula, isActive, criteria, blockMapping } = body;

    await prisma.frameworkCriterion.deleteMany({ where: { frameworkId: id } });
    await prisma.blockFrameworkMapping.deleteMany({ where: { frameworkId: id } });

    const framework = await prisma.framework.update({
      where: { id },
      data: {
        name,
        description,
        formula,
        isActive,
        updatedAt: new Date(),
        criteria: {
          create: (criteria || []).map((c: Record<string, unknown>, i: number) => ({
            name: c.name as string,
            description: c.description as string,
            weight: c.weight as number,
            minScore: c.minScore as number,
            maxScore: c.maxScore as number,
            orderIndex: i,
          })),
        },
        blockMappings: {
          create: (blockMapping || []).map((blockId: string) => ({ blockId })),
        },
      },
    });
    return NextResponse.json(framework);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await getUserFromHeaders();
    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.framework.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
