import Link from "next/link";
import { GitCompareArrows } from "lucide-react";

export interface SimilarInnovation {
  id: string;
  code: string;
  title: string;
  blockName: string;
  similarity: number;
  reason: string;
}

/** Safely parse the JSON stored in InnovationScreening.similarInnovations. */
export function parseSimilar(raw: string | null | undefined): SimilarInnovation[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s) => s && typeof s.id === "string" && typeof s.title === "string" && typeof s.similarity === "number"
    );
  } catch {
    return [];
  }
}

function tone(similarity: number): string {
  if (similarity >= 80) return "text-red-500 bg-red-500/10";
  if (similarity >= 65) return "text-amber-500 bg-amber-500/10";
  return "text-blue-500 bg-blue-500/10";
}

export function SimilarInnovations({
  items,
  className,
}: {
  items: SimilarInnovation[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className={className}>
      <p className="text-sm text-text-secondary mb-3">
        Đã có sáng kiến tương tự — bạn có thể tham khảo hoặc phối hợp thay vì làm trùng:
      </p>
      <ul className="space-y-2.5">
        {items.map((s) => (
          <li key={s.id}>
            <Link
              href={`/innovations/${s.id}`}
              className="block rounded-lg border border-border p-3 hover:border-brand/40 hover:bg-surface-alt/60 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <GitCompareArrows size={14} className="flex-shrink-0 text-text-muted" />
                <span className="text-xs font-mono text-brand">{s.code}</span>
                {s.blockName && <span className="text-[11px] text-text-muted">· {s.blockName}</span>}
                <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold ${tone(s.similarity)}`}>
                  {s.similarity}% giống
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-text-primary group-hover:text-brand transition-colors line-clamp-1">
                {s.title}
              </p>
              {s.reason && <p className="mt-0.5 text-xs text-text-muted line-clamp-2">{s.reason}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
