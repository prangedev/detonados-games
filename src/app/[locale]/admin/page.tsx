import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin");

  const [userCount, gameCount, commentCount, notificationCount] = await Promise.all([
    db.user.count(),
    db.game.count({ where: { releaseStatus: "PUBLISHED" } }),
    db.comment.count({ where: { hidden: false } }),
    db.notification.count(),
  ]);

  const stats = [
    { label: t("statUsers"), value: userCount },
    { label: t("statGames"), value: gameCount },
    { label: t("statComments"), value: commentCount },
    { label: t("statNotifications"), value: notificationCount },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-base-border bg-base-surface p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">{stat.label}</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
