import { useTranslations } from "next-intl";
import { GameCard } from "@/components/game-card";
import type { GameSummary } from "@/types";

export function GameGrid({ games }: { games: GameSummary[] }) {
  const t = useTranslations("home");

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-base-border py-16 text-center">
        <p className="font-mono text-sm text-ink-faint">{t("noResults")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {games.map((game) => (
        <GameCard
          key={game.id}
          slug={game.slug}
          title={game.title}
          coverImage={game.coverImage}
          platforms={game.platforms}
        />
      ))}
    </div>
  );
}
