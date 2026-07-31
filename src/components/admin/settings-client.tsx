"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Settings {
  themeAccent: string;
  shiftHours: { MORNING: number; AFTERNOON: number; EVENING: number };
  resendKeyConfigured: boolean;
  vapidConfigured: boolean;
  geminiKeyConfigured: boolean;
}

export function SettingsClient() {
  const t = useTranslations("admin");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [resendApiKey, setResendApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then(setSettings);
  }, []);

  async function save() {
    if (!settings) return;
    setSaved(false);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        themeAccent: settings.themeAccent,
        shiftHours: settings.shiftHours,
        resendApiKey: resendApiKey || undefined,
        geminiApiKey: geminiApiKey || undefined,
      }),
    });
    if (res.ok) setSaved(true);
  }

  if (!settings) return null;

  return (
    <div className="max-w-lg space-y-8">
      <h2 className="font-display text-lg font-bold text-ink">{t("settingsTitle")}</h2>

      <section className="space-y-2">
        <h3 className="font-mono text-xs uppercase tracking-wider text-ink-faint">{t("settingsThemeAccent")}</h3>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={settings.themeAccent}
            onChange={(e) => setSettings({ ...settings, themeAccent: e.target.value })}
            className="h-10 w-14 cursor-pointer rounded border border-base-border bg-base-surface"
          />
          <Input
            value={settings.themeAccent}
            onChange={(e) => setSettings({ ...settings, themeAccent: e.target.value })}
            className="max-w-[140px]"
          />
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-mono text-xs uppercase tracking-wider text-ink-faint">{t("settingsSchedule")}</h3>
        <div className="grid grid-cols-3 gap-2">
          <ShiftInput
            label={t("settingsMorning")}
            value={settings.shiftHours.MORNING}
            onChange={(v) => setSettings({ ...settings, shiftHours: { ...settings.shiftHours, MORNING: v } })}
          />
          <ShiftInput
            label={t("settingsAfternoon")}
            value={settings.shiftHours.AFTERNOON}
            onChange={(v) => setSettings({ ...settings, shiftHours: { ...settings.shiftHours, AFTERNOON: v } })}
          />
          <ShiftInput
            label={t("settingsEvening")}
            value={settings.shiftHours.EVENING}
            onChange={(v) => setSettings({ ...settings, shiftHours: { ...settings.shiftHours, EVENING: v } })}
          />
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-mono text-xs uppercase tracking-wider text-ink-faint">{t("settingsApi")}</h3>
        <div>
          <label className="mb-1 block text-xs text-ink-muted">
            {t("settingsResendKey")} {settings.resendKeyConfigured ? "✓" : ""}
          </label>
          <Input
            type="password"
            placeholder="re_********************************"
            value={resendApiKey}
            onChange={(e) => setResendApiKey(e.target.value)}
          />
        </div>
        <p className="font-mono text-[11px] leading-relaxed text-ink-faint">
          {t("settingsVapidInfo")} {settings.vapidConfigured ? "✓" : "✗"}
        </p>
        <div>
          <label className="mb-1 block text-xs text-ink-muted">
            {t("settingsGeminiKey")} {settings.geminiKeyConfigured ? "✓" : ""}
          </label>
          <Input
            type="password"
            placeholder="AIza********************************"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
          />
          <p className="mt-1 font-mono text-[11px] leading-relaxed text-ink-faint">
            {t("settingsGeminiKeyHint")}
          </p>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-mono text-xs uppercase tracking-wider text-ink-faint">{t("settingsDatabase")}</h3>
        <p className="text-xs text-ink-muted">{t("settingsDatabaseHint")}</p>
        <code className="block rounded-lg border border-base-border bg-base-raised p-2 font-mono text-xs text-mint">
          npm run db:studio
        </code>
      </section>

      <div className="flex items-center gap-3">
        <Button onClick={save}>{t("formSave")}</Button>
        {saved && <span className="text-xs text-mint">{t("settingsSaved")}</span>}
      </div>
    </div>
  );
}

function ShiftInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-ink-muted">{label}</label>
      <Input
        type="number"
        min={0}
        max={23}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
