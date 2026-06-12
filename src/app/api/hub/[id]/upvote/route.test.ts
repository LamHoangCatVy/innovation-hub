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
    innovationUpvote: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
  },
}));

const params = { params: Promise.resolve({ id: "innovation-1" }) };

describe("/api/hub/[id]/upvote", () => {
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

  it("rejects upvotes for non-public innovations", async () => {
    vi.mocked(prisma.innovation.findUnique).mockResolvedValue({ status: "IN_REVIEW" } as never);

    const response = await POST(new Request("http://localhost/api/hub/innovation-1/upvote") as never, params);

    expect(response.status).toBe(404);
    expect(prisma.innovationUpvote.create).not.toHaveBeenCalled();
    expect(prisma.innovationUpvote.delete).not.toHaveBeenCalled();
  });
});
