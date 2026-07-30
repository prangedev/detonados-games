"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const POLL_INTERVAL_MS = 20000;

export function NotificationBell() {
  const { status } = useSession();
  const t = useTranslations("notifications");
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setItems(data.notifications);
      } catch {
        // silencioso — próximo ciclo de polling tenta de novo
      }
    }
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [status]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (status !== "authenticated") return null;

  const unreadCount = items.filter((n) => !n.read).length;

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({ markAllRead: true }),
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-base-border bg-base-surface text-ink transition-colors hover:border-ink-faint"
        aria-label={t("title")}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 font-mono text-[10px] text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-base-border bg-base-surface shadow-glow">
          <div className="flex items-center justify-between border-b border-base-border px-3 py-2">
            <span className="font-display text-sm font-semibold">{t("title")}</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="font-mono text-[11px] text-mint hover:underline">
                {t("markAllRead")}
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-ink-faint">{t("empty")}</p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "border-b border-base-border/60 px-3 py-2.5 last:border-none",
                    !n.read && "bg-brand/5"
                  )}
                >
                  <p className="text-sm font-medium text-ink">{n.title}</p>
                  <p className="text-xs text-ink-muted">{n.message}</p>
                </div>
              ))
            )}
          </div>
          <Link
            href="/notifications"
            className="block border-t border-base-border px-3 py-2 text-center font-mono text-[11px] text-ink-muted hover:text-ink"
            onClick={() => setOpen(false)}
          >
            {t("title")} →
          </Link>
        </div>
      )}
    </div>
  );
}
