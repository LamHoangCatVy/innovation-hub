import { NextResponse } from "next/server";
import { SESSION_COOKIE, IMPERSONATE_COOKIE, cookieOptions } from "@/lib/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  res.cookies.set(IMPERSONATE_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
