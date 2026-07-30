"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasAtLeastRole } from "@/lib/roles";

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  userName: string | null;
  userNameColor?: string | null;
}

export function CommentsSection({ gameId }: { gameId: string }) {
  const t = useTranslations("game");
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canModerate = hasAtLeastRole(session?.user?.role, "MODERATOR");

  useEffect(() => {
    fetch(`/api/games/${gameId}/comments`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments ?? []))
      .finally(() => setLoading(false));
  }, [gameId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/games/${gameId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const created = await res.json();
        setComments((prev) => [created, ...prev]);
        setContent("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    setComments((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/comments/${id}`, { method: "DELETE" });
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold text-ink">{t("comments")}</h2>

      {status === "authenticated" ? (
        <form onSubmit={submit} className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("commentPlaceholder")}
            rows={3}
            className="w-full rounded-lg border border-base-border bg-base-surface p-3 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-brand"
          />
          <Button type="submit" size="sm" disabled={submitting || !content.trim()}>
            {t("commentSubmit")}
          </Button>
        </form>
      ) : (
        <p className="text-xs text-ink-faint">{t("commentLoginRequired")}</p>
      )}

      {!loading && comments.length === 0 && (
        <p className="text-xs text-ink-faint">{t("commentEmpty")}</p>
      )}

      <div className="space-y-3">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-base-border bg-base-surface p-3"
          >
            <div>
              <p
                className="font-display text-xs font-semibold text-ink"
                style={{ color: comment.userNameColor ?? undefined }}
              >
                {comment.userName ?? "Jogador"}
              </p>
              <p className="mt-1 text-sm text-ink-muted">{comment.content}</p>
              <p className="mt-1 font-mono text-[10px] text-ink-faint">
                {new Date(comment.createdAt).toLocaleString()}
              </p>
            </div>
            {(canModerate || comment.userId === session?.user?.id) && (
              <button
                onClick={() => remove(comment.id)}
                className="shrink-0 text-ink-faint hover:text-danger"
                aria-label={t("commentDelete")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
