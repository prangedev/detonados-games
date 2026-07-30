import { unstable_cache } from "next/cache";
import { db } from "./db";

/**
 * Cache de leitura para consultas públicas e não-personalizadas (mesmo
 * resultado pra qualquer visitante). Usa o cache de dados do Next.js
 * (`unstable_cache`), que persiste entre requisições no mesmo processo.
 *
 * Importante: só cacheamos aqui o que é igual para todo mundo. Dados por
 * usuário (recomendações do feed, notificações, etc.) NÃO passam por essa
 * camada — cachear por engano dados de um usuário para outro seria um bug
 * de privacidade, não só de performance.
 *
 * Invalidação: as rotas de admin que criam/editam/excluem jogos chamam
 * `revalidateTag("games")` depois de qualquer mutação, então o cache nunca
 * fica desatualizado por mais que o tempo de `revalidate` abaixo.
 */

export const getCachedPublishedGames = unstable_cache(
  async (q: string | undefined, take: number) => {
    return db.game.findMany({
      where: {
        releaseStatus: "PUBLISHED",
        ...(q ? { title: { contains: q } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
    });
  },
  ["published-games"],
  { revalidate: 60, tags: ["games"] }
);

export const getCachedRecentGames = unstable_cache(
  async (take: number) => {
    return db.game.findMany({
      where: { releaseStatus: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take,
    });
  },
  ["recent-games"],
  { revalidate: 60, tags: ["games"] }
);

export const getCachedLeaderboard = unstable_cache(
  async (take: number) => {
    return db.user.findMany({
      orderBy: { xp: "desc" },
      take,
      select: { id: true, name: true, email: true, xp: true, level: true, nameColor: true, equippedFrame: true },
    });
  },
  ["leaderboard"],
  { revalidate: 30, tags: ["leaderboard"] }
);
