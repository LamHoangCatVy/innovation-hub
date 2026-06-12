import type { CriterionScoreResult, ImprovementQuestion } from "@/lib/scoring";

/**
 * Probing-question bank for the rule-based fallback (used when the LLM path is
 * unavailable). One open, Socratic question per known criterion — phrased to make
 * the author reflect, never stating the flaw or the fix directly.
 */
const CRITERION_QUESTIONS: Record<string, string> = {
  Reach: "Sáng kiến này phục vụ bao nhiêu khách hàng/nhân sự, và bạn đã ước lượng con số đó dựa trên cơ sở nào?",
  Impact: "Nếu triển khai thành công, chỉ số tài chính nào (doanh thu, NIM, CASA…) sẽ thay đổi, và thay đổi khoảng bao nhiêu?",
  Confidence: "Bạn có dữ liệu, kết quả thử nghiệm (pilot) hay khảo sát nào để chứng minh giả định của mình là đáng tin cậy không?",
  Effort: "Cần những nguồn lực, hệ thống và thời gian nào để triển khai, và đâu là phần khó/rủi ro nhất?",
  "Time Saving": "Quy trình hiện tại mất bao lâu, và sáng kiến rút ngắn được bao nhiêu thời gian (SLA/TAT) một cách cụ thể?",
  "Cost Reduction": "Khoản chi phí nào sẽ được cắt giảm, và bạn ước tính tiết kiệm được bao nhiêu mỗi năm?",
  "Employee Experience": "Tác vụ thủ công hoặc lặp lại nào của nhân viên sẽ được giảm tải, và mức độ giảm tải ra sao?",
  "OpRisk Mitigation": "Sáng kiến giúp loại bỏ loại lỗi hay rủi ro gian lận nào, và hiện chúng đang gây hậu quả gì?",
  Compliance: "Sáng kiến liên quan đến thông tư/quy định nào của NHNN, và đã đáp ứng các yêu cầu tuân thủ ra sao?",
};

function questionFor(criterion: string): string {
  return (
    CRITERION_QUESTIONS[criterion] ||
    `Bạn có thể bổ sung thông tin hoặc dẫn chứng cụ thể nào để làm rõ tiêu chí "${criterion}" hơn không?`
  );
}

/**
 * Pick the weakest criteria (lowest score/maxScore ratio) and return one guiding
 * question each, grouped by criterion. Falls back gracefully for any criterion.
 */
export function buildQuestions(
  scores: CriterionScoreResult[],
  criteria: { name: string; maxScore: number }[],
  max = 4
): ImprovementQuestion[] {
  const maxByName = new Map(criteria.map((c) => [c.name, c.maxScore || 5]));
  const ranked = [...scores]
    .map((s) => ({ name: s.criterion, ratio: s.score / (maxByName.get(s.criterion) ?? 5) }))
    .sort((a, b) => a.ratio - b.ratio);

  // Prefer clearly-weak criteria (< 0.7); if none, take the lowest few anyway.
  const weak = ranked.filter((r) => r.ratio < 0.7);
  const picked = (weak.length ? weak : ranked).slice(0, max);

  return picked.map((r) => ({ criterion: r.name, question: questionFor(r.name) }));
}
