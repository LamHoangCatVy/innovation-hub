import { prisma } from "@/lib/db";
import { runLLMScreening } from "@/lib/deepseek";
import { normaliseScores } from "@/lib/scoring";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

type CriterionResult = { criterion: string; score: number; reasoning: string };

interface CompletenessResult {
  complete: boolean;
  missing: string[];
}

export function checkCompleteness(data: {
  title: string;
  executiveSummary: string;
  painPoints: string;
  detailedSolution: string | null;
}): CompletenessResult {
  const missing: string[] = [];
  if (!data.title || data.title.trim().length < 10) missing.push("Tiêu đề quá ngắn (cần ít nhất 10 ký tự)");
  if (!data.executiveSummary || data.executiveSummary.trim().length < 50) missing.push("Tóm tắt giải pháp chưa đủ chi tiết (cần ít nhất 50 ký tự)");
  if (!data.painPoints || data.painPoints.trim().length < 30) missing.push("Thực trạng & Nỗi đau chưa rõ ràng (cần ít nhất 30 ký tự)");
  if (!data.detailedSolution || data.detailedSolution.trim().length < 50) missing.push("Giải pháp chi tiết chưa được mô tả đầy đủ (cần ít nhất 50 ký tự)");
  return { complete: missing.length === 0, missing };
}

function ruleBasedScoring(
  data: { executiveSummary: string; painPoints: string; detailedSolution: string | null; title: string },
  criteria: { name: string; description: string; maxScore: number }[]
): CriterionResult[] {
  const totalText = (data.executiveSummary + data.painPoints + (data.detailedSolution || "")).length;
  const titleLen = data.title.length;

  return criteria.map((c) => {
    let score = 3;
    let reasoning = `Điểm trung bình cho tiêu chí "${c.name}". `;
    if (totalText > 500) { score = Math.min(5, score + 1); reasoning += "Nội dung chi tiết. "; }
    if (totalText < 100) { score = Math.max(1, score - 1); reasoning += "Nội dung còn sơ sài. "; }
    if (titleLen > 30) { score = Math.min(5, score + 1); reasoning += "Tiêu đề rõ ràng. "; }
    return { criterion: c.name, score: Math.min(c.maxScore, Math.max(1, score)), reasoning };
  });
}

interface ScreeningOutput {
  finalScore: number;
  screeningMethod: "llm" | "rule";
  completeness: CompletenessResult;
  status: string;
  hubUrl: string | null;
}

export async function autoScreenInnovation(innovationId: string): Promise<ScreeningOutput> {
  const innovation = await prisma.innovation.findUnique({
    where: { id: innovationId },
    include: {
      primaryBlock: { select: { code: true, name: true, id: true } },
      classifications: { select: { blockId: true } },
    },
  });
  if (!innovation || !innovation.primaryBlock) {
    throw new Error("Innovation or primary block not found");
  }

  const completeness = checkCompleteness(innovation);

  const mapping = await prisma.blockFrameworkMapping.findFirst({
    where: { blockId: innovation.primaryBlockId! },
    include: { framework: { include: { criteria: true } } },
  });
  if (!mapping) throw new Error("No active framework for this block");

  const framework = mapping.framework;
  const innovationData = {
    code: innovation.code,
    title: innovation.title,
    executiveSummary: innovation.executiveSummary,
    painPoints: innovation.painPoints,
    detailedSolution: innovation.detailedSolution,
    primaryBlockName: innovation.primaryBlock.name,
    isBankWide: innovation.isBankWide,
  };
  const frameworkData = {
    name: framework.name,
    formula: framework.formula,
    criteria: framework.criteria.map((c) => ({
      name: c.name,
      description: c.description,
      weight: c.weight,
      minScore: c.minScore,
      maxScore: c.maxScore,
    })),
  };

  let criteriaScores: CriterionResult[];
  let finalScore: number;
  let screeningMethod: "llm" | "rule" = "rule";
  let rawResponse = "";

  if (DEEPSEEK_API_KEY && DEEPSEEK_API_KEY !== "your-deepseek-api-key-here") {
    try {
      const result = await runLLMScreening(innovationData, frameworkData, DEEPSEEK_API_KEY);
      criteriaScores = result.criteria_scores;
      finalScore = normaliseScores(criteriaScores, framework.name);
      rawResponse = JSON.stringify(result);
      screeningMethod = "llm";
    } catch {
      criteriaScores = ruleBasedScoring(innovation, frameworkData.criteria);
      finalScore = normaliseScores(criteriaScores, framework.name);
    }
  } else {
    criteriaScores = ruleBasedScoring(innovation, frameworkData.criteria);
    finalScore = normaliseScores(criteriaScores, framework.name);
  }

  await prisma.innovationScreening.create({
    data: {
      innovationId,
      frameworkId: framework.id,
      normalisedScore: finalScore,
      rawResponse,
      scores: {
        create: criteriaScores.map((cs) => {
          const criterion = framework.criteria.find((c) => c.name === cs.criterion);
          return { criterionId: criterion?.id || "", score: cs.score, reasoning: cs.reasoning };
        }),
      },
    },
  });

  let newStatus = "SCREENED";
  if (!completeness.complete) {
    newStatus = "MODIFICATION_REQUESTED";
    await prisma.innovationLog.create({
      data: {
        innovationId,
        action: "FEEDBACK_AUTO",
        payload: JSON.stringify({ completeness }),
        performedBy: "system",
      },
    });
  } else {
    const blocksToReview = [
      ...new Set([innovation.primaryBlockId!, ...innovation.classifications.map((c) => c.blockId)]),
    ];
    for (const bid of blocksToReview) {
      const isPrimary = bid === innovation.primaryBlockId;
      await prisma.review.upsert({
        where: { innovationId_blockId: { innovationId, blockId: bid } },
        create: {
          innovationId,
          blockId: bid,
          reviewerId: "admin-001",
          decision: isPrimary ? "APPROVED" : "PENDING",
          reviewedAt: isPrimary ? new Date() : null,
        },
        update: {
          decision: isPrimary ? "APPROVED" : "PENDING",
          reviewedAt: isPrimary ? new Date() : null,
        },
      });
    }

    newStatus = "PUBLISHED";
    await prisma.innovation.update({
      where: { id: innovationId },
      data: {
        status: "PUBLISHED",
        approvedAt: new Date(),
        publishedAt: new Date(),
      },
    });
  }

  await prisma.innovationLog.create({
    data: {
      innovationId,
      action: "SCREENING_COMPLETED",
      payload: JSON.stringify({ score: finalScore, method: screeningMethod, complete: completeness.complete }),
    },
  });

  return {
    finalScore,
    screeningMethod,
    completeness,
    status: newStatus,
    hubUrl: finalScore >= 50 ? `/hub?highlight=${innovationId}` : null,
  };
}
