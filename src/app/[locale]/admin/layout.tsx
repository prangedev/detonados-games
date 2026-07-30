import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUserRole } from "@/lib/current-user";
import { hasAtLeastRole } from "@/lib/roles";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const role = await getCurrentUserRole();
  const t = await getTranslations("admin");

  if (!hasAtLeastRole(role, "MODERATOR")) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">{t("dashboardTitle")}</h1>
      <AdminNav isAdmin={hasAtLeastRole(role, "ADMIN")} />
      {children}
    </div>
  );
}
