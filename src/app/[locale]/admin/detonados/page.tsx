import { redirect } from "next/navigation";
import { getCurrentUserRole } from "@/lib/current-user";
import { hasAtLeastRole } from "@/lib/roles";
import { DetonadoQueueClient } from "@/components/admin/detonado-queue-client";

export default async function AdminDetonadosPage() {
  const role = await getCurrentUserRole();
  if (!hasAtLeastRole(role, "MODERATOR")) redirect("/admin");

  return <DetonadoQueueClient />;
}
