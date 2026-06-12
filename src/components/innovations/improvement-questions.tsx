import { HelpCircle } from "lucide-react";

export interface ImprovementQuestion {
  criterion: string;
  question: string;
}

/** Safely parse the JSON stored in InnovationScreening.improvementQuestions. */
export function parseQuestions(raw: string | null | undefined): ImprovementQuestion[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (q) => q && typeof q.criterion === "string" && typeof q.question === "string"
    );
  } catch {
    return [];
  }
}

/** Renders Socratic improvement questions, grouped by the criterion they probe. */
export function ImprovementQuestions({
  questions,
  className,
}: {
  questions: ImprovementQuestion[];
  className?: string;
}) {
  if (questions.length === 0) return null;

  return (
    <div className={className}>
      <p className="text-sm text-text-secondary mb-3">
        Hãy tự trả lời các câu hỏi sau để biết nên hoàn thiện sáng kiến ở đâu:
      </p>
      <ul className="space-y-3">
        {questions.map((q, i) => (
          <li key={i} className="flex items-start gap-3">
            <HelpCircle size={16} className="mt-0.5 flex-shrink-0 text-brand" />
            <div className="min-w-0">
              <span className="inline-block rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                {q.criterion}
              </span>
              <p className="mt-1 text-sm text-text-primary">{q.question}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
