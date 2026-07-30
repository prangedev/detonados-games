/**
 * A Vercel injeta automaticamente o header "Authorization: Bearer $CRON_SECRET"
 * nas chamadas feitas pelo Cron Jobs quando essa env var está definida no
 * projeto. Isso evita que qualquer pessoa dispare essas rotas manualmente.
 *
 * Se você estiver usando um cron externo (ex.: cron-job.org) por causa do
 * limite de cron jobs do plano Hobby da Vercel, configure-o para enviar o
 * mesmo header.
 */
export function isAuthorizedCronRequest(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // sem segredo configurado -> não bloqueia (útil em dev local)
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}
