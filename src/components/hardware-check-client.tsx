"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { HardwareCheckForm } from "@/components/hardware-check-form";

export function HardwareCheckClient({ games }: { games: { id: string; title: string }[] }) {
  const t = useTranslations("hardware");
  const [gameId, setGameId] = useState(games[0]?.id ?? "");

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div>
        <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-faint">
          {t("selectGame")}
        </label>
        <select
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          className="h-10 w-full rounded-lg border border-base-border bg-base-surface px-3 text-sm text-ink outline-none focus:border-brand"
        >
          {games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
      </div>
      {gameId && <HardwareCheckForm gameId={gameId} />}
    </div>
  );
}
