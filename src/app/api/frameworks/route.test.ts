import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import { getUserFromHeaders } from "@/lib/auth";
import { prisma } from "@/lib/db";

vi.mock("@/lib/auth", () => ({
  getUserFromHeaders: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    framework: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

const staffUser = {
  userId: "staff-1",
  username: "staff",
  fullName: "Staff User",
  role: "STAFF" as const,
  blockCode: "RB",
};

describe("/api/frameworks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects staff listing frameworks", async () => {
    vi.mocked(getUserFromHeaders).mockResolvedValue(staffUser);

    const response = await GET();

    expect(response.status).toBe(403);
    expect(prisma.framework.findMany).not.toHaveBeenCalled();
  });

  it("rejects staff creating frameworks", async () => {
    vi.mocked(getUserFromHeaders).mockResolvedValue(staffUser);

    const response = await POST(
      new Request("http://localhost/api/frameworks", {
        method: "POST",
        body: JSON.stringify({ name: "Framework" }),
      }) as never
    );

    expect(response.status).toBe(403);
    expect(prisma.framework.create).not.toHaveBeenCalled();
  });
});
