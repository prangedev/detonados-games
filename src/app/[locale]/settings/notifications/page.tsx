"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PushSubscribeButton } from "@/components/push-subscribe-button";

interface Prefs {
  inApp: boolean;
  email: boolean;
  push: boolean;
  newGames: boolean;
  achievements: boolean;
  levelUp: boolean;
}

const DEFAULT_PREFS: Prefs = {
  inApp: true,
  email: true,
  push: false,
  newGames: true,
  achievements: true,
  levelUp: true,
};

export default function NotificationSettingsPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/notifications/preferences")
      .then((res) => res.json())
      .then((data) => data && setPrefs({ ...DEFAULT_PREFS, ...data }))
      .catch(() => {});
  }, []);

  function toggle(key: keyof Prefs) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  }

  async function save() {
    await fetch("/api/notifications/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
    setSaved(true);
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <h1 className="font-display text-2xl font-bold text-ink">{t("notificationsTitle")}</h1>

      <section className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-ink-faint">{t("channels")}</h2>
        <ToggleRow label={t("inApp")} checked={prefs.inApp} onChange={() => toggle("inApp")} />
        <ToggleRow label={t("email")} checked={prefs.email} onChange={() => toggle("email")} />
        <ToggleRow label={t("push")} checked={prefs.push} onChange={() => toggle("push")} />
        <PushSubscribeButton />
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-ink-faint">{t("types")}</h2>
        <ToggleRow label={t("newGames")} checked={prefs.newGames} onChange={() => toggle("newGames")} />
        <ToggleRow
          label={t("achievements")}
          checked={prefs.achievements}
          onChange={() => toggle("achievements")}
        />
        <ToggleRow label={t("levelUp")} checked={prefs.levelUp} onChange={() => toggle("levelUp")} />
      </section>

      <div className="flex items-center gap-3">
        <Button onClick={save}>{tc("save")}</Button>
        {saved && <span className="text-xs text-mint">{t("saved")}</span>}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-base-border bg-base-surface px-3 py-2.5">
      <span className="text-sm text-ink">{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-brand" />
    </label>
  );
}
