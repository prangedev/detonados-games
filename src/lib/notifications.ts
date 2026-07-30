import { db } from "./db";
import type { NotificationTypeValue } from "./constants";
import { sendNotificationEmail } from "./email";
import { sendPushNotification } from "./push";

/**
 * Cria uma notificação in-app e, de acordo com as preferências do usuário,
 * dispara também e-mail e web push (best-effort — falhas não interrompem
 * a criação do registro em banco).
 *
 * Observação sobre "tempo real": como o app roda em funções serverless na
 * Vercel, não mantemos uma conexão WebSocket persistente. O sino de
 * notificações no client faz polling leve (a cada ~20s) em /api/notifications.
 * Para tempo real "de verdade" em produção, plugue um provedor como
 * Pusher, Ably ou Supabase Realtime — a criação da notificação abaixo é o
 * ponto único onde você publicaria o evento.
 */
export async function createNotification(params: {
  userId: string;
  type: NotificationTypeValue;
  title: string;
  message: string;
}) {
  const { userId, type, title, message } = params;

  const prefs = await db.notificationPreference.findUnique({ where: { userId } });

  const typeEnabled =
    !prefs ||
    (type === "NEW_GAME" ? prefs.newGames : true) &&
    (type === "ACHIEVEMENT" ? prefs.achievements : true) &&
    (type === "LEVEL_UP" ? prefs.levelUp : true);

  if (!typeEnabled) return null;

  const notification = await db.notification.create({
    data: { userId, type, title, message },
  });

  if (!prefs || prefs.email) {
    sendNotificationEmail({ userId, title, message }).catch((err) =>
      console.error("[notifications] falha ao enviar e-mail:", err)
    );
  }

  if (prefs?.push) {
    sendPushNotification({ userId, title, message }).catch((err) =>
      console.error("[notifications] falha ao enviar push:", err)
    );
  }

  return notification;
}

export async function ensureNotificationPreferences(userId: string) {
  return db.notificationPreference.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}
