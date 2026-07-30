import { getTranslations } from "next-intl/server";
import { getCachedLeaderboard } from "@/lib/cache";
import { cn } from "@/lib/utils";

export default async function LeaderboardPage() {
  const t = await getTranslations("leaderboard");

  const users = await getCachedLeaderboard(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t("title")}</h1>
        <p className="text-sm text-ink-muted">{t("subtitle")}</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-base-border bg-base-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-base-border bg-base-raised font-mono text-[11px] uppercase tracking-wider text-ink-faint">
              <th className="px-3 py-2 text-left">{t("rank")}</th>
              <th className="px-3 py-2 text-left">{t("player")}</th>
              <th className="px-3 py-2 text-right">{t("level")}</th>
              <th className="px-3 py-2 text-right">{t("xp")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr
                key={u.id}
                className={cn(
                  "border-b border-base-border/50 last:border-none",
                  i < 3 && "bg-brand/5"
                )}
              >
                <td className="px-3 py-2 font-mono text-ink-muted">#{i + 1}</td>
                <td className="px-3 py-2">
                  <span
                    className={cn("text-ink", u.equippedFrame && "rounded-full border px-2 py-0.5")}
                    style={{
                      color: u.nameColor ?? undefined,
                      borderColor: u.equippedFrame ?? undefined,
                    }}
                  >
                    {u.name ?? u.email}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono text-mint">{u.level}</td>
                <td className="px-3 py-2 text-right font-mono text-ink">{u.xp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
