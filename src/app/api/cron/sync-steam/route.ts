import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { syncSteamGames } from "@/scripts/sync-steam-games";

/**
 * Equivalente HTTP do que o agendador local já faz automaticamente. Mantida
 * para uso futuro caso você hospede isso na nuvem.
 */
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const result = await syncSteamGames(10);
  return NextResponse.json(result);
}
