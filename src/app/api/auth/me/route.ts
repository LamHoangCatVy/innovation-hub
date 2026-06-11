import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getUserFromHeaders } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUserFromHeaders();
    const impersonating = (await headers()).get("x-vpb-impersonating") === "1";
    return NextResponse.json({ user, impersonating });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
