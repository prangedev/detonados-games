"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LOCALES, LOCALE_META, type Locale } from "@/lib/constants";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function selectLocale(next: Locale) {
    setOpen(false);
    router.replace({ pathname, params }, { locale: next });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-1.5 rounded-full border border-base-border bg-base-surface px-3 text-sm text-ink transition-colors hover:border-ink-faint"
        aria-label="Selecionar idioma"
      >
        <span className="text-base leading-none">{LOCALE_META[locale].flag}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-ink-faint transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-base-border bg-base-surface shadow-glow">
          {LOCALES.map((l) => (
            <button
              key={l}
              onClick={() => selectLocale(l)}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-base-raised",
                l === locale ? "text-brand" : "text-ink"
              )}
            >
              <span className="text-base leading-none">{LOCALE_META[l].flag}</span>
              <span>{LOCALE_META[l].label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
