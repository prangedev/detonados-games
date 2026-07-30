import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserId, getCurrentUserRole } from "@/lib/current-user";
import { hasAtLeastRole, ROLES } from "@/lib/roles";

const RoleSchema = z.object({ role: z.enum(ROLES) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adminId = await getCurrentUserId();
  const role = await getCurrentUserRole();

  if (!adminId || !hasAtLeastRole(role, "ADMIN")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = RoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Papel inválido." }, { status: 400 });
  }

  // Evita que o último administrador se rebaixe sem querer e fique todo
  // mundo trancado pra fora do painel.
  if (id === adminId && parsed.data.role !== "ADMIN") {
    const otherAdmins = await db.user.count({ where: { role: "ADMIN", id: { not: adminId } } });
    if (otherAdmins === 0) {
      return NextResponse.json(
        { error: "Você é o único administrador. Promova outro usuário antes de mudar seu próprio papel." },
        { status: 400 }
      );
    }
  }

  const updated = await db.user.update({
    where: { id },
    data: { role: parsed.data.role },
    select: { id: true, role: true },
  });

  return NextResponse.json(updated);
}
