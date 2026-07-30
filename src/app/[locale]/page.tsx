import { getTranslations } from "next-intl/server";
import { safeJsonParse } from "@/lib/utils";
import { getCachedPublishedGames } from "@/lib/cache";
import { PlatformFilter } from "@/components/platform-filter";
import { GameGrid } from "@/components/game-grid";
import type { GameSummary } from "@/types";
import type { PlatformType } from "@/lib/constants";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; platform?: string }>;
}) {
  const { q, platform } = await searchParams;
  const t = await getTranslations("home");

  const games = await getCachedPublishedGames(q, 60);

  const summaries: GameSummary[] = games
    .map((g) => ({
      id: g.id,
      slug: g.slug,
      title: g.title,
      coverImage: g.coverImage,
      platforms: safeJsonParse<PlatformType[]>(g.platforms, []),
      protonDbTier: g.protonDbTier,
    }))
    .filter((g) => !platform || g.platforms.includes(platform as PlatformType));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t("title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
      </div>
      <PlatformFilter />
      <GameGrid games={summaries} />
    </div>
  );
}
