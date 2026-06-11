import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { autoScreenInnovation } from "@/lib/screening-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await autoScreenInnovation(id);
    const screening = await prisma.innovationScreening.findFirst({
      where: { innovationId: id },
      orderBy: { createdAt: "desc" },
      include: { scores: { include: { criterion: true } } },
    });
    return NextResponse.json({ screening, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
