import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const blocks = await prisma.block.findMany({ orderBy: { code: "asc" } });
    return NextResponse.json(blocks);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
