import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/current-user";
import { checkEngagementMilestones } from "@/lib/achievements";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const [count, mine] = await Promise.all([
    db.like.count({ where: { gameId: id } }),
    userId ? db.like.findUnique({ where: { userId_gameId: { userId, gameId: id } } }) : null,
  ]);

  return NextResponse.json({ count, liked: Boolean(mine) });
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const existing = await db.like.findUnique({ where: { userId_gameId: { userId, gameId: id } } });

  if (existing) {
    await db.like.delete({ where: { id: existing.id } });
  } else {
    await db.like.create({ data: { userId, gameId: id } });
    await checkEngagementMilestones(userId);
  }

  const count = await db.like.count({ where: { gameId: id } });
  return NextResponse.json({ count, liked: !existing });
}
