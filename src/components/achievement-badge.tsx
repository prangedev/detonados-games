import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { RarityType } from "@/lib/constants";

const RARITY_STYLES: Record<RarityType, string> = {
  COMUM: "border-rarity-comum/40 text-rarity-comum",
  RARA: "border-rarity-rara/50 text-rarity-rara shadow-[0_0_16px_rgba(77,156,255,0.2)]",
  EPICA: "border-rarity-epica/50 text-rarity-epica shadow-[0_0_16px_rgba(181,98,255,0.25)]",
  LENDARIA: "border-rarity-lendaria/60 text-rarity-lendaria shadow-[0_0_20px_rgba(255,184,77,0.35)]",
};

export function AchievementBadge({
  name,
  description,
  rarity,
  xpReward,
  unlocked = true,
}: {
  name: string;
  description: string;
  rarity: RarityType;
  xpReward: number;
  unlocked?: boolean;
}) {
  const t = useTranslations("rarity");

  return (
    <div
      className={cn(
        "hud-segment flex flex-col gap-1 border bg-base-raised p-3",
        RARITY_STYLES[rarity],
        !unlocked && "opacity-35 grayscale"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-semibold text-ink">{name}</span>
        <span className="font-mono text-[10px] uppercase tracking-wider">{t(rarity)}</span>
      </div>
      <p className="text-xs text-ink-muted">{description}</p>
      <span className="font-mono text-[11px] text-mint">+{xpReward} XP</span>
    </div>
  );
}
