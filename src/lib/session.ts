import { SignJWT, jwtVerify } from "jose";
import type { RequestUser } from "@/lib/auth";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-insecure-secret-change-me-in-production"
);

const ALG = "HS256";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const SESSION_COOKIE = "vpb_session";
export const IMPERSONATE_COOKIE = "vpb_impersonate";

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

/** Sign a session JWT carrying the trusted user identity. */
export async function signSession(user: RequestUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(SECRET);
}

/** Verify a session JWT. Returns the user payload or null if invalid/expired. */
export async function verifySession(token: string | undefined): Promise<RequestUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET, { algorithms: [ALG] });
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      fullName: payload.fullName as string,
      role: payload.role as RequestUser["role"],
      blockCode: payload.blockCode as string,
    };
  } catch {
    return null;
  }
}
