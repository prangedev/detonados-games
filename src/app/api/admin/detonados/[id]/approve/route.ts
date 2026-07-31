import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUserId, getCurrentUserRole } from "@/lib/current-user";
import { hasAtLeastRole } from "@/lib/roles";
import { slugify, safeJsonParse } from "@/lib/utils";
import { scheduleUpcomingGames } from "@/lib/scheduling";
import type { PlatformType } from "@/lib/constants";

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  let candidate = base;
  let suffix = 1;
  while (await db.game.findUnique({ where: { slug: candidate } })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const role = await getCurrentUserRole();
  if (!userId || !hasAtLeastRole(role, "MODERATOR")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const submission = await db.detonadoSubmission.findUnique({
    where: { id },
    include: { translations: true },
  });
  if (!submission) {
    return NextResponse.json({ error: "Pesquisa não encontrada." }, { status: 404 });
  }
  if (submission.status !== "PENDING") {
    return NextResponse.json({ error: "Essa pesquisa já foi revisada." }, { status: 409 });
  }

  const ptBR = submission.translations.find((t) => t.locale === "pt-BR");
  if (!ptBR) {
    return NextResponse.json({ error: "Pesquisa sem tradução em pt-BR." }, { status: 400 });
  }

  const platforms = safeJsonParse<PlatformType[]>(submission.platforms, []);

  let gameId: string;

  if (submission.existingGameId) {
    const existingGame = await db.game.findUnique({ where: { id: submission.existingGameId } });
    if (!existingGame) {
      return NextResponse.json({ error: "Jogo existente não encontrado." }, { status: 400 });
    }
    const updated = await db.game.update({
      where: { id: existingGame.id },
      data: {
        title: ptBR.title,
        shortDescription: ptBR.shortDescription,
        detonado: ptBR.detonado,
        headerImage: submission.headerImage ?? existingGame.headerImage,
        coverImage: submission.headerImage ?? existingGame.coverImage,
      },
    });
    gameId = updated.id;
  } else {
    const slug = await uniqueSlug(submission.gameTitle);
    const created = await db.game.create({
      data: {
        slug,
        title: ptBR.title,
        shortDescription: ptBR.shortDescription,
        detonado: ptBR.detonado,
        headerImage: submission.headerImage,
        coverImage: submission.headerImage,
        platforms: JSON.stringify(platforms),
        releaseStatus: "DRAFT",
      },
    });
    gameId = created.id;
    await scheduleUpcomingGames();
  }

  for (const translation of submission.translations) {
    await db.gameTranslation.upsert({
      where: { gameId_locale: { gameId, locale: translation.locale } },
      update: {
        title: translation.title,
        shortDescription: translation.shortDescription,
        detonado: translation.detonado,
      },
      create: {
        gameId,
        locale: translation.locale,
        title: translation.title,
        shortDescription: translation.shortDescription,
        detonado: translation.detonado,
      },
    });
  }

  const updatedSubmission = await db.detonadoSubmission.update({
    where: { id },
    data: {
      status: "APPROVED",
      gameId,
      reviewedById: userId,
      reviewedAt: new Date(),
    },
  });

  revalidateTag("games");

  return NextResponse.json(updatedSubmission);
}
