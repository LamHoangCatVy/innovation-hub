import { beforeEach, describe, expect, it, vi } from "vitest";
import { PUT } from "./route";
import { getUserFromHeaders } from "@/lib/auth";
import { prisma } from "@/lib/db";

vi.mock("@/lib/auth", () => ({
  getUserFromHeaders: vi.fn(),
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    block: {
      findUnique: vi.fn(),
    },
    review: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    innovation: {
      update: vi.fn(),
    },
    innovationLog: {
      create: vi.fn(),
    },
  },
}));

const params = { params: Promise.resolve({ id: "innovation-1" }) };
const staffUser = {
  userId: "staff-1",
  username: "staff",
  fullName: "Staff User",
  role: "STAFF" as const,
  blockCode: "RB",
};

function requestFor(decision: string) {
  return new Request("http://localhost/api/review/innovation-1", {
    method: "PUT",
    body: JSON.stringify({ decision }),
  }) as never;
}

describe("/api/review/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserFromHeaders).mockResolvedValue(staffUser);
    vi.mocked(prisma.block.findUnique).mockResolvedValue({ id: "block-rb" } as never);
  });

  it("rejects invalid decisions", async () => {
    const response = await PUT(requestFor("PENDING"), params);

    expect(response.status).toBe(400);
    expect(prisma.review.findFirst).not.toHaveBeenCalled();
  });

  it("rejects decisions for non-reviewable innovation statuses", async () => {
    vi.mocked(prisma.review.findFirst).mockResolvedValue({
      id: "review-1",
      decision: "PENDING",
      internalNotes: null,
      feedbackNotes: null,
      innovation: { authorId: "author-1", title: "Idea", status: "DRAFT" },
    } as never);

    const response = await PUT(requestFor("APPROVED"), params);

    expect(response.status).toBe(409);
    expect(prisma.review.update).not.toHaveBeenCalled();
  });

  it("rejects decisions for already-decided reviews", async () => {
    vi.mocked(prisma.review.findFirst).mockResolvedValue({
      id: "review-1",
      decision: "APPROVED",
      internalNotes: null,
      feedbackNotes: null,
      innovation: { authorId: "author-1", title: "Idea", status: "IN_REVIEW" },
    } as never);

    const response = await PUT(requestFor("REJECTED"), params);

    expect(response.status).toBe(409);
    expect(prisma.review.update).not.toHaveBeenCalled();
  });
});
