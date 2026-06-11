import { cn } from "@/lib/utils";

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  // Vietnamese names put the given name last — take the last two words.
  const picks = parts.length === 1 ? [parts[0]] : [parts[parts.length - 2], parts[parts.length - 1]];
  return picks.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export function Avatar({
  fullName,
  size = 36,
  className,
}: {
  fullName: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-light font-bold text-white",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      title={fullName}
    >
      {initials(fullName)}
    </div>
  );
}
