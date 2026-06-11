import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const frameworks = await prisma.framework.findMany({
      include: {
        criteria: true,
        blockMappings: { select: { blockId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = frameworks.map((fw) => ({
      id: fw.id,
      name: fw.name,
      description: fw.description,
      formula: fw.formula,
      isActive: fw.isActive,
      criteriaCount: fw.criteria.length,
      blockCount: fw.blockMappings.length,
      blocks: fw.blockMappings.map((m) => m.blockId),
      createdAt: fw.createdAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, formula, criteria, blockMapping } = body;

    const framework = await prisma.framework.create({
      data: {
        name,
        description,
        formula,
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
    return NextResponse.json(framework, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
