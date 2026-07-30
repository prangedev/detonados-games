import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/current-user";

const PrefsSchema = z.object({
  inApp: z.boolean(),
  email: z.boolean(),
  push: z.boolean(),
  newGames: z.boolean(),
  achievements: z.boolean(),
  levelUp: z.boolean(),
});

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json(null);

  const prefs = await db.notificationPreference.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  return NextResponse.json(prefs);
}

export async function PUT(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = PrefsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const prefs = await db.notificationPreference.upsert({
    where: { userId },
    update: parsed.data,
    create: { userId, ...parsed.data },
  });

  return NextResponse.json(prefs);
}
