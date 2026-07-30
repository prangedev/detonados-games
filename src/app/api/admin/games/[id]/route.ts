import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUserId, getCurrentUserRole } from "@/lib/current-user";
import { hasAtLeastRole } from "@/lib/roles";
import { PLATFORMS } from "@/lib/constants";
import { buildMobileRequirements } from "@/lib/mobile-requirements";
import { safeJsonParse } from "@/lib/utils";
import type { ParsedRequirements } from "@/lib/hardware-compat";

const GameUpdateSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  shortDescription: z.string().max(1000).optional().default(""),
  detonado: z.string().max(20000).optional().default(""),
  headerImage: z.string().max(500).optional().default(""),
  genres: z.string().max(500).optional().default(""),
  platforms: z.array(z.enum(PLATFORMS)).min(1),
  releaseStatus: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED"]),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const role = await getCurrentUserRole();
  // MODERADOR pode "corrigir posts" (editar); ADMIN também. USUARIO não.
  if (!userId || !hasAtLeastRole(role, "MODERATOR")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const existingGame = await db.game.findUnique({ where: { id } });
  if (!existingGame) {
    return NextResponse.json({ error: "Jogo não encontrado." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = GameUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  if (data.slug !== existingGame.slug) {
    const slugTaken = await db.game.findUnique({ where: { slug: data.slug } });
    if (slugTaken) {
      return NextResponse.json({ error: "Já existe um jogo com esse slug." }, { status: 409 });
    }
  }

  let mobileRequirements = existingGame.mobileRequirements;
  const hadMobile = safeJsonParse<string[]>(existingGame.platforms, []).includes("MOBILE");
  if (data.platforms.includes("MOBILE") && !hadMobile) {
    const min = safeJsonParse<ParsedRequirements | null>(existingGame.minRequirements, null);
    const estimate = await buildMobileRequirements(data.title, min);
    mobileRequirements = JSON.stringify(estimate);
  } else if (!data.platforms.includes("MOBILE")) {
    mobileRequirements = null;
  }

  const genresArray = data.genres
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);

  const updated = await db.game.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      shortDescription: data.shortDescription || null,
      detonado: data.detonado || null,
      headerImage: data.headerImage || null,
      coverImage: data.headerImage || null,
      genres: JSON.stringify(genresArray),
      platforms: JSON.stringify(data.platforms),
      releaseStatus: data.releaseStatus,
      mobileRequirements,
    },
  });

  revalidateTag("games");

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const role = await getCurrentUserRole();
  // Excluir é reservado ao ADMIN — MODERADOR só corrige/edita.
  if (!userId || !hasAtLeastRole(role, "ADMIN")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  await db.game.delete({ where: { id } }).catch(() => null);

  revalidateTag("games");

  return NextResponse.json({ ok: true });
}
