import { computeLevelProgress } from "@/lib/xp";
import { cn } from "@/lib/utils";

const SEGMENTS = 20;

export function XpBar({ xp, className }: { xp: number; className?: string }) {
  const { level, currentLevelXp, xpToNextLevel, progressPercent } = computeLevelProgress(xp);
  const filledSegments = Math.round((progressPercent / 100) * SEGMENTS);

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex items-baseline justify-between font-mono text-xs">
        <span className="text-mint">LVL {String(level).padStart(2, "0")}</span>
        <span className="text-ink-muted">
          {currentLevelXp} / {xpToNextLevel} XP
        </span>
      </div>
      <div className="flex gap-[3px]">
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "hud-segment h-3 flex-1 transition-colors",
              i < filledSegments ? "bg-brand shadow-glow" : "bg-base-raised"
            )}
          />
        ))}
      </div>
    </div>
  );
}
