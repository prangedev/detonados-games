import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { HardwareCheckClient } from "@/components/hardware-check-client";

export default async function HardwareCheckPage() {
  const t = await getTranslations("hardware");

  const games = await db.game.findMany({
    where: { releaseStatus: "PUBLISHED" },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t("title")}</h1>
        <p className="text-sm text-ink-muted">{t("subtitle")}</p>
      </div>
      <HardwareCheckClient games={games} />
    </div>
  );
}
