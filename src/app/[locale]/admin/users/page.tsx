import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getCurrentUserRole } from "@/lib/current-user";
import { hasAtLeastRole } from "@/lib/roles";
import { RoleSelect } from "@/components/admin/role-select";

export default async function AdminUsersPage() {
  const role = await getCurrentUserRole();
  if (!hasAtLeastRole(role, "ADMIN")) redirect("/admin");

  const t = await getTranslations("admin");

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, name: true, email: true, role: true, xp: true, level: true },
  });

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold text-ink">{t("usersTitle")}</h2>

      <div className="overflow-hidden rounded-xl border border-base-border bg-base-surface">
        <table className="w-full text-sm">
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-base-border/50 last:border-none">
                <td className="px-3 py-2.5 text-ink">{user.name ?? user.email}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs text-ink-muted">
                  Lvl {user.level} · {user.xp} XP
                </td>
                <td className="px-3 py-2.5 text-right">
                  <RoleSelect userId={user.id} currentRole={user.role} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
