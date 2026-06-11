export type InnovationStatus =
  | "DRAFT"
  | "PENDING_SCREENING"
  | "SCREENED"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "MODIFICATION_REQUESTED"
  | "PUBLISHED"
  | "COMPLETED";

export type ReviewDecision = "PENDING" | "APPROVED" | "REJECTED" | "MODIFICATION_REQUESTED";

export interface InnovationFormData {
  title: string;
  executiveSummary: string;
  painPoints: string;
  detailedSolution: string;
  primaryBlockId: string;
  selectedBlockIds: string[];
  isBankWide: boolean;
}

export interface FrameworkFormData {
  name: string;
  description: string;
  formula: string;
  criteria: {
    name: string;
    description: string;
    weight: number;
    minScore: number;
    maxScore: number;
  }[];
  blockMapping: string[];
}

export interface HubFilters {
  keyword: string;
  blockId: string;
  sortBy: "latest" | "highest_score" | "most_upvotes";
}
