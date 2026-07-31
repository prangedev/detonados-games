import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserId, getCurrentUserRole } from "@/lib/current-user";
import { hasAtLeastRole } from "@/lib/roles";
import { PLATFORMS } from "@/lib/constants";
import { DETONADO_SOURCES } from "@/lib/detonado-sources";
import { researchDetonado, InvalidSourceUrlError } from "@/lib/detonado-pipeline";
import { GeminiNotConfiguredError } from "@/lib/gemini";

export async function GET(req: Request) {
  const role = await getCurrentUserRole();
  if (!hasAtLeastRole(role, "MODERATOR")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "PENDING";

  const submissions = await db.detonadoSubmission.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { translations: true },
  });

  return NextResponse.json({ submissions });
}

const ResearchSchema = z.object({
  gameTitle: z.string().min(1).max(200),
  platforms: z.array(z.enum(PLATFORMS)).min(1),
  sourceKey: z.enum(DETONADO_SOURCES.map((s) => s.key) as [string, ...string[]]),
  sourceUrl: z.string().url().max(1000),
  existingGameId: z.string().optional(),
});

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  const role = await getCurrentUserRole();
  if (!userId || !hasAtLeastRole(role, "MODERATOR")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ResearchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const submission = await researchDetonado({ ...parsed.data, createdById: userId });
    return NextResponse.json(submission, { status: 201 });
  } catch (err) {
    if (err instanceof GeminiNotConfiguredError || err instanceof InvalidSourceUrlError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Falha ao pesquisar o detonado.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
