export interface CriterionScoreResult {
  criterion: string;
  score: number;
  reasoning: string;
}

export interface ScreeningResult {
  proposal_id: string;
  applied_framework: string;
  criteria_scores: CriterionScoreResult[];
  final_normalised_score: number;
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
