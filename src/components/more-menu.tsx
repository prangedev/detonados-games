"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { MoreHorizontal, Cpu, Coins, HelpCircle, Gift } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function MoreMenu() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const items = [
    { href: "/free-games", label: t("freeGames"), icon: Gift },
    { href: "/hardware-check", label: t("hardwareCheck"), icon: Cpu },
    { href: "/shop", label: t("shop"), icon: Coins },
    { href: "/faq", label: t("faq"), icon: HelpCircle },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-base-border bg-base-surface text-ink-muted transition-colors hover:border-ink-faint"
        aria-label={t("more")}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-base-border bg-base-surface shadow-glow">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-ink transition-colors hover:bg-base-raised"
              >
                <Icon className="h-4 w-4 text-ink-faint" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
