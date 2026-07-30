"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Heart, Bookmark, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function GameInteractions({ gameId }: { gameId: string }) {
  const t = useTranslations("game");
  const { status } = useSession();
  const loggedIn = status === "authenticated";

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [average, setAverage] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [hoverStar, setHoverStar] = useState(0);

  useEffect(() => {
    fetch(`/api/games/${gameId}/like`)
      .then((res) => res.json())
      .then((data) => {
        setLiked(data.liked);
        setLikeCount(data.count);
      });
    fetch(`/api/games/${gameId}/save`)
      .then((res) => res.json())
      .then((data) => setSaved(data.saved));
    fetch(`/api/games/${gameId}/rating`)
      .then((res) => res.json())
      .then((data) => {
        setAverage(data.average);
        setRatingCount(data.count);
        setMyRating(data.mine);
      });
  }, [gameId]);

  async function toggleLike() {
    if (!loggedIn) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((c) => c + (nextLiked ? 1 : -1));
    const res = await fetch(`/api/games/${gameId}/like`, { method: "POST" });
    const data = await res.json();
    setLiked(data.liked);
    setLikeCount(data.count);
  }

  async function toggleSave() {
    if (!loggedIn) return;
    setSaved((s) => !s);
    const res = await fetch(`/api/games/${gameId}/save`, { method: "POST" });
    const data = await res.json();
    setSaved(data.saved);
  }

  async function rate(value: number) {
    if (!loggedIn) return;
    setMyRating(value);
    const res = await fetch(`/api/games/${gameId}/rating`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    if (res.ok) {
      const refreshed = await fetch(`/api/games/${gameId}/rating`).then((r) => r.json());
      setAverage(refreshed.average);
      setRatingCount(refreshed.count);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-base-border bg-base-surface p-3">
      <button
        onClick={toggleLike}
        disabled={!loggedIn}
        className={cn(
          "flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50",
          liked ? "text-brand" : "text-ink-muted hover:text-ink"
        )}
        title={!loggedIn ? t("commentLoginRequired") : undefined}
      >
        <Heart className={cn("h-4 w-4", liked && "fill-brand")} />
        {likeCount}
      </button>

      <button
        onClick={toggleSave}
        disabled={!loggedIn}
        className={cn(
          "flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50",
          saved ? "text-warn" : "text-ink-muted hover:text-ink"
        )}
        title={!loggedIn ? t("commentLoginRequired") : undefined}
      >
        <Bookmark className={cn("h-4 w-4", saved && "fill-warn")} />
        {t("save")}
      </button>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            disabled={!loggedIn}
            onMouseEnter={() => setHoverStar(star)}
            onMouseLeave={() => setHoverStar(0)}
            onClick={() => rate(star)}
            className="disabled:cursor-not-allowed"
          >
            <Star
              className={cn(
                "h-4 w-4 transition-colors",
                (hoverStar || myRating || 0) >= star ? "fill-warn text-warn" : "text-ink-faint"
              )}
            />
          </button>
        ))}
        <span className="ml-1 font-mono text-xs text-ink-faint">
          {average.toFixed(1)} ({ratingCount})
        </span>
      </div>
    </div>
  );
}
