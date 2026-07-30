import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/current-user";
import { checkEngagementMilestones, grantFirstRatingXp } from "@/lib/achievements";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const [ratings, mine] = await Promise.all([
    db.rating.findMany({ where: { gameId: id }, select: { value: true } }),
    userId ? db.rating.findUnique({ where: { userId_gameId: { userId, gameId: id } } }) : null,
  ]);

  const average = ratings.length ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length : 0;

  return NextResponse.json({ average, count: ratings.length, mine: mine?.value ?? null });
}

const RatingSchema = z.object({ value: z.number().int().min(1).max(5) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = RatingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Nota inválida." }, { status: 400 });

  const game = await db.game.findUnique({ where: { id } });
  if (!game) return NextResponse.json({ error: "Jogo não encontrado." }, { status: 404 });

  const existing = await db.rating.findUnique({ where: { userId_gameId: { userId, gameId: id } } });

  await db.rating.upsert({
    where: { userId_gameId: { userId, gameId: id } },
    update: { value: parsed.data.value },
    create: { userId, gameId: id, value: parsed.data.value },
  });

  if (!existing) {
    await grantFirstRatingXp(userId, id, true);
    await checkEngagementMilestones(userId);
  }

  return NextResponse.json({ ok: true });
}
