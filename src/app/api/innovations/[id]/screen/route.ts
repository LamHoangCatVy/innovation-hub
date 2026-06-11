import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { autoScreenInnovation } from "@/lib/screening-service";
import { getUserFromHeaders } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Auth: only author or ADMIN can trigger screening
  let user;
  try {
    user = await getUserFromHeaders();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify innovation exists and user is authorised
  const innovation = await prisma.innovation.findUnique({
    where: { id },
    select: { authorId: true, status: true },
  });

  if (!innovation) {
    return NextResponse.json({ error: "Innovation not found" }, { status: 404 });
  }

  if (innovation.authorId !== user.userId && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Status guard: only screen when in a screenable state
  const SCREENABLE_STATUSES = ["PENDING_SCREENING", "MODIFICATION_REQUESTED"];
  if (!SCREENABLE_STATUSES.includes(innovation.status)) {
    return NextResponse.json(
      { error: `Cannot screen innovation in status "${innovation.status}". Expected: ${SCREENABLE_STATUSES.join(", ")}` },
      { status: 409 }
    );
  }

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
