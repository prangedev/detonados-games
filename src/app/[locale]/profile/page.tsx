import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { safeJsonParse } from "@/lib/utils";
import { getCurrentUser } from "@/lib/current-user";
import { getAvailablePoints } from "@/lib/points";
import { XpBar } from "@/components/xp-bar";
import { AchievementBadge } from "@/components/achievement-badge";
import { GameGrid } from "@/components/game-grid";
import type { RarityType, PlatformType } from "@/lib/constants";
import type { GameSummary } from "@/types";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const t = await getTranslations("profile");

  const [allAchievements, unlocked, availablePoints, saved] = await Promise.all([
    db.achievement.findMany(),
    db.userAchievement.findMany({ where: { userId: user.id }, select: { achievementId: true } }),
    getAvailablePoints(user.id),
    db.savedGame.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { game: true },
    }),
  ]);
  const unlockedIds = new Set(unlocked.map((u) => u.achievementId));

  const savedSummaries: GameSummary[] = saved.map((s) => ({
    id: s.game.id,
    slug: s.game.slug,
    title: s.game.title,
    coverImage: s.game.coverImage,
    platforms: safeJsonParse<PlatformType[]>(s.game.platforms, []),
    protonDbTier: s.game.protonDbTier,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t("title")}</h1>
        <p
          className="text-sm"
          style={{ color: user.nameColor ?? undefined }}
        >
          {user.name ?? user.email}
        </p>
      </div>

      <div className="rounded-xl border border-base-border bg-base-surface p-4">
        <XpBar xp={user.xp} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("achievements")} value={`${unlockedIds.size} / ${allAchievements.length}`} />
        <StatCard label={t("points")} value={String(availablePoints)} accent />
        <StatCard label={t("gamesSaved")} value={String(saved.length)} />
        <StatCard label={t("memberSince")} value={user.createdAt.toLocaleDateString()} />
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-ink">{t("savedGames")}</h2>
        {savedSummaries.length === 0 ? (
          <p className="text-sm text-ink-faint">{t("savedGamesEmpty")}</p>
        ) : (
          <GameGrid games={savedSummaries} />
        )}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-ink">{t("achievements")}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allAchievements.map((a) => (
            <AchievementBadge
              key={a.id}
              name={a.name}
              description={a.description}
              rarity={a.rarity as RarityType}
              xpReward={a.xpReward}
              unlocked={unlockedIds.has(a.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-base-border bg-base-surface p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">{label}</p>
      <p className={`mt-1 font-display text-lg font-bold ${accent ? "text-brand" : "text-ink"}`}>{value}</p>
    </div>
  );
}
