import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUserRole } from "@/lib/current-user";
import { hasAtLeastRole } from "@/lib/roles";
import { GameForm } from "@/components/admin/game-form";

export default async function NewGamePage() {
  const role = await getCurrentUserRole();
  if (!hasAtLeastRole(role, "ADMIN")) redirect("/admin/games");

  const t = await getTranslations("admin");

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold text-ink">{t("gamesNew")}</h2>
      <GameForm />
    </div>
  );
}
