import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromHeaders } from "@/lib/auth";

// PATCH: mark a single notification as read
export async function PATCH(
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
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (notification.userId !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
