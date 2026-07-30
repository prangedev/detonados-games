"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AdminComment {
  id: string;
  content: string;
  hidden: boolean;
  createdAt: string;
  userName: string;
  gameTitle: string;
  gameSlug: string;
}

export default function AdminCommentsPage() {
  const t = useTranslations("admin");
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/admin/comments")
      .then((res) => res.json())
      .then((data) => setComments(data.comments ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function hide(id: string) {
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, hidden: true } : c)));
    await fetch(`/api/comments/${id}`, { method: "DELETE" });
  }

  async function restore(id: string) {
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, hidden: false } : c)));
    await fetch(`/api/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore" }),
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold text-ink">{t("commentsTitle")}</h2>

      {!loading && comments.length === 0 && (
        <p className="text-sm text-ink-faint">{t("commentsEmpty")}</p>
      )}

      <div className="space-y-2">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-base-border bg-base-surface p-3"
          >
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                {comment.gameTitle} · {comment.userName}
              </p>
              <p className="mt-1 text-sm text-ink">{comment.content}</p>
              {comment.hidden && <Badge className="mt-2">{t("commentsHiddenLabel")}</Badge>}
            </div>
            {comment.hidden ? (
              <Button variant="outline" size="sm" onClick={() => restore(comment.id)}>
                {t("commentsRestore")}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => hide(comment.id)}
                className="hover:border-danger hover:text-danger"
              >
                {t("gamesDelete")}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
