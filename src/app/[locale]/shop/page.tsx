"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShopItemData {
  key: string;
  name: string;
  description: string;
  type: string;
  cost: number;
  value: string;
  owned: boolean;
  equipped: boolean;
}

export default function ShopPage() {
  const t = useTranslations("shopPage");
  const { status } = useSession();
  const [items, setItems] = useState<ShopItemData[]>([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  function load() {
    fetch("/api/shop")
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items ?? []);
        setPoints(data.points ?? 0);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function purchase(itemKey: string) {
    setBusyKey(itemKey);
    const res = await fetch("/api/shop/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemKey }),
    });
    if (res.ok) load();
    setBusyKey(null);
  }

  async function equip(itemKey: string) {
    setBusyKey(itemKey);
    const res = await fetch("/api/shop/equip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemKey }),
    });
    if (res.ok) load();
    setBusyKey(null);
  }

  const groups: { type: string; label: string }[] = [
    { type: "NAME_COLOR", label: t("groupNameColor") },
    { type: "FRAME", label: t("groupFrame") },
    { type: "AVATAR", label: t("groupAvatar") },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{t("title")}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
        </div>
        {status === "authenticated" && (
          <div className="flex items-center gap-2 rounded-full border border-warn/40 bg-warn/10 px-4 py-2">
            <Coins className="h-4 w-4 text-warn" />
            <span className="font-mono text-sm font-bold text-warn">{points}</span>
          </div>
        )}
      </div>

      {status !== "authenticated" && <p className="text-sm text-ink-faint">{t("loginRequired")}</p>}

      {!loading &&
        groups.map((group) => {
          const groupItems = items.filter((i) => i.type === group.type);
          if (groupItems.length === 0) return null;
          return (
            <section key={group.type}>
              <h2 className="mb-3 font-display text-lg font-bold text-ink">{group.label}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {groupItems.map((item) => (
                  <div
                    key={item.key}
                    className="flex flex-col items-center gap-2 rounded-xl border border-base-border bg-base-surface p-4 text-center"
                  >
                    <ItemPreview item={item} />
                    <p className="font-display text-sm font-semibold text-ink">{item.name}</p>
                    <p className="text-xs text-ink-muted">{item.description}</p>
                    {item.equipped ? (
                      <span className="font-mono text-[11px] text-mint">{t("equipped")}</span>
                    ) : item.owned ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyKey === item.key}
                        onClick={() => equip(item.key)}
                      >
                        {t("equip")}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={busyKey === item.key || status !== "authenticated" || points < item.cost}
                        onClick={() => purchase(item.key)}
                      >
                        {item.cost} {t("points")}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}

      <section className="rounded-xl border border-dashed border-base-border p-4 text-center text-sm text-ink-faint">
        {t("raffleComingSoon")}
      </section>
    </div>
  );
}

function ItemPreview({ item }: { item: ShopItemData }) {
  if (item.type === "NAME_COLOR") {
    return (
      <div
        className={cn("flex h-12 w-12 items-center justify-center rounded-full border-2 font-display text-lg font-bold")}
        style={{ color: item.value, borderColor: item.value }}
      >
        Aa
      </div>
    );
  }
  if (item.type === "FRAME") {
    return (
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full border-4 bg-base-raised"
        style={{ borderColor: item.value }}
      >
        <span className="text-lg">🎮</span>
      </div>
    );
  }
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-base-raised text-2xl">
      {item.value}
    </div>
  );
}
