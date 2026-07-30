import webpush from "web-push";
import { db } from "./db";

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails("mailto:contato@detonados.games", publicKey, privateKey);
  configured = true;
  return true;
}

export async function sendPushNotification(params: {
  userId: string;
  title: string;
  message: string;
}) {
  if (!ensureConfigured()) return; // sem chaves VAPID -> no-op em dev

  const subscriptions = await db.pushSubscription.findMany({
    where: { userId: params.userId },
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({ title: params.title, body: params.message })
        );
      } catch (err: any) {
        // Inscrição expirada ou inválida -> limpa do banco.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          throw err;
        }
      }
    })
  );
}
