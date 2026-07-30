import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserRole } from "@/lib/current-user";
import { hasAtLeastRole } from "@/lib/roles";

export async function GET() {
  const role = await getCurrentUserRole();
  if (!hasAtLeastRole(role, "MODERATOR")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const comments = await db.comment.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
      game: { select: { title: true, slug: true } },
    },
  });

  return NextResponse.json({
    comments: comments.map((c) => ({
      id: c.id,
      content: c.content,
      hidden: c.hidden,
      createdAt: c.createdAt,
      userName: c.user.name ?? c.user.email,
      gameTitle: c.game.title,
      gameSlug: c.game.slug,
    })),
  });
}
