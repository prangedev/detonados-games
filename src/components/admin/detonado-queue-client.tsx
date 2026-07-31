"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PLATFORMS, PLATFORM_LABELS, LOCALES, LOCALE_META, type PlatformType } from "@/lib/constants";
import { DETONADO_SOURCES } from "@/lib/detonado-sources";
import { cn } from "@/lib/utils";

interface SubmissionTranslation {
  locale: string;
  title: string;
  shortDescription: string;
  detonado: string;
}

interface Submission {
  id: string;
  gameTitle: string;
  platforms: string;
  sourceKey: string;
  sourceUrl: string;
  headerImage: string | null;
  rawExtract: string;
  status: string;
  translations: SubmissionTranslation[];
}

interface GameOption {
  id: string;
  title: string;
  slug: string;
}

const EMPTY_FORM = {
  gameTitle: "",
  platforms: ["PC"] as PlatformType[],
  sourceKey: DETONADO_SOURCES[0].key,
  sourceUrl: "",
  existingGameId: "",
};

export function DetonadoQueueClient() {
  const t = useTranslations("admin");
  const [form, setForm] = useState(EMPTY_FORM);
  const [games, setGames] = useState<GameOption[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [researching, setResearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadSubmissions() {
    setLoading(true);
    fetch("/api/admin/detonados")
      .then((res) => res.json())
      .then((data) => setSubmissions(data.submissions ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadSubmissions();
    fetch("/api/admin/games")
      .then((res) => res.json())
      .then((data) => setGames(data.games ?? []));
  }, []);

  function togglePlatform(platform: PlatformType) {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  }

  async function submitResearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResearching(true);
    try {
      const res = await fetch("/api/admin/detonados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameTitle: form.gameTitle,
          platforms: form.platforms,
          sourceKey: form.sourceKey,
          sourceUrl: form.sourceUrl,
          existingGameId: form.existingGameId || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? t("detonadosResearchError"));
        return;
      }
      setForm(EMPTY_FORM);
      loadSubmissions();
    } finally {
      setResearching(false);
    }
  }

  async function approve(id: string) {
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    const res = await fetch(`/api/admin/detonados/${id}/approve`, { method: "POST" });
    if (!res.ok) loadSubmissions();
  }

  async function reject(id: string, note: string) {
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    const res = await fetch(`/api/admin/detonados/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: note || undefined }),
    });
    if (!res.ok) loadSubmissions();
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">{t("detonadosTitle")}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t("detonadosSubtitle")}</p>
      </div>

      <form onSubmit={submitResearch} className="max-w-lg space-y-4 rounded-xl border border-base-border bg-base-surface p-4">
        <Field label={t("formGameTitle")}>
          <Input
            value={form.gameTitle}
            onChange={(e) => setForm((f) => ({ ...f, gameTitle: e.target.value }))}
            required
          />
        </Field>

        <Field label={t("formExistingGame")}>
          <select
            value={form.existingGameId}
            onChange={(e) => setForm((f) => ({ ...f, existingGameId: e.target.value }))}
            className="h-10 w-full rounded-lg border border-base-border bg-base-surface px-3 text-sm text-ink outline-none focus:border-brand"
          >
            <option value="">{t("formExistingGameNone")}</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
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
                  form.platforms.includes(platform) && "border-brand text-brand"
                )}
              >
                {PLATFORM_LABELS[platform]}
              </button>
            ))}
          </div>
        </Field>

        <Field label={t("formSource")}>
          <select
            value={form.sourceKey}
            onChange={(e) => setForm((f) => ({ ...f, sourceKey: e.target.value }))}
            className="h-10 w-full rounded-lg border border-base-border bg-base-surface px-3 text-sm text-ink outline-none focus:border-brand"
          >
            {DETONADO_SOURCES.map((source) => (
              <option key={source.key} value={source.key}>
                {source.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t("formSourceUrl")}>
          <Input
            type="url"
            placeholder="https://..."
            value={form.sourceUrl}
            onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))}
            required
          />
        </Field>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" disabled={researching}>
          {researching ? t("detonadosResearching") : t("researchButton")}
        </Button>
      </form>

      <div className="space-y-3">
        {!loading && submissions.length === 0 && (
          <p className="text-sm text-ink-faint">{t("detonadosEmpty")}</p>
        )}

        {submissions.map((submission) => (
          <SubmissionCard
            key={submission.id}
            submission={submission}
            onApprove={() => approve(submission.id)}
            onReject={(note) => reject(submission.id, note)}
          />
        ))}
      </div>
    </div>
  );
}

function SubmissionCard({
  submission,
  onApprove,
  onReject,
}: {
  submission: Submission;
  onApprove: () => void;
  onReject: (note: string) => void;
}) {
  const t = useTranslations("admin");
  const [rejectNote, setRejectNote] = useState("");
  const source = DETONADO_SOURCES.find((s) => s.key === submission.sourceKey);
  const ptBR = submission.translations.find((tr) => tr.locale === "pt-BR");
  const platforms: string[] = JSON.parse(submission.platforms || "[]");

  return (
    <div className="space-y-3 rounded-xl border border-base-border bg-base-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
            {t("sourceLabel")}:{" "}
            <a href={submission.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
              {source?.name ?? submission.sourceKey}
            </a>
          </p>
          <h3 className="mt-1 font-display font-bold text-ink">{submission.gameTitle}</h3>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {platforms.map((p) => (
              <Badge key={p}>{p}</Badge>
            ))}
          </div>
        </div>
        {submission.headerImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={submission.headerImage} alt="" className="h-16 w-28 rounded object-cover" />
        )}
      </div>

      {ptBR && (
        <div className="rounded-lg border border-base-border bg-base-raised p-3">
          <p className="text-sm text-ink-muted">{ptBR.shortDescription}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{ptBR.detonado}</p>
        </div>
      )}

      <details>
        <summary className="cursor-pointer font-mono text-xs uppercase tracking-wider text-ink-faint hover:text-brand">
          {t("viewTranslations")}
        </summary>
        <div className="mt-2 space-y-2">
          {LOCALES.filter((l) => l !== "pt-BR").map((locale) => {
            const tr = submission.translations.find((x) => x.locale === locale);
            if (!tr) return null;
            return (
              <div key={locale} className="rounded-lg border border-base-border bg-base-raised p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                  {LOCALE_META[locale].flag} {LOCALE_META[locale].label} — {tr.title}
                </p>
                <p className="mt-1 text-sm text-ink-muted">{tr.shortDescription}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{tr.detonado}</p>
              </div>
            );
          })}
        </div>
      </details>

      <details>
        <summary className="cursor-pointer font-mono text-xs uppercase tracking-wider text-ink-faint hover:text-brand">
          {t("viewOriginal")}
        </summary>
        <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-ink-faint">{submission.rawExtract}</p>
      </details>

      <div className="flex flex-wrap items-center gap-2 border-t border-base-border pt-3">
        <Button size="sm" onClick={onApprove}>
          {t("approve")}
        </Button>
        <Input
          placeholder={t("rejectNotePlaceholder")}
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          className="max-w-[240px]"
        />
        <Button variant="outline" size="sm" onClick={() => onReject(rejectNote)} className="hover:border-danger hover:text-danger">
          {t("reject")}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-faint">{label}</label>
      {children}
    </div>
  );
}
