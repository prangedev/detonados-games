import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { safeJsonParse } from "@/lib/utils";
import { GameForm, type GameFormValues } from "@/components/admin/game-form";
import type { PlatformType } from "@/lib/constants";

export default async function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("admin");

  const game = await db.game.findUnique({ where: { id } });
  if (!game) notFound();

  const initial: GameFormValues = {
    id: game.id,
    title: game.title,
    slug: game.slug,
    shortDescription: game.shortDescription ?? "",
    detonado: game.detonado ?? "",
    headerImage: game.headerImage ?? "",
    genres: safeJsonParse<string[]>(game.genres, []).join(", "),
    platforms: safeJsonParse<PlatformType[]>(game.platforms, ["PC"]),
    releaseStatus: game.releaseStatus,
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold text-ink">{t("gamesEdit")}</h2>
      <GameForm initial={initial} />
    </div>
  );
}
