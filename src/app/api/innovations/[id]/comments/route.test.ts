import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { getUserFromHeaders } from "@/lib/auth";
import { prisma } from "@/lib/db";

vi.mock("@/lib/auth", () => ({
  getUserFromHeaders: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    innovation: {
      findUnique: vi.fn(),
    },
    innovationComment: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

const params = { params: Promise.resolve({ id: "innovation-1" }) };

describe("/api/innovations/[id]/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserFromHeaders).mockResolvedValue({
      userId: "staff-1",
      username: "staff",
      fullName: "Staff User",
      role: "STAFF",
      blockCode: "RB",
    });
  });

  it("rejects comments for non-public innovations", async () => {
    vi.mocked(prisma.innovation.findUnique).mockResolvedValue({ status: "IN_REVIEW" } as never);

    const response = await POST(
      new Request("http://localhost/api/innovations/innovation-1/comments", {
        method: "POST",
        body: JSON.stringify({ content: "Looks useful" }),
      }) as never,
      params
    );

    expect(response.status).toBe(404);
    expect(prisma.innovationComment.create).not.toHaveBeenCalled();
  });
});
