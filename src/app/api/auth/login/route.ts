import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { signSession, SESSION_COOKIE, IMPERSONATE_COOKIE, cookieOptions } from "@/lib/session";
import type { RequestUser } from "@/lib/auth";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Tên đăng nhập và mật khẩu là bắt buộc" }, { status: 400 });
  }

  const { username, password } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { username },
    include: { block: { select: { code: true } } },
  });

  // Generic failure to avoid leaking which usernames exist.
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Tên đăng nhập hoặc mật khẩu không đúng" }, { status: 401 });
  }

  const identity: RequestUser = {
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role === "ADMIN" ? "ADMIN" : "STAFF",
    blockCode: user.block?.code ?? "",
  };

  const token = await signSession(identity);
  const res = NextResponse.json({ user: identity });
  res.cookies.set(SESSION_COOKIE, token, cookieOptions);
  // Clear any stale impersonation on fresh login.
  res.cookies.set(IMPERSONATE_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
