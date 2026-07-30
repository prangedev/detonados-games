import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJsonParse } from "@/lib/utils";
import type { PlatformType } from "@/lib/constants";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const platform = searchParams.get("platform") ?? undefined;
  const take = Math.min(Number(searchParams.get("take") ?? 60), 100);

  const games = await db.game.findMany({
    where: {
      releaseStatus: "PUBLISHED",
      ...(q ? { title: { contains: q } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  const summaries = games
    .map((g) => ({
      id: g.id,
      slug: g.slug,
      title: g.title,
      coverImage: g.coverImage,
      platforms: safeJsonParse<PlatformType[]>(g.platforms, []),
      protonDbTier: g.protonDbTier,
    }))
    .filter((g) => !platform || g.platforms.includes(platform as PlatformType));

  return NextResponse.json({ games: summaries });
}
