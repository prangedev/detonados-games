import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUserId, getCurrentUserRole } from "@/lib/current-user";
import { hasAtLeastRole } from "@/lib/roles";
import { PLATFORMS } from "@/lib/constants";
import { buildMobileRequirements } from "@/lib/mobile-requirements";
import type { ParsedRequirements } from "@/lib/hardware-compat";

const GameInputSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  shortDescription: z.string().max(1000).optional().default(""),
  detonado: z.string().max(20000).optional().default(""),
  headerImage: z.string().max(500).optional().default(""),
  genres: z.string().max(500).optional().default(""),
  platforms: z.array(z.enum(PLATFORMS)).min(1),
  releaseStatus: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED"]),
});

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  const role = await getCurrentUserRole();
  if (!userId || !hasAtLeastRole(role, "ADMIN")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = GameInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const existing = await db.game.findUnique({ where: { slug: data.slug } });
  if (existing) {
    return NextResponse.json({ error: "Já existe um jogo com esse slug." }, { status: 409 });
  }

  let mobileRequirements: string | null = null;
  if (data.platforms.includes("MOBILE")) {
    const min: ParsedRequirements | null = null;
    const estimate = await buildMobileRequirements(data.title, min);
    mobileRequirements = JSON.stringify(estimate);
  }

  const genresArray = data.genres
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);

  const game = await db.game.create({
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

  return NextResponse.json(game, { status: 201 });
}
