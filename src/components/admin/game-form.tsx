"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PLATFORMS, PLATFORM_LABELS, type PlatformType } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface GameFormValues {
  id?: string;
  title: string;
  slug: string;
  shortDescription: string;
  detonado: string;
  headerImage: string;
  genres: string;
  platforms: PlatformType[];
  releaseStatus: string;
}

const EMPTY_VALUES: GameFormValues = {
  title: "",
  slug: "",
  shortDescription: "",
  detonado: "",
  headerImage: "",
  genres: "",
  platforms: ["PC"],
  releaseStatus: "PUBLISHED",
};

export function GameForm({ initial }: { initial?: GameFormValues }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [values, setValues] = useState<GameFormValues>(initial ?? EMPTY_VALUES);
  const [saving, setSaving] = useState(false);

  function togglePlatform(platform: PlatformType) {
    setValues((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = Boolean(values.id);
      const res = await fetch(isEdit ? `/api/admin/games/${values.id}` : "/api/admin/games", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        router.push("/admin/games");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label={t("formTitle")}>
        <Input
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          required
        />
      </Field>

      <Field label={t("formSlug")}>
        <Input
          value={values.slug}
          onChange={(e) => setValues((v) => ({ ...v, slug: e.target.value }))}
          required
        />
      </Field>

      <Field label={t("formDescription")}>
        <Input
          value={values.shortDescription}
          onChange={(e) => setValues((v) => ({ ...v, shortDescription: e.target.value }))}
        />
      </Field>

      <Field label={t("formHeaderImage")}>
        <Input
          value={values.headerImage}
          onChange={(e) => setValues((v) => ({ ...v, headerImage: e.target.value }))}
          placeholder="https://..."
        />
      </Field>

      <Field label={t("formGenres")}>
        <Input
          value={values.genres}
          onChange={(e) => setValues((v) => ({ ...v, genres: e.target.value }))}
          placeholder="Ação, Aventura, Indie"
        />
      </Field>

      <Field label={t("formPlatforms")}>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((platform) => (
            <button
              type="button"
              key={platform}
              onClick={() => togglePlatform(platform)}
              className={cn(
                "rounded-full border border-base-border bg-base-surface px-3 py-1 font-mono text-xs uppercase tracking-wider text-ink-muted transition-colors",
                values.platforms.includes(platform) && "border-brand text-brand"
              )}
            >
              {PLATFORM_LABELS[platform]}
            </button>
          ))}
        </div>
      </Field>

      <Field label={t("formDetonado")}>
        <textarea
          value={values.detonado}
          onChange={(e) => setValues((v) => ({ ...v, detonado: e.target.value }))}
          rows={8}
          className="w-full rounded-lg border border-base-border bg-base-surface p-3 text-sm text-ink outline-none focus:border-brand"
        />
      </Field>

      <Field label="Status">
        <select
          value={values.releaseStatus}
          onChange={(e) => setValues((v) => ({ ...v, releaseStatus: e.target.value }))}
          className="h-10 rounded-lg border border-base-border bg-base-surface px-3 text-sm text-ink outline-none focus:border-brand"
        >
          <option value="DRAFT">DRAFT</option>
          <option value="SCHEDULED">SCHEDULED</option>
          <option value="PUBLISHED">PUBLISHED</option>
        </select>
      </Field>

      <Button type="submit" disabled={saving}>
        {t("formSave")}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-faint">
        {label}
      </label>
      {children}
    </div>
  );
}
