import { db } from "./db";
import { GAMES_PER_SHIFT, SHIFTS, type ShiftType } from "./constants";
import { createNotification } from "./notifications";
import { getShiftHours } from "./site-settings";

/**
 * Pega jogos ainda não agendados (releaseStatus = "DRAFT", criados pelo
 * sync do Steam) e distribui 2 por turno (manhã, tarde, noite) nos
 * próximos dias, na ordem em que foram sincronizados. Os horários de cada
 * turno podem ser customizados pelo administrador (painel /admin/settings);
 * por padrão usam SHIFT_HOURS (09h/15h/21h).
 */
export async function scheduleUpcomingGames() {
  const unscheduled = await db.game.findMany({
    where: { releaseStatus: "DRAFT" },
    orderBy: { createdAt: "asc" },
  });

  if (unscheduled.length === 0) return { scheduled: 0 };

  const shiftHours = await getShiftHours();

  // Encontra o próximo slot livre (turno com menos de GAMES_PER_SHIFT jogos)
  // a partir de hoje.
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  let scheduledCount = 0;
  let queueIndex = 0;
  let dayOffset = 0;

  while (queueIndex < unscheduled.length && dayOffset < 30) {
    for (const shift of SHIFTS) {
      if (queueIndex >= unscheduled.length) break;

      const slotDate = new Date(cursor);
      slotDate.setDate(slotDate.getDate() + dayOffset);
      slotDate.setHours(shiftHours[shift as ShiftType], 0, 0, 0);

      const existingInSlot = await db.game.count({
        where: {
          shift,
          scheduledFor: slotDate,
          releaseStatus: { in: ["SCHEDULED", "PUBLISHED"] },
        },
      });

      const freeSlots = GAMES_PER_SHIFT - existingInSlot;
      for (let i = 0; i < freeSlots && queueIndex < unscheduled.length; i++) {
        const game = unscheduled[queueIndex];
        await db.game.update({
          where: { id: game.id },
          data: { releaseStatus: "SCHEDULED", shift, scheduledFor: slotDate },
        });
        scheduledCount++;
        queueIndex++;
      }
    }
    dayOffset++;
  }

  return { scheduled: scheduledCount };
}

/**
 * Publica jogos cujo horário agendado já chegou. Chamado pelo agendador
 * local (src/scripts/local-scheduler.ts) a cada turno. Notifica usuários que
 * têm a preferência "novos jogos" ativada.
 */
export async function publishDueGames() {
  const now = new Date();

  const due = await db.game.findMany({
    where: { releaseStatus: "SCHEDULED", scheduledFor: { lte: now } },
  });

  if (due.length === 0) return { published: 0 };

  await db.game.updateMany({
    where: { id: { in: due.map((g) => g.id) } },
    data: { releaseStatus: "PUBLISHED" },
  });

  // Em produção com muitos usuários, isso deveria virar um job em fila
  // (ex.: Inngest/QStash) em vez de um loop síncrono dentro da rota de cron.
  const usersToNotify = await db.user.findMany({
    where: { notificationPreference: { newGames: true } },
    select: { id: true },
  });

  for (const game of due) {
    for (const user of usersToNotify) {
      await createNotification({
        userId: user.id,
        type: "NEW_GAME",
        title: "Novo detonado disponível!",
        message: `${game.title} acabou de ser publicado. Confira o guia completo.`,
      });
    }
  }

  return { published: due.length };
}
