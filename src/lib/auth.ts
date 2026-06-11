import { headers } from "next/headers";

export interface RequestUser {
  userId: string;
  username: string;
  fullName: string;
  role: "ADMIN" | "STAFF";
  blockCode: string;
}

/**
 * Returns the authenticated user for the current request.
 *
 * The `x-vpb-user` header is set by `middleware.ts` from a server-verified
 * session JWT (and any inbound client-supplied value is stripped first), so the
 * value here is trusted. Throws if absent — callers should treat that as 401.
 */
export async function getUserFromHeaders(): Promise<RequestUser> {
  const headersList = await headers();
  const userHeader = headersList.get("x-vpb-user");

  if (userHeader) {
    try {
      return JSON.parse(decodeURIComponent(userHeader)) as RequestUser;
    } catch {}
  }

  throw new Error("Unauthorized: no authenticated user");
}
