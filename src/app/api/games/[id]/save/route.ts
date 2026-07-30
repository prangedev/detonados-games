import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/current-user";
import { checkEngagementMilestones } from "@/lib/achievements";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ saved: false });

  const mine = await db.savedGame.findUnique({ where: { userId_gameId: { userId, gameId: id } } });
  return NextResponse.json({ saved: Boolean(mine) });
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const existing = await db.savedGame.findUnique({ where: { userId_gameId: { userId, gameId: id } } });

  if (existing) {
    await db.savedGame.delete({ where: { id: existing.id } });
  } else {
    await db.savedGame.create({ data: { userId, gameId: id } });
    await checkEngagementMilestones(userId);
  }

  return NextResponse.json({ saved: !existing });
}
