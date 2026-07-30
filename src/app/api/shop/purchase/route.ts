import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/current-user";
import { purchaseItem } from "@/lib/points";

const Schema = z.object({ itemKey: z.string() });

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });

  const result = await purchaseItem(userId, parsed.data.itemKey);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ ok: true });
}
