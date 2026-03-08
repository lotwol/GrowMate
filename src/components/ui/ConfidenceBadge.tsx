import { cn } from "@/lib/utils";

type ConfidenceLevel = "tidig" | "växande" | "tillförlitlig" | "stark" | null;

const LEVELS: Record<string, { emoji: string; label: string; className: string }> = {
  tidig: { emoji: "🌱", label: "Tidig data", className: "bg-muted text-muted-foreground" },
  växande: { emoji: "🌿", label: "Växande", className: "bg-green-100 text-green-700" },
  tillförlitlig: { emoji: "🌳", label: "Tillförlitlig", className: "bg-emerald-100 text-emerald-700" },
  stark: { emoji: "🏆", label: "Stark data", className: "bg-primary/15 text-primary" },
};

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  sampleCount?: number;
  showCount?: boolean;
}

export function ConfidenceBadge({ level, sampleCount, showCount }: ConfidenceBadgeProps) {
  const config = level ? LEVELS[level] : null;
  if (!config) return null;

  return (
    <span
      className={cn(
        "text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1",
        config.className
      )}
    >
      {config.emoji} {config.label}
      {showCount && sampleCount != null && ` · ${sampleCount} odlare`}
    </span>
  );
}
