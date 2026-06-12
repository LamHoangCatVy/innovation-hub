import type { RequestUser } from "@/lib/auth";

export const PUBLIC_INNOVATION_STATUSES = ["PUBLISHED", "COMPLETED"] as const;
export const REVIEWABLE_INNOVATION_STATUSES = ["IN_REVIEW"] as const;
export const VALID_REVIEW_DECISIONS = ["APPROVED", "REJECTED", "MODIFICATION_REQUESTED"] as const;

export type PublicInnovationStatus = (typeof PUBLIC_INNOVATION_STATUSES)[number];
export type ReviewableInnovationStatus = (typeof REVIEWABLE_INNOVATION_STATUSES)[number];
export type FinalReviewDecision = (typeof VALID_REVIEW_DECISIONS)[number];

export interface ReviewBlockScope {
  all: boolean;
  blockCode: string | null;
  error: "MISSING_STAFF_BLOCK" | null;
}

export function isAdmin(user: Pick<RequestUser, "role">): boolean {
  return user.role === "ADMIN";
}

export function isPublicInnovationStatus(status: unknown): status is PublicInnovationStatus {
  return typeof status === "string" && PUBLIC_INNOVATION_STATUSES.includes(status as PublicInnovationStatus);
}

export function canParticipateInHub(status: unknown): boolean {
  return isPublicInnovationStatus(status);
}

export function isValidReviewDecision(decision: unknown): decision is FinalReviewDecision {
  return typeof decision === "string" && VALID_REVIEW_DECISIONS.includes(decision as FinalReviewDecision);
}

export function isReviewableInnovationStatus(status: unknown): status is ReviewableInnovationStatus {
  return typeof status === "string" && REVIEWABLE_INNOVATION_STATUSES.includes(status as ReviewableInnovationStatus);
}

export function isPendingReviewDecision(decision: unknown): decision is "PENDING" {
  return decision === "PENDING";
}

export function resolveReviewBlockScope(
  user: Pick<RequestUser, "role" | "blockCode">,
  requestedBlockCode?: string | null
): ReviewBlockScope {
  const requested = requestedBlockCode?.trim();

  if (isAdmin(user)) {
    if (!requested || requested === "ALL") {
      return { all: true, blockCode: null, error: null };
    }
    return { all: false, blockCode: requested, error: null };
  }

  if (!user.blockCode) {
    return { all: false, blockCode: null, error: "MISSING_STAFF_BLOCK" };
  }

  return { all: false, blockCode: user.blockCode, error: null };
}
