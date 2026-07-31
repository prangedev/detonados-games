import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserId, getCurrentUserRole } from "@/lib/current-user";
import { hasAtLeastRole } from "@/lib/roles";

const RejectSchema = z.object({
  note: z.string().max(500).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const role = await getCurrentUserRole();
  if (!userId || !hasAtLeastRole(role, "MODERATOR")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const submission = await db.detonadoSubmission.findUnique({ where: { id } });
  if (!submission) {
    return NextResponse.json({ error: "Pesquisa não encontrada." }, { status: 404 });
  }
  if (submission.status !== "PENDING") {
    return NextResponse.json({ error: "Essa pesquisa já foi revisada." }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = RejectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const updated = await db.detonadoSubmission.update({
    where: { id },
    data: {
      status: "REJECTED",
      rejectionNote: parsed.data.note,
      reviewedById: userId,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
