"use client";

import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function DeleteGameButton({
  gameId,
  confirmMessage,
  label,
}: {
  gameId: string;
  confirmMessage: string;
  label: string;
}) {
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm(confirmMessage)) return;
    await fetch(`/api/admin/games/${gameId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDelete} className="hover:border-danger hover:text-danger">
      {label}
    </Button>
  );
}
