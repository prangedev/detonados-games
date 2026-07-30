import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/current-user";

const SubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = SubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Inscrição inválida." }, { status: 400 });
  }

  const { endpoint, keys } = parsed.data;

  await db.pushSubscription.upsert({
    where: { endpoint },
    update: { userId, p256dh: keys.p256dh, auth: keys.auth },
    create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  });

  await db.notificationPreference.upsert({
    where: { userId },
    update: { push: true },
    create: { userId, push: true },
  });

  return NextResponse.json({ ok: true });
}
