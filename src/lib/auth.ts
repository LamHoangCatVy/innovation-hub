import { headers } from "next/headers";

export interface RequestUser {
  userId: string;
  username: string;
  fullName: string;
  role: "ADMIN" | "STAFF";
  blockCode: string;
}

export async function getUserFromHeaders(): Promise<RequestUser> {
  const headersList = await headers();
  const userHeader = headersList.get("x-vpb-user");

  if (userHeader) {
    try {
      return JSON.parse(userHeader);
    } catch {}
  }

  return {
    userId: "seed-user-1",
    username: "admin",
    fullName: "Admin User",
    role: "ADMIN",
    blockCode: "Strategy",
  };
}
