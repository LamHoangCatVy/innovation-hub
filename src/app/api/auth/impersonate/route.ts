import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  signSession,
  verifySession,
  SESSION_COOKIE,
  IMPERSONATE_COOKIE,
  cookieOptions,
} from "@/lib/session";
import type { RequestUser } from "@/lib/auth";

const schema = z.object({ userId: z.string().nullable() });

/**
 * ADMIN-only impersonation. Sets a signed `vpb_impersonate` cookie carrying the
 * target user's identity; middleware honors it only when the real session is ADMIN.
 * Passing `{ userId: null }` clears impersonation.
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  // Trust only the real session cookie here, NOT the middleware-injected header
  // (which may already reflect an active impersonation).
  const realUser = await verifySession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!realUser || realUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Clear impersonation.
  if (parsed.data.userId === null) {
    const res = NextResponse.json({ user: realUser });
    res.cookies.set(IMPERSONATE_COOKIE, "", { ...cookieOptions, maxAge: 0 });
    return res;
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    include: { block: { select: { code: true } } },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const identity: RequestUser = {
    userId: target.id,
    username: target.username,
    fullName: target.fullName,
    role: target.role === "ADMIN" ? "ADMIN" : "STAFF",
    blockCode: target.block?.code ?? "",
  };

  const token = await signSession(identity);
  const res = NextResponse.json({ user: identity });
  res.cookies.set(IMPERSONATE_COOKIE, token, cookieOptions);
  return res;
}
