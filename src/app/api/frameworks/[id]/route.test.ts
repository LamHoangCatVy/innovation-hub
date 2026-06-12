import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, PUT } from "./route";
import { getUserFromHeaders } from "@/lib/auth";
import { prisma } from "@/lib/db";

vi.mock("@/lib/auth", () => ({
  getUserFromHeaders: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    framework: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    frameworkCriterion: {
      deleteMany: vi.fn(),
    },
    blockFrameworkMapping: {
      deleteMany: vi.fn(),
    },
  },
}));

const params = { params: Promise.resolve({ id: "framework-1" }) };
const staffUser = {
  userId: "staff-1",
  username: "staff",
  fullName: "Staff User",
  role: "STAFF" as const,
  blockCode: "RB",
};

describe("/api/frameworks/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserFromHeaders).mockResolvedValue(staffUser);
  });

  it("rejects staff reading a framework", async () => {
    const response = await GET(new Request("http://localhost/api/frameworks/framework-1") as never, params);

    expect(response.status).toBe(403);
    expect(prisma.framework.findUnique).not.toHaveBeenCalled();
  });

  it("rejects staff updating a framework", async () => {
    const response = await PUT(
      new Request("http://localhost/api/frameworks/framework-1", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated" }),
      }) as never,
      params
    );

    expect(response.status).toBe(403);
    expect(prisma.framework.update).not.toHaveBeenCalled();
  });

  it("rejects staff deleting a framework", async () => {
    const response = await DELETE(new Request("http://localhost/api/frameworks/framework-1") as never, params);

    expect(response.status).toBe(403);
    expect(prisma.framework.delete).not.toHaveBeenCalled();
  });
});
