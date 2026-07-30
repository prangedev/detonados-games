import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { publishDueGames } from "@/lib/scheduling";

/**
 * Rota HTTP equivalente ao que o agendador local (src/scripts/local-scheduler.ts)
 * já faz automaticamente durante `npm run dev:all`. Mantida aqui para o caso
 * de, no futuro, você optar por hospedar isso na nuvem (Vercel Cron ou
 * qualquer outro serviço de cron externo apontando pra essa URL).
 */
export async function GET(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const result = await publishDueGames();
  return NextResponse.json(result);
}
