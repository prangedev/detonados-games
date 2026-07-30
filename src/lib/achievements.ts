import { db } from "./db";
import { computeLevelProgress } from "./xp";
import { createNotification } from "./notifications";
import { XP_RULES } from "./constants";

/**
 * Adiciona XP a um usuário e cria notificação de "subiu de nível" quando
 * aplicável. Retorna o progresso de nível atualizado.
 */
export async function addXp(userId: string, amount: number) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const before = computeLevelProgress(user.xp);
  const newXp = user.xp + amount;
  const after = computeLevelProgress(newXp);

  await db.user.update({
    where: { id: userId },
    data: { xp: newXp, level: after.level },
  });

  if (after.level > before.level) {
    await createNotification({
      userId,
      type: "LEVEL_UP",
      title: `Você alcançou o nível ${after.level}!`,
      message: `Continue jogando e explorando detonados para subir ainda mais.`,
    });

    if (after.level >= 5) await grantAchievement(userId, "level-5");
    if (after.level >= 10) await grantAchievement(userId, "level-10");
    if (after.level >= 20) await grantAchievement(userId, "level-20");
  }

  return after;
}

/**
 * Concede uma conquista ao usuário (idempotente — não duplica) e credita
 * o XP correspondente à raridade dela.
 */
export async function grantAchievement(userId: string, achievementKey: string) {
  const achievement = await db.achievement.findUnique({ where: { key: achievementKey } });
  if (!achievement) return null;

  const already = await db.userAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId: achievement.id } },
  });
  if (already) return null;

  await db.userAchievement.create({
    data: { userId, achievementId: achievement.id },
  });

  await addXp(userId, achievement.xpReward);

  await createNotification({
    userId,
    type: "ACHIEVEMENT",
    title: `Conquista desbloqueada: ${achievement.name}`,
    message: `${achievement.description} (+${achievement.xpReward} XP)`,
  });

  return achievement;
}

/**
 * Concede os 15XP de login diário — no máximo uma vez por dia de
 * calendário. Chamado no momento do login (veja src/lib/auth.ts).
 */
export async function grantDailyLoginXp(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { lastDailyXpAt: true } });
  if (!user) return;

  const now = new Date();
  const last = user.lastDailyXpAt;
  const alreadyToday =
    last &&
    last.getFullYear() === now.getFullYear() &&
    last.getMonth() === now.getMonth() &&
    last.getDate() === now.getDate();

  if (alreadyToday) return;

  await db.user.update({ where: { id: userId }, data: { lastDailyXpAt: now } });
  await addXp(userId, XP_RULES.DAILY_LOGIN);
}

/**
 * Concede 50XP na primeira avaliação/comentário do usuário em CADA jogo
 * (não a cada comentário/avaliação — evita farm por spam no mesmo jogo,
 * mas recompensa engajamento genuíno em conteúdos diferentes).
 */
export async function grantFirstCommentXp(userId: string, gameId: string) {
  const count = await db.comment.count({ where: { userId, gameId } });
  if (count === 1) await addXp(userId, XP_RULES.FIRST_COMMENT_ON_GAME);
}

export async function grantFirstRatingXp(userId: string, gameId: string, isNewRating: boolean) {
  if (isNewRating) await addXp(userId, XP_RULES.FIRST_RATING_ON_GAME);
  void gameId;
}

/**
 * Confere marcos de engajamento (curtidas, avaliações, salvos, comentários
 * acumulados) e concede as conquistas correspondentes quando atingidos.
 * Chamado depois de qualquer uma dessas ações — é barato (4 counts) e
 * idempotente (grantAchievement não duplica).
 */
export async function checkEngagementMilestones(userId: string) {
  const [likes, ratings, saves, comments] = await Promise.all([
    db.like.count({ where: { userId } }),
    db.rating.count({ where: { userId } }),
    db.savedGame.count({ where: { userId } }),
    db.comment.count({ where: { userId } }),
  ]);

  if (likes === 1) await grantAchievement(userId, "first-like");
  if (saves === 1) await grantAchievement(userId, "first-save");
  if (ratings === 1) await grantAchievement(userId, "first-rating");

  if (likes >= 25) await grantAchievement(userId, "fan-club");
  if (ratings >= 10) await grantAchievement(userId, "critico");
  if (saves >= 10) await grantAchievement(userId, "colecionador");
  if (comments >= 20) await grantAchievement(userId, "resenhista");
}
