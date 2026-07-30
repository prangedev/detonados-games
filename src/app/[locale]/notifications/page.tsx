"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const t = useTranslations("notifications");
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => setItems(data.notifications ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications", { method: "PATCH", body: JSON.stringify({ markAllRead: true }) });
  }

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">{t("title")}</h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="font-mono text-xs text-mint hover:underline">
            {t("markAllRead")}
          </button>
        )}
      </div>

      {loading ? null : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-faint">{t("empty")}</p>
      ) : (
        <div className="divide-y divide-base-border rounded-xl border border-base-border bg-base-surface">
          {items.map((n) => (
            <div key={n.id} className={cn("p-4", !n.read && "bg-brand/5")}>
              <p className="font-display text-sm font-semibold text-ink">{n.title}</p>
              <p className="mt-0.5 text-sm text-ink-muted">{n.message}</p>
              <p className="mt-1 font-mono text-[10px] text-ink-faint">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
