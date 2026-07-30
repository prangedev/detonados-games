import { Resend } from "resend";
import { db } from "./db";
import { getApiKeyOverride } from "./site-settings";

async function getResendApiKey(): Promise<string | null> {
  const override = await getApiKeyOverride("RESEND_API_KEY");
  return override || process.env.RESEND_API_KEY || null;
}

export async function sendNotificationEmail(params: {
  userId: string;
  title: string;
  message: string;
}) {
  const apiKey = await getResendApiKey();
  // Sem chave configurada (nem no painel, nem no .env) -> no-op silencioso
  // (útil em dev local).
  if (!apiKey) return;

  const user = await db.user.findUnique({ where: { id: params.userId } });
  if (!user?.email) return;

  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Detonados Games <notificacoes@detonados.games>",
    to: user.email,
    subject: params.title,
    html: `
      <div style="font-family:Arial,sans-serif;background:#100E17;color:#F2EEF7;padding:32px;border-radius:12px;">
        <h2 style="color:#FF3D81;margin:0 0 12px;">${params.title}</h2>
        <p style="margin:0;line-height:1.6;">${params.message}</p>
        <hr style="border:none;border-top:1px solid #332C46;margin:24px 0;" />
        <p style="color:#9A93A8;font-size:12px;margin:0;">
          Detonados Games — você pode ajustar suas preferências de notificação a qualquer momento.
        </p>
      </div>
    `,
  });
}
