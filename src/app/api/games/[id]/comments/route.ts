import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/current-user";
import { grantAchievement, grantFirstCommentXp, checkEngagementMilestones } from "@/lib/achievements";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const comments = await db.comment.findMany({
    where: { gameId: id, hidden: false },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, nameColor: true } } },
  });

  return NextResponse.json({
    comments: comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      userId: c.userId,
      userName: c.user.name,
      userNameColor: c.user.nameColor,
    })),
  });
}

const CreateCommentSchema = z.object({
  content: z.string().min(1).max(1000),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Comentário inválido." }, { status: 400 });
  }

  const game = await db.game.findUnique({ where: { id } });
  if (!game) {
    return NextResponse.json({ error: "Jogo não encontrado." }, { status: 404 });
  }

  const comment = await db.comment.create({
    data: { gameId: id, userId, content: parsed.data.content },
    include: { user: { select: { name: true, nameColor: true } } },
  });

  await grantAchievement(userId, "first-comment");
  await grantFirstCommentXp(userId, id);
  await checkEngagementMilestones(userId);

  return NextResponse.json(
    {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      userId: comment.userId,
      userName: comment.user.name,
      userNameColor: comment.user.nameColor,
    },
    { status: 201 }
  );
}
