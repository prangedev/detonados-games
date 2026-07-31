import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { safeJsonParse } from "@/lib/utils";
import { getCurrentUserId } from "@/lib/current-user";
import { grantAchievement } from "@/lib/achievements";
import { recordGameView } from "@/lib/recommendations";
import { Badge } from "@/components/ui/badge";
import { GamePlatformPanel } from "@/components/game-platform-panel";
import { CommentsSection } from "@/components/comments-section";
import { GameInteractions } from "@/components/game-interactions";
import { InterestTracker } from "@/components/interest-tracker";
import type { ParsedRequirements } from "@/lib/hardware-compat";
import type { MobileRequirements } from "@/lib/mobile-requirements";
import { PLATFORM_LABELS, type PlatformType } from "@/lib/constants";
import { getDetonadoSource } from "@/lib/detonado-sources";

const PROTON_TIER_COLORS: Record<string, string> = {
  native: "text-mint",
  platinum: "text-ink",
  gold: "text-warn",
  silver: "text-ink-muted",
  bronze: "text-brand",
  borked: "text-danger",
};

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations("game");

  const game = await db.game.findFirst({ where: { slug, releaseStatus: "PUBLISHED" } });
  if (!game) notFound();

  const userId = await getCurrentUserId();
  if (userId) {
    await grantAchievement(userId, "first-game-viewed");
    await recordGameView(userId, game.id);
  }

  // Conteúdo traduzido pelo pipeline de detonados (src/lib/detonado-pipeline.ts).
  // Sem tradução para o locale atual, cai nos campos base do jogo (jogos só
  // sincronizados da Steam continuam funcionando exatamente como antes).
  const translation = await db.gameTranslation.findUnique({
    where: { gameId_locale: { gameId: game.id, locale } },
  });
  const title = translation?.title || game.title;
  const shortDescription = translation?.shortDescription ?? game.shortDescription;
  const detonadoText = translation?.detonado ?? game.detonado;

  const approvedSubmission = await db.detonadoSubmission.findFirst({
    where: { gameId: game.id, status: "APPROVED" },
    orderBy: { reviewedAt: "desc" },
  });
  const source = approvedSubmission ? getDetonadoSource(approvedSubmission.sourceKey) : null;

  const platforms = safeJsonParse<PlatformType[]>(game.platforms, []);
  const genres = safeJsonParse<string[]>(game.genres, []);
  const minReq = safeJsonParse<ParsedRequirements | null>(game.minRequirements, null);
  const recReq = safeJsonParse<ParsedRequirements | null>(game.recRequirements, null);
  const mobileReq = safeJsonParse<MobileRequirements | null>(game.mobileRequirements, null);

  return (
    <div className="space-y-6">
      <div className="relative aspect-[460/215] w-full overflow-hidden rounded-xl border border-base-border bg-base-raised">
        {game.headerImage && (
          <>
            <Image
              src={game.headerImage}
              alt=""
              aria-hidden
              fill
              className="scale-110 object-cover opacity-40 blur-xl"
            />
            <Image src={game.headerImage} alt={title} fill className="object-contain" priority />
          </>
        )}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {platforms.map((p) => (
              <Badge key={p}>{PLATFORM_LABELS[p]}</Badge>
            ))}
            {genres.map((g) => (
              <Badge key={g}>{g}</Badge>
            ))}
          </div>
        </div>
        {game.protonDbTier && (
          <div className="rounded-lg border border-base-border bg-base-surface px-3 py-2 text-right">
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
              {t("protonCompat")}
            </p>
            <p className={`font-display text-sm font-bold uppercase ${PROTON_TIER_COLORS[game.protonDbTier] ?? "text-ink"}`}>
              {game.protonDbTier}
            </p>
          </div>
        )}
      </div>

      {shortDescription && <p className="text-sm text-ink-muted">{shortDescription}</p>}

      <GameInteractions gameId={game.id} />
      <InterestTracker genres={genres} />

      <GamePlatformPanel
        gameId={game.id}
        platforms={platforms}
        minRequirements={minReq}
        recRequirements={recReq}
        mobileRequirements={mobileReq}
      />

      <div>
        <h2 className="mb-2 font-display text-lg font-bold text-ink">{t("walkthrough")}</h2>
        <div className="whitespace-pre-wrap rounded-xl border border-base-border bg-base-surface p-4 text-sm leading-relaxed text-ink-muted">
          {detonadoText || t("noWalkthrough")}
        </div>
        {source && (
          <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
            {t("source")}:{" "}
            <a
              href={approvedSubmission!.sourceUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-brand hover:underline"
            >
              {source.name}
            </a>
          </p>
        )}
      </div>

      <CommentsSection gameId={game.id} />
    </div>
  );
}
