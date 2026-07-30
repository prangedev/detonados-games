import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId, getCurrentUserRole } from "@/lib/current-user";
import { hasAtLeastRole } from "@/lib/roles";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const comment = await db.comment.findUnique({ where: { id } });
  if (!comment) {
    return NextResponse.json({ error: "Comentário não encontrado." }, { status: 404 });
  }

  const role = await getCurrentUserRole();
  const isOwner = comment.userId === userId;
  const isStaff = hasAtLeastRole(role, "MODERATOR");

  if (!isOwner && !isStaff) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  // Moderadores/admins ocultam (para manter histórico de moderação); o
  // próprio autor apagando o comentário remove de fato.
  if (isStaff && !isOwner) {
    await db.comment.update({ where: { id }, data: { hidden: true } });
  } else {
    await db.comment.delete({ where: { id } });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const role = await getCurrentUserRole();

  if (!userId || !hasAtLeastRole(role, "MODERATOR")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (body?.action !== "restore") {
    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  }

  const updated = await db.comment.update({ where: { id }, data: { hidden: false } }).catch(() => null);
  if (!updated) {
    return NextResponse.json({ error: "Comentário não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
