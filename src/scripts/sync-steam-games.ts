import { db } from "@/lib/db";
import { fetchPopularSteamAppIds, fetchSteamAppDetails } from "@/lib/steam";
import { fetchProtonDbTier } from "@/lib/protondb";
import { parseHtmlRequirements } from "@/lib/hardware-compat";
import { scheduleUpcomingGames } from "@/lib/scheduling";
import { slugify } from "@/lib/utils";

export async function syncSteamGames(limit = 10) {
  const appIds = await fetchPopularSteamAppIds(limit);
  const synced: string[] = [];

  for (const appId of appIds) {
    const existing = await db.game.findUnique({ where: { steamAppId: appId } });
    if (existing) continue; // já temos esse jogo, não duplica nem re-agenda

    const details = await fetchSteamAppDetails(appId);
    if (!details) continue;

    const tier = await fetchProtonDbTier(appId);
    const min = details.pc_requirements?.minimum
      ? parseHtmlRequirements(details.pc_requirements.minimum)
      : null;
    const rec = details.pc_requirements?.recommended
      ? parseHtmlRequirements(details.pc_requirements.recommended)
      : null;

    const game = await db.game.create({
      data: {
        steamAppId: appId,
        slug: `${slugify(details.name)}-${appId}`,
        title: details.name,
        headerImage: details.header_image,
        coverImage: details.header_image,
        shortDescription: details.short_description?.slice(0, 500),
        genres: JSON.stringify((details.genres ?? []).map((g) => g.description)),
        platforms: JSON.stringify(["PC"]),
        minRequirements: min ? JSON.stringify(min) : null,
        recRequirements: rec ? JSON.stringify(rec) : null,
        protonDbTier: tier,
        releaseStatus: "DRAFT",
      },
    });

    synced.push(game.slug);
    // Pequeno intervalo pra não martelar as APIs públicas.
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  const scheduleResult = await scheduleUpcomingGames();

  return { synced: synced.length, scheduled: scheduleResult.scheduled };
}

// Permite rodar via `npm run sync:steam`
if (require.main === module) {
  syncSteamGames()
    .then((result) => {
      console.log("Sincronização concluída:", result);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Falha na sincronização:", err);
      process.exit(1);
    });
}
