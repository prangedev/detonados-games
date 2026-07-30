import { redirect } from "next/navigation";
import { getCurrentUserRole } from "@/lib/current-user";
import { hasAtLeastRole } from "@/lib/roles";
import { SettingsClient } from "@/components/admin/settings-client";

export default async function AdminSettingsPage() {
  const role = await getCurrentUserRole();
  if (!hasAtLeastRole(role, "ADMIN")) redirect("/admin");

  return <SettingsClient />;
}
