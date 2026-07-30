"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { PLATFORMS, PLATFORM_LABELS } from "@/lib/constants";

export function PlatformFilter() {
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("platform");

  function select(platform: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (platform) params.set("platform", platform);
    else params.delete("platform");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <FilterChip active={!active} onClick={() => select(null)}>
        {t("all")}
      </FilterChip>
      {PLATFORMS.map((platform) => (
        <FilterChip key={platform} active={active === platform} onClick={() => select(platform)}>
          {PLATFORM_LABELS[platform]}
        </FilterChip>
      ))}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors",
        active
          ? "border-brand bg-brand/15 text-brand"
          : "border-base-border bg-base-surface text-ink-muted hover:border-ink-faint"
      )}
    >
      {children}
    </button>
  );
}
