export interface CriterionScoreResult {
  criterion: string;
  score: number;
  reasoning: string;
}

/** A Socratic, criterion-tagged prompt that guides the author to a weak spot. */
export interface ImprovementQuestion {
  criterion: string;
  question: string;
}

export interface ScreeningResult {
  proposal_id: string;
  applied_framework: string;
  criteria_scores: CriterionScoreResult[];
  final_normalised_score: number;
  improvement_questions?: ImprovementQuestion[];
}

export function calculateRICEScore(scores: CriterionScoreResult[]): number {
  const getScore = (name: string) => scores.find(s => s.criterion === name)?.score ?? 1;
  const reach = getScore("Reach");
  const impact = getScore("Impact");
  const confidence = getScore("Confidence");
  const effort = getScore("Effort");
  const raw = (reach * impact * confidence) / (effort || 1);
  return Math.min(Math.round(raw * 100) / 100, 100);
}

export function calculateOperationalScore(scores: CriterionScoreResult[]): number {
  const getScore = (name: string) => scores.find(s => s.criterion === name)?.score ?? 1;
  const timeSaving = getScore("Time Saving");
  const costReduction = getScore("Cost Reduction");
  const employeeExp = getScore("Employee Experience");
  const opRisk = getScore("OpRisk Mitigation");
  const compliance = getScore("Compliance");

  const operationalValue = (timeSaving + costReduction + employeeExp) / 3;
  const riskControl = (opRisk + compliance) / 2;
  return Math.min(Math.round(((operationalValue * 0.6 + riskControl * 0.4) / 5) * 100 * 100) / 100, 100);
}

export function normaliseScores(scores: CriterionScoreResult[], frameworkName: string): number {
  if (frameworkName === "FRAMEWORK_BUSINESS_RICE") {
    return calculateRICEScore(scores);
  }
  return calculateOperationalScore(scores);
}

/**
 * Framework-agnostic quality score on a true 0–100 scale: the mean of each
 * criterion's score as a fraction of its max. Unlike the RICE priority formula
 * (which is multiplicative and clusters low), this is comparable across every
 * framework, so it is the right basis for the review-gate threshold and the
 * headline score shown in the UI.
 */
export function computeQualityScore(
  scores: CriterionScoreResult[],
  criteria: { name: string; maxScore: number }[]
): number {
  if (scores.length === 0) return 0;
  const maxByName = new Map(criteria.map((c) => [c.name, c.maxScore || 5]));
  const ratios = scores.map((s) => {
    const max = maxByName.get(s.criterion) ?? 5;
    return Math.min(1, Math.max(0, s.score / (max || 5)));
  });
  const mean = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
  return Math.round(mean * 100 * 100) / 100; // 0–100, 2 decimals
}
