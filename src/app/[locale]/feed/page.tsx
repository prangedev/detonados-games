import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { safeJsonParse } from "@/lib/utils";
import { getCurrentUserId } from "@/lib/current-user";
import {
  getRecommendedGames,
  getRecommendedGamesFromInterests,
  parseInterestCookie,
} from "@/lib/recommendations";
import { getCachedRecentGames } from "@/lib/cache";
import { GameGrid } from "@/components/game-grid";
import type { GameSummary } from "@/types";
import type { PlatformType } from "@/lib/constants";

function toSummary(game: {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  platforms: string;
  protonDbTier: string | null;
}): GameSummary {
  return {
    id: game.id,
    slug: game.slug,
    title: game.title,
    coverImage: game.coverImage,
    platforms: safeJsonParse<PlatformType[]>(game.platforms, []),
    protonDbTier: game.protonDbTier,
  };
}

export default async function FeedPage() {
  const t = await getTranslations("feed");
  const userId = await getCurrentUserId();

  const recent = await getCachedRecentGames(20);

  // Usuário logado: recomendação combina histórico real (visualizações,
  // curtidas, salvos) no banco. Visitante anônimo: usa o cookie de
  // interesses por gênero (veja src/components/interest-tracker.tsx).
  let recommended: Awaited<ReturnType<typeof getRecommendedGames>> = [];
  let usingCookieFallback = false;

  if (userId) {
    recommended = await getRecommendedGames(userId);
  } else {
    const cookieStore = await cookies();
    const interests = parseInterestCookie(cookieStore.get("dg_interests")?.value);
    if (Object.keys(interests).length > 0) {
      recommended = await getRecommendedGamesFromInterests(interests);
      usingCookieFallback = true;
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t("title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-ink">{t("recommended")}</h2>
        {recommended.length === 0 ? (
          <p className="text-sm text-ink-faint">
            {userId || usingCookieFallback ? t("recommendedEmpty") : t("loginForRecommendations")}
          </p>
        ) : (
          <GameGrid games={recommended.map(toSummary)} />
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-ink">{t("recent")}</h2>
        <GameGrid games={recent.map(toSummary)} />
      </section>
    </div>
  );
}
