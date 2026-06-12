import { describe, expect, it } from "vitest";
import {
  canParticipateInHub,
  isAdmin,
  isPendingReviewDecision,
  isPublicInnovationStatus,
  isReviewableInnovationStatus,
  isValidReviewDecision,
  resolveReviewBlockScope,
} from "./business-policy";

describe("business policy", () => {
  it("identifies admins", () => {
    expect(isAdmin({ role: "ADMIN" })).toBe(true);
    expect(isAdmin({ role: "STAFF" })).toBe(false);
  });

  it("treats published and completed innovations as public", () => {
    expect(isPublicInnovationStatus("PUBLISHED")).toBe(true);
    expect(isPublicInnovationStatus("COMPLETED")).toBe(true);
    expect(canParticipateInHub("IN_REVIEW")).toBe(false);
  });

  it("validates final review decisions only", () => {
    expect(isValidReviewDecision("APPROVED")).toBe(true);
    expect(isValidReviewDecision("REJECTED")).toBe(true);
    expect(isValidReviewDecision("MODIFICATION_REQUESTED")).toBe(true);
    expect(isValidReviewDecision("PENDING")).toBe(false);
  });

  it("requires an in-review innovation and pending review", () => {
    expect(isReviewableInnovationStatus("IN_REVIEW")).toBe(true);
    expect(isReviewableInnovationStatus("PUBLISHED")).toBe(false);
    expect(isPendingReviewDecision("PENDING")).toBe(true);
    expect(isPendingReviewDecision("APPROVED")).toBe(false);
  });

  it("lets admins request all reviews or a specific block", () => {
    expect(resolveReviewBlockScope({ role: "ADMIN", blockCode: "" }, "ALL")).toEqual({
      all: true,
      blockCode: null,
      error: null,
    });
    expect(resolveReviewBlockScope({ role: "ADMIN", blockCode: "" }, "RB")).toEqual({
      all: false,
      blockCode: "RB",
      error: null,
    });
  });

  it("ignores staff-requested review blocks and uses their own block", () => {
    expect(resolveReviewBlockScope({ role: "STAFF", blockCode: "Risk" }, "ALL")).toEqual({
      all: false,
      blockCode: "Risk",
      error: null,
    });
  });

  it("reports staff without a block as invalid review scope", () => {
    expect(resolveReviewBlockScope({ role: "STAFF", blockCode: "" }, "ALL")).toEqual({
      all: false,
      blockCode: null,
      error: "MISSING_STAFF_BLOCK",
    });
  });
});
