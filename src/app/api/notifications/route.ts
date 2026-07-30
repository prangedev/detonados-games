import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/current-user";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ notifications: [] });

  const notifications = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ notifications });
}

export async function PATCH(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);

  if (body?.markAllRead) {
    await db.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    return NextResponse.json({ ok: true });
  }

  if (body?.id) {
    await db.notification.update({ where: { id: body.id }, data: { read: true } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
}
