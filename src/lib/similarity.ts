/**
 * Lightweight lexical similarity used to (a) prefilter candidates before the LLM
 * compare and (b) act as the no-API-key fallback. Vietnamese-friendly: keeps
 * diacritics, splits on whitespace/punctuation, drops very short tokens + common
 * stopwords so shared content words dominate the overlap.
 */

export interface SimilarInnovation {
  id: string;
  code: string;
  title: string;
  blockName: string;
  similarity: number; // 0–100
  reason: string;
}

export interface CandidateIdea {
  id: string;
  code: string;
  title: string;
  executiveSummary: string;
  painPoints: string;
  blockName: string;
}

export interface NewIdea {
  title: string;
  executiveSummary: string;
  painPoints: string;
}

const STOPWORDS = new Set([
  "và", "của", "cho", "các", "với", "được", "trong", "một", "những", "này", "đó",
  "khi", "để", "là", "có", "không", "đã", "sẽ", "tại", "theo", "vào", "ra", "từ",
  "the", "and", "for", "with", "này", "nên", "hơn", "vẫn", "đến", "ở", "về",
]);

export function tokenize(text: string): Set<string> {
  return new Set(
    (text || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
  );
}

/** Jaccard overlap of two token sets (0–1). */
export function overlapScore(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const t of a) if (b.has(t)) shared++;
  return shared / (a.size + b.size - shared);
}

function ideaText(i: { title: string; executiveSummary: string; painPoints: string }): string {
  return `${i.title} ${i.executiveSummary} ${i.painPoints}`;
}

export interface RankedCandidate extends CandidateIdea {
  lexical: number; // 0–1
}

/** Rank candidates by lexical overlap with the new idea; return the top N. */
export function prefilterCandidates(
  newIdea: NewIdea,
  candidates: CandidateIdea[],
  topN = 8
): RankedCandidate[] {
  const newTokens = tokenize(ideaText(newIdea));
  return candidates
    .map((c) => ({ ...c, lexical: overlapScore(newTokens, tokenize(ideaText(c))) }))
    .filter((c) => c.lexical > 0)
    .sort((a, b) => b.lexical - a.lexical)
    .slice(0, topN);
}

/**
 * Fallback (no LLM): turn lexical scores into similarity matches with a generic
 * reason listing the shared keywords.
 */
export function lexicalMatches(
  newIdea: NewIdea,
  ranked: RankedCandidate[],
  minLexical = 0.18,
  max = 5
): SimilarInnovation[] {
  const newTokens = tokenize(ideaText(newIdea));
  return ranked
    .filter((c) => c.lexical >= minLexical)
    .slice(0, max)
    .map((c) => {
      const shared = [...tokenize(ideaText(c))].filter((t) => newTokens.has(t)).slice(0, 5);
      return {
        id: c.id,
        code: c.code,
        title: c.title,
        blockName: c.blockName,
        similarity: Math.round(c.lexical * 100),
        reason: shared.length ? `Trùng nhiều từ khóa: ${shared.join(", ")}.` : "Nội dung có nhiều điểm tương đồng.",
      };
    });
}
