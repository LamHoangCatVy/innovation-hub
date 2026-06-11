import { NextRequest, NextResponse } from "next/server";
import {
  verifySession,
  SESSION_COOKIE,
  IMPERSONATE_COOKIE,
} from "@/lib/session";
import type { RequestUser } from "@/lib/auth";

// Pages anyone can view without a session.
const PUBLIC_PAGES = ["/", "/login"];
// Auth APIs that guard themselves and must stay reachable without the gate.
const OPEN_API = ["/api/auth/login", "/api/auth/logout", "/api/auth/me"];
// Routes restricted to ADMIN (prefix match).
const ADMIN_PREFIXES = ["/dashboard", "/admin"];

function isPublicPage(path: string) {
  return PUBLIC_PAGES.includes(path);
}
function isOpenApi(path: string) {
  return OPEN_API.some((p) => path === p);
}
function isAdminOnly(path: string) {
  return ADMIN_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}
function homeFor(user: RequestUser) {
  return user.role === "ADMIN" ? "/dashboard" : "/hub";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api");

  // Resolve trusted identity from the real session, applying admin impersonation.
  const realUser = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  let identity = realUser;
  let impersonating = false;
  if (realUser?.role === "ADMIN") {
    const impersonated = await verifySession(request.cookies.get(IMPERSONATE_COOKIE)?.value);
    if (impersonated && impersonated.userId !== realUser.userId) {
      identity = impersonated;
      impersonating = true;
    }
  }

  // Build request headers: strip any client-supplied identity, inject the trusted one.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-vpb-user");
  requestHeaders.delete("x-vpb-impersonating");
  if (identity) {
    // URI-encode: header values must be Latin1/ByteString, but identities contain
    // non-Latin1 characters (e.g. Vietnamese names). Decoded in getUserFromHeaders.
    requestHeaders.set("x-vpb-user", encodeURIComponent(JSON.stringify(identity)));
  }
  if (impersonating) {
    requestHeaders.set("x-vpb-impersonating", "1");
  }
  const pass = () => NextResponse.next({ request: { headers: requestHeaders } });

  // Always allow self-guarding auth APIs (with header injected if present).
  if (isOpenApi(pathname)) return pass();

  // Unauthenticated.
  if (!identity) {
    if (isPublicPage(pathname)) return pass();
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated but visiting the login page → send to their home.
  if (pathname === "/login") {
    return NextResponse.redirect(new URL(homeFor(identity), request.url));
  }

  // ADMIN-only routes.
  if (isAdminOnly(pathname) && identity.role !== "ADMIN") {
    if (isApi) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/hub", request.url));
  }

  return pass();
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
