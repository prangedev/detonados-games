import { db } from "./db";
import { safeJsonParse } from "./utils";

/**
 * Registra que um usuário visitou um jogo (base para o feed e as
 * recomendações). Chamado uma vez por visita à página do jogo.
 */
export async function recordGameView(userId: string, gameId: string) {
  await db.gameView.create({ data: { userId, gameId } });
}

/**
 * Pesos de cada tipo de interação na hora de calcular afinidade por
 * gênero: curtir ou salvar um jogo é um sinal de interesse bem mais forte
 * do que só ter visitado a página, então pesam mais.
 */
const SIGNAL_WEIGHT = { view: 1, like: 3, save: 3 } as const;

/** Busca jogos candidatos com maior sobreposição de gênero com `topGenres`. */
async function rankByGenreOverlap(topGenres: string[], excludeIds: string[], limit: number) {
  if (topGenres.length === 0) return [];

  const candidates = await db.game.findMany({
    where: {
      releaseStatus: "PUBLISHED",
      id: { notIn: excludeIds },
    },
    orderBy: { createdAt: "desc" },
    take: 150,
  });

  return candidates
    .map((game) => {
      const genres = safeJsonParse<string[]>(game.genres, []);
      const overlap = genres.filter((g) => topGenres.includes(g)).length;
      return { game, overlap };
    })
    .filter((entry) => entry.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, limit)
    .map((entry) => entry.game);
}

/**
 * Recomendações "relacionado ao que você já interagiu": combina
 * visualizações, curtidas e jogos salvos (com pesos diferentes) para achar
 * os gêneros favoritos do usuário logado, e sugere outros jogos publicados
 * com gêneros em comum que ele ainda não viu. Similaridade de conteúdo por
 * gênero, não aprendizado de máquina — simples e honesto sobre o que é.
 */
export async function getRecommendedGames(userId: string, limit = 8) {
  const [views, likes, saves] = await Promise.all([
    db.gameView.findMany({
      where: { userId },
      orderBy: { viewedAt: "desc" },
      take: 30,
      include: { game: { select: { id: true, genres: true } } },
    }),
    db.like.findMany({ where: { userId }, include: { game: { select: { id: true, genres: true } } } }),
    db.savedGame.findMany({ where: { userId }, include: { game: { select: { id: true, genres: true } } } }),
  ]);

  const interactedIds = new Set([...views, ...likes, ...saves].map((v) => v.gameId));
  if (interactedIds.size === 0) return [];

  const genreScore = new Map<string, number>();
  function addSignal(genres: string[], weight: number) {
    for (const genre of genres) {
      genreScore.set(genre, (genreScore.get(genre) ?? 0) + weight);
    }
  }
  for (const v of views) addSignal(safeJsonParse<string[]>(v.game.genres, []), SIGNAL_WEIGHT.view);
  for (const l of likes) addSignal(safeJsonParse<string[]>(l.game.genres, []), SIGNAL_WEIGHT.like);
  for (const s of saves) addSignal(safeJsonParse<string[]>(s.game.genres, []), SIGNAL_WEIGHT.save);

  const topGenres = [...genreScore.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre);

  return rankByGenreOverlap(topGenres, [...interactedIds], limit);
}

/**
 * Mesma ideia, mas para visitantes não-logados: usa o cookie de interesses
 * por gênero (gravado por src/components/interest-tracker.tsx a cada jogo
 * visitado) em vez do histórico no banco.
 */
export function parseInterestCookie(raw: string | undefined): Record<string, number> {
  if (!raw) return {};
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return {};
  }
}

export async function getRecommendedGamesFromInterests(interests: Record<string, number>, limit = 8) {
  const topGenres = Object.entries(interests)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre);

  return rankByGenreOverlap(topGenres, [], limit);
}
