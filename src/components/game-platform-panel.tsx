"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Monitor, Smartphone, Gamepad2, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORM_LABELS, type PlatformType } from "@/lib/constants";
import type { ParsedRequirements } from "@/lib/hardware-compat";
import type { MobileRequirements } from "@/lib/mobile-requirements";
import { RequirementsTable } from "@/components/requirements-table";
import { HardwareCheckForm } from "@/components/hardware-check-form";

function platformIcon(platform: PlatformType) {
  if (platform === "PC") return Monitor;
  if (platform === "MOBILE") return Smartphone;
  return Gamepad2;
}

export function GamePlatformPanel({
  gameId,
  platforms,
  minRequirements,
  recRequirements,
  mobileRequirements,
}: {
  gameId: string;
  platforms: PlatformType[];
  minRequirements: ParsedRequirements | null;
  recRequirements: ParsedRequirements | null;
  mobileRequirements: MobileRequirements | null;
}) {
  const t = useTranslations("game");

  const singlePlatform = platforms.length === 1 ? platforms[0] : null;
  const [selected, setSelected] = useState<PlatformType | null>(singlePlatform);
  const [modalOpen, setModalOpen] = useState(platforms.length > 1);
  const [showHardwareCheck, setShowHardwareCheck] = useState(false);

  function choose(platform: PlatformType) {
    setSelected(platform);
    setModalOpen(false);
  }

  const labels = {
    os: t("os"),
    processor: t("processor"),
    memory: t("memory"),
    graphics: t("graphics"),
    storage: t("storage"),
  };

  const showsPcOnlyNotice = selected && selected !== "PC" && selected !== "MOBILE";

  return (
    <div className="space-y-4">
      {selected && platforms.length > 1 && (
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-base-border bg-base-surface px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-ink-muted transition-colors hover:border-ink-faint"
        >
          <RefreshCw className="h-3 w-3" />
          {PLATFORM_LABELS[selected]} · {t("changePlatform")}
        </button>
      )}

      {selected === "PC" && (
        <>
          {(minRequirements || recRequirements) && (
            <div className="grid gap-4 md:grid-cols-2">
              <RequirementsTable title={t("minRequirements")} req={minRequirements} labels={labels} />
              <RequirementsTable title={t("recRequirements")} req={recRequirements} labels={labels} />
            </div>
          )}

          {showHardwareCheck ? (
            <HardwareCheckForm gameId={gameId} />
          ) : (
            <button
              onClick={() => setShowHardwareCheck(true)}
              className="w-full rounded-xl border border-dashed border-base-border bg-base-surface p-4 text-left transition-colors hover:border-brand"
            >
              <span className="font-display text-sm font-semibold text-ink">{t("checkYourHardware")}</span>
            </button>
          )}
        </>
      )}

      {selected === "MOBILE" && (
        <div className="rounded-xl border border-base-border bg-base-surface p-4">
          <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-ink-faint">
            {t("mobileRequirements")}
          </h3>
          {mobileRequirements ? (
            <dl className="space-y-2 font-mono text-xs">
              <div className="flex justify-between gap-3 border-b border-base-border/50 pb-1.5">
                <dt className="text-ink-faint">&gt; {t("iosVersion")}</dt>
                <dd className="text-right text-ink">
                  {mobileRequirements.iosVersion
                    ? `iOS ${mobileRequirements.iosVersion}+`
                    : t("iosNotFound")}
                </dd>
              </div>
              <div className="flex justify-between gap-3 border-b border-base-border/50 pb-1.5">
                <dt className="text-ink-faint">&gt; {t("androidVersion")}</dt>
                <dd className="text-right text-ink">{mobileRequirements.androidVersion}</dd>
              </div>
              <div className="flex justify-between gap-3 border-b border-base-border/50 pb-1.5">
                <dt className="text-ink-faint">&gt; {t("memory")}</dt>
                <dd className="text-right text-ink">~{mobileRequirements.ramGb} GB</dd>
              </div>
              <div className="flex justify-between gap-3 pb-1.5">
                <dt className="text-ink-faint">&gt; {t("storage")}</dt>
                <dd className="text-right text-ink">~{mobileRequirements.storageGb} GB</dd>
              </div>
            </dl>
          ) : (
            <p className="text-xs text-ink-faint">{t("iosNotFound")}</p>
          )}
          <p className="mt-3 font-mono text-[10px] leading-relaxed text-ink-faint">
            {t("mobileEstimateNotice")}
          </p>
        </div>
      )}

      {showsPcOnlyNotice && (
        <p className="rounded-lg border border-base-border bg-base-surface p-3 text-xs text-ink-muted">
          {t("pcOnlyNotice")}
        </p>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-xl border border-base-border bg-base-surface p-5 shadow-glow">
            {selected && (
              <button
                onClick={() => setModalOpen(false)}
                className="absolute right-3 top-3 text-ink-faint hover:text-ink"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <h2 className="pr-6 font-display text-lg font-bold text-ink">{t("selectPlatformTitle")}</h2>
            <p className="mt-1 text-sm text-ink-muted">{t("selectPlatformSubtitle")}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {platforms.map((platform) => {
                const Icon = platformIcon(platform);
                return (
                  <button
                    key={platform}
                    onClick={() => choose(platform)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border border-base-border bg-base-raised p-3 transition-colors hover:border-brand hover:text-brand",
                      selected === platform && "border-brand text-brand"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-mono text-xs uppercase tracking-wider">
                      {PLATFORM_LABELS[platform]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
