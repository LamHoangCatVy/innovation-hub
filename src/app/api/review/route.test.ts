import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { getUserFromHeaders } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

vi.mock("@/lib/auth", () => ({
  getUserFromHeaders: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    block: {
      findUnique: vi.fn(),
    },
    review: {
      findMany: vi.fn(),
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

const adminUser = {
  userId: "admin-1",
  username: "admin",
  fullName: "Admin User",
  role: "ADMIN" as const,
  blockCode: "",
};

describe("/api/review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.review.findMany).mockResolvedValue([]);
  });

  it("ignores staff-spoofed block headers and uses the staff block", async () => {
    vi.mocked(getUserFromHeaders).mockResolvedValue(staffUser);
    vi.mocked(headers).mockResolvedValue(new Headers({ "x-vpb-review-block": "ALL" }) as never);
    vi.mocked(prisma.block.findUnique).mockResolvedValue({ id: "block-rb" } as never);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(prisma.block.findUnique).toHaveBeenCalledWith({ where: { code: "RB" } });
    expect(prisma.review.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { blockId: "block-rb" } }));
  });

  it("lets admins list all reviews", async () => {
    vi.mocked(getUserFromHeaders).mockResolvedValue(adminUser);
    vi.mocked(headers).mockResolvedValue(new Headers({ "x-vpb-review-block": "ALL" }) as never);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(prisma.block.findUnique).not.toHaveBeenCalled();
    expect(prisma.review.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });
});
