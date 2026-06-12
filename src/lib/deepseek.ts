import type { ScreeningResult } from "./scoring";
import type { FrameworkCriterion } from "@prisma/client";

interface FrameworkData {
  name: string;
  formula: string;
  criteria: (Pick<FrameworkCriterion, "name" | "description" | "weight"> & { minScore: number; maxScore: number })[];
}

interface InnovationData {
  code: string;
  title: string;
  executiveSummary: string;
  painPoints: string;
  detailedSolution: string | null;
  primaryBlockName: string;
  isBankWide: boolean;
}

export interface LLMScreeningResult {
  result: ScreeningResult;
  usage: { promptTokens: number; completionTokens: number };
}

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

function buildScoringPrompt(innovation: InnovationData, framework: FrameworkData): string {
  const criteriaList = framework.criteria
    .map((c, i) => `${i + 1}. **${c.name}** (thang ${c.minScore}-${c.maxScore}): ${c.description}`)
    .join("\n");

  return `Bạn là Chuyên gia Thẩm định Độc lập của Ngân hàng. Nhiệm vụ của bạn là đánh giá một sáng kiến đổi mới sáng tạo dựa trên bộ tiêu chí đã cho.

**Framework áp dụng:** ${framework.name}
**Công thức tính tổng:** ${framework.formula}

**Thông tin sáng kiến:**
- Mã: ${innovation.code}
- Tiêu đề: ${innovation.title}
- Khối thụ hưởng chính: ${innovation.primaryBlockName}
- Phạm vi: ${innovation.isBankWide ? "Toàn ngân hàng" : "Theo khối"}
- Tóm tắt giải pháp: ${innovation.executiveSummary}
- Thực trạng & Nỗi đau: ${innovation.painPoints}
- Giải pháp chi tiết: ${innovation.detailedSolution || "Không có"}

**Danh mục tiêu chí cần chấm điểm:**
${criteriaList}

**Yêu cầu:**
1. Với mỗi tiêu chí, cho điểm trong thang điểm quy định.
2. Viết một đoạn reasoning (1-3 câu) giải thích lý do cho mức điểm đó.
3. Đặt câu hỏi gợi mở ("improvement_questions"): với 3-5 tiêu chí ĐIỂM THẤP NHẤT, mỗi tiêu chí một câu hỏi mở giúp tác giả tự nhận ra điểm cần cải thiện và nâng điểm tiêu chí đó.
   - QUAN TRỌNG: KHÔNG nêu trực tiếp lỗi của sáng kiến và KHÔNG đưa ra cách sửa cụ thể. Chỉ đặt câu hỏi mở (dạng "Bạn đã...?", "Có dữ liệu nào...?", "Làm thế nào để...?") để tác giả tự suy ngẫm.
   - Mỗi câu hỏi gắn với một tiêu chí cụ thể (trường "criterion" trùng tên tiêu chí ở trên).
4. Trả về kết quả dưới dạng JSON sạch theo định dạng sau (chỉ trả về JSON, không kèm text khác):

{
  "proposal_id": "${innovation.code}",
  "applied_framework": "${framework.name}",
  "criteria_scores": [
    { "criterion": "Tên tiêu chí", "score": số, "reasoning": "Giải thích" }
  ],
  "final_normalised_score": số_từ_0_đến_100,
  "improvement_questions": [
    { "criterion": "Tên tiêu chí", "question": "Câu hỏi gợi mở bằng tiếng Việt" }
  ]
}

Lưu ý: final_normalised_score phải nằm trong khoảng 0-100. improvement_questions là câu hỏi, KHÔNG phải lời nhận xét hay hướng dẫn sửa.`;
}

export async function runLLMScreening(
  innovation: InnovationData,
  framework: FrameworkData,
  apiKey: string
): Promise<LLMScreeningResult> {
  const prompt = buildScoringPrompt(innovation, framework);

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-v4-pro",
      messages: [
        { role: "system", content: "Bạn là chuyên gia thẩm định sáng kiến ngân hàng. Chỉ trả về JSON hợp lệ, không kèm text khác." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content in DeepSeek response");

  const usage = {
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0,
  };

  try {
    const result: ScreeningResult = JSON.parse(content);
    result.final_normalised_score = Math.min(100, Math.max(0, result.final_normalised_score));
    // Keep only well-formed { criterion, question } items.
    if (Array.isArray(result.improvement_questions)) {
      result.improvement_questions = result.improvement_questions
        .filter((q) => q && typeof q.criterion === "string" && typeof q.question === "string" && q.question.trim())
        .map((q) => ({ criterion: q.criterion.trim() || "Tổng quan", question: q.question.trim() }))
        .slice(0, 6);
    } else {
      result.improvement_questions = undefined;
    }
    return { result, usage };
  } catch {
    throw new Error("Failed to parse LLM JSON response");
  }
}
