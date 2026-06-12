import { prisma } from "@/lib/db";
import { runLLMScreening } from "@/lib/deepseek";
import { computeQualityScore } from "@/lib/scoring";
import { createNotification } from "@/lib/notifications";
import { SCREENING_PASS_THRESHOLD } from "@/lib/constants";
import { getNumberSetting, SETTING_KEYS } from "@/lib/settings";

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

// ---------------------------------------------------------------------------
// Content-aware rule-based scoring (P0a)
// Scores each criterion from signals: quantified evidence, distinct sections,
// keyword relevance, and length as a minor factor. screeningMethod stays "rule".
// ---------------------------------------------------------------------------

const EVIDENCE_REGEX = /\d+[%,.]?\d*\s*(%|triệu|tỷ|VND|USD|EUR|nghìn|ngàn|lần|giờ|phút|FTE|SLA|TAT)/gi;
const SECTION_FIELDS = ["executiveSummary", "painPoints", "detailedSolution"] as const;

/** Keyword banks loosely tied to common criterion names. */
const CRITERION_KEYWORDS: Record<string, RegExp> = {
  Reach: /khách hàng|người dùng|user|chi nhánh|phòng giao dịch|toàn hàng|phạm vi/gi,
  Impact: /doanh thu|lợi nhuận|NIM|CASA|ROE|ROA|tăng trưởng|sinh lời/gi,
  Confidence: /số liệu|thống kê|bằng chứng|pilot|thử nghiệm|kết quả|data|khảo sát/gi,
  Effort: /thời gian|chi phí|nguồn lực|nhân sự|hệ thống|triển khai|phức tạp/gi,
  "Time Saving": /thời gian|SLA|TAT|xử lý|tự động|nhanh hơn|giảm thời gian/gi,
  "Cost Reduction": /chi phí|FTE|tiết kiệm|cắt giảm|giảm chi phí|định biên/gi,
  "Employee Experience": /thủ công|lặp lại|tải|nhân viên|trải nghiệm|staff/gi,
  "OpRisk Mitigation": /rủi ro|lỗi|gian lận|human error|kiểm soát|sai sót/gi,
  Compliance: /thông tư|NHNN|quy định|tuân thủ|chế tài|pháp lý|compliance/gi,
};

function ruleBasedScoring(
  data: { executiveSummary: string; painPoints: string; detailedSolution: string | null; title: string },
  criteria: { name: string; description: string; maxScore: number }[]
): CriterionResult[] {
  const allText = [data.executiveSummary, data.painPoints, data.detailedSolution || ""].join(" ");
  const totalLen = allText.length;

  // Count quantified-evidence matches across the whole submission
  const evidenceMatches = (allText.match(EVIDENCE_REGEX) || []).length;

  // Count distinct filled sections (> 30 chars each)
  const filledSections = SECTION_FIELDS.filter((f) => (data[f] || "").trim().length > 30).length;

  return criteria.map((c) => {
    // Start at a neutral 2.5 / 5
    let score = 2.5;
    const reasons: string[] = [];

    // 1. Keyword relevance for this criterion (0 – 1.0 pts)
    const kwRegex = CRITERION_KEYWORDS[c.name] || new RegExp(c.name.replace(/\s+/g, "|"), "gi");
    const kwHits = (allText.match(kwRegex) || []).length;
    if (kwHits >= 3) { score += 1.0; reasons.push("Nhiều nội dung liên quan"); }
    else if (kwHits >= 1) { score += 0.5; reasons.push("Có đề cập liên quan"); }

    // 2. Quantified evidence (0 – 0.75 pts)
    if (evidenceMatches >= 3) { score += 0.75; reasons.push("Có dẫn chứng số liệu cụ thể"); }
    else if (evidenceMatches >= 1) { score += 0.35; reasons.push("Có một số dẫn chứng"); }
    else { reasons.push("Thiếu dẫn chứng định lượng"); }

    // 3. Section coverage (0 – 0.5 pts)
    if (filledSections === 3) { score += 0.5; reasons.push("Đầy đủ các phần"); }
    else if (filledSections === 2) { score += 0.25; }

    // 4. Length — minor factor (0 – 0.25 pts)
    if (totalLen > 500) { score += 0.25; }
    else if (totalLen < 100) { score -= 0.5; reasons.push("Nội dung còn sơ sài"); }

    score = Math.min(c.maxScore, Math.max(1, Math.round(score * 10) / 10));
    if (reasons.length === 0) reasons.push(`Điểm trung bình cho "${c.name}".`);

    return { criterion: c.name, score, reasoning: reasons.join(". ") + "." };
  });
}

interface ScreeningOutput {
  finalScore: number;
  screeningMethod: "llm" | "rule";
  completeness: CompletenessResult;
  status: string;
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
    where: {
      blockId: innovation.primaryBlockId!,
      framework: { isActive: true },
    },
    include: { framework: { include: { criteria: true } } },
    orderBy: { createdAt: "asc" },
  });
  if (!mapping) throw new Error("No active framework mapped for this block");

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
  let screeningMethod: "llm" | "rule" = "rule";
  let rawResponse = "";
  let promptTokens: number | null = null;
  let completionTokens: number | null = null;

  if (DEEPSEEK_API_KEY && DEEPSEEK_API_KEY !== "your-deepseek-api-key-here") {
    try {
      const { result, usage } = await runLLMScreening(innovationData, frameworkData, DEEPSEEK_API_KEY);
      criteriaScores = result.criteria_scores;
      rawResponse = JSON.stringify(result);
      screeningMethod = "llm";
      promptTokens = usage.promptTokens;
      completionTokens = usage.completionTokens;
    } catch {
      criteriaScores = ruleBasedScoring(innovation, frameworkData.criteria);
    }
  } else {
    criteriaScores = ruleBasedScoring(innovation, frameworkData.criteria);
  }

  // Framework-agnostic quality score (0–100): used both as the headline score and
  // as the review-gate basis, so RICE and Operational ideas are judged on one scale.
  const finalScore = computeQualityScore(criteriaScores, frameworkData.criteria);

  // Delete any prior screening rows for idempotency on re-screen
  await prisma.innovationScreening.deleteMany({ where: { innovationId } });

  await prisma.innovationScreening.create({
    data: {
      innovationId,
      frameworkId: framework.id,
      normalisedScore: finalScore,
      rawResponse,
      promptTokens,
      completionTokens,
      scores: {
        create: criteriaScores.map((cs) => {
          const criterion = framework.criteria.find((c) => c.name === cs.criterion);
          return { criterionId: criterion?.id || "", score: cs.score, reasoning: cs.reasoning };
        }),
      },
    },
  });

  // -----------------------------------------------------------------------
  // Review-gate routing (P0b)
  // -----------------------------------------------------------------------
  let newStatus: string;
  const failReasons: string[] = [];

  // Admin-configurable pass threshold (SystemSetting), clamped to 0–100,
  // falling back to the compiled-in default.
  const threshold = Math.min(
    100,
    Math.max(0, await getNumberSetting(SETTING_KEYS.SCREENING_PASS_THRESHOLD, SCREENING_PASS_THRESHOLD))
  );

  if (!completeness.complete) {
    failReasons.push(...completeness.missing);
  }
  if (finalScore < threshold) {
    failReasons.push(`Điểm chất lượng chưa đạt ngưỡng tối thiểu (${finalScore.toFixed(1)}/${threshold})`);
  }

  if (failReasons.length > 0) {
    // --- FAIL path: send back for modifications ---
    newStatus = "MODIFICATION_REQUESTED";
    await prisma.innovation.update({
      where: { id: innovationId },
      data: { status: newStatus },
    });

    await prisma.innovationLog.create({
      data: {
        innovationId,
        action: "FEEDBACK_AUTO",
        payload: JSON.stringify({ completeness, failReasons }),
        performedBy: "system",
      },
    });

    // Notify author
    await createNotification(innovation.authorId, {
      type: "MODIFICATION_REQUESTED",
      title: "Sáng kiến cần bổ sung",
      body: `Sáng kiến "${innovation.title}" cần được bổ sung thông tin trước khi chuyển duyệt. Lý do: ${failReasons.join("; ")}.`,
      innovationId,
    });
  } else {
    // --- PASS path: forward to review ---
    newStatus = "IN_REVIEW";
    await prisma.innovation.update({
      where: { id: innovationId },
      data: { status: newStatus },
    });

    // Create a single PENDING review for the primary block only
    await prisma.review.upsert({
      where: { innovationId_blockId: { innovationId, blockId: innovation.primaryBlockId! } },
      create: {
        innovationId,
        blockId: innovation.primaryBlockId!,
        reviewerId: innovation.authorId, // placeholder — PIC replaces on review
        decision: "PENDING",
      },
      update: {
        decision: "PENDING",
        reviewedAt: null,
      },
    });

    // Notify author that review has started
    await createNotification(innovation.authorId, {
      type: "SCREENING_PASSED",
      title: "Sáng kiến đang chờ duyệt",
      body: `Sáng kiến "${innovation.title}" đã vượt qua đánh giá AI (${finalScore.toFixed(1)} điểm) và đang chờ PIC khối ${innovation.primaryBlock.name} phê duyệt.`,
      innovationId,
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
  };
}
