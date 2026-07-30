import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentUserRole } from "@/lib/current-user";
import { hasAtLeastRole } from "@/lib/roles";
import { DeleteGameButton } from "@/components/admin/delete-game-button";

export default async function AdminGamesPage() {
  const t = await getTranslations("admin");
  const role = await getCurrentUserRole();
  const isAdmin = hasAtLeastRole(role, "ADMIN");

  const games = await db.game.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-ink">{t("gamesTitle")}</h2>
        {isAdmin && (
          <Link href="/admin/games/new">
            <Button size="sm">{t("gamesNew")}</Button>
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-base-border bg-base-surface">
        <table className="w-full text-sm">
          <tbody>
            {games.map((game) => (
              <tr key={game.id} className="border-b border-base-border/50 last:border-none">
                <td className="px-3 py-2.5 text-ink">{game.title}</td>
                <td className="px-3 py-2.5">
                  <Badge>{game.releaseStatus}</Badge>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/games/${game.id}/edit`}>
                      <Button variant="outline" size="sm">
                        {t("gamesEdit")}
                      </Button>
                    </Link>
                    {isAdmin && <DeleteGameButton gameId={game.id} confirmMessage={t("gamesDeleteConfirm")} label={t("gamesDelete")} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
