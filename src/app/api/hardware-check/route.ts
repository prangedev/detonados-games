import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { safeJsonParse } from "@/lib/utils";
import { compareHardware, type ParsedRequirements } from "@/lib/hardware-compat";
import { getCurrentUserId } from "@/lib/current-user";
import { grantAchievement } from "@/lib/achievements";

const CheckSchema = z.object({
  gameId: z.string(),
  cpu: z.string().min(1),
  gpu: z.string().min(1),
  ramGb: z.number().min(1).max(1024),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CheckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { gameId, cpu, gpu, ramGb } = parsed.data;

  const game = await db.game.findUnique({ where: { id: gameId } });
  if (!game) {
    return NextResponse.json({ error: "Jogo não encontrado." }, { status: 404 });
  }

  const min = safeJsonParse<ParsedRequirements | null>(game.minRequirements, null);
  const rec = safeJsonParse<ParsedRequirements | null>(game.recRequirements, null);

  const result = compareHardware({ cpu, gpu, ramGb }, min, rec);

  const userId = await getCurrentUserId();
  if (userId) {
    await db.hardwareProfile.upsert({
      where: { userId },
      update: { cpu, gpu, ramGb },
      create: { userId, cpu, gpu, ramGb },
    });
    await grantAchievement(userId, "hardware-check-done");
  }

  return NextResponse.json(result);
}
