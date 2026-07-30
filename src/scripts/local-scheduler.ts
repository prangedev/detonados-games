import cron from "node-cron";
import { publishDueGames } from "@/lib/scheduling";
import { syncSteamGames } from "./sync-steam-games";

/**
 * Substitui os Cron Jobs da Vercel para desenvolvimento local. Roda no
 * mesmo processo Node (via `npm run dev:all`, junto com o Next.js) e chama
 * as mesmas funções que as rotas /api/cron/* usam em produção — só que
 * direto, sem precisar de HTTP nem de CRON_SECRET.
 *
 * Horários (iguais aos do vercel.json):
 *  - Publicação de jogos agendados: 09h, 15h e 21h (um por turno)
 *  - Sincronização com a Steam: 03h
 */

const SHIFT_PUBLISH_CRON = "0 9,15,21 * * *";
const STEAM_SYNC_CRON = "0 3 * * *";

async function runPublish(trigger: string) {
  try {
    const result = await publishDueGames();
    if (result.published > 0) {
      console.log(`[scheduler] (${trigger}) ${result.published} jogo(s) publicado(s).`);
    } else {
      console.log(`[scheduler] (${trigger}) nenhum jogo pendente para publicar agora.`);
    }
  } catch (err) {
    console.error(`[scheduler] (${trigger}) erro ao publicar jogos agendados:`, err);
  }
}

async function runSteamSync() {
  try {
    console.log("[scheduler] iniciando sincronização com a Steam...");
    const result = await syncSteamGames(10);
    console.log(
      `[scheduler] sincronização concluída: ${result.synced} jogo(s) novo(s), ${result.scheduled} agendado(s).`
    );
  } catch (err) {
    console.error("[scheduler] erro na sincronização com a Steam:", err);
  }
}

cron.schedule(SHIFT_PUBLISH_CRON, () => runPublish("turno"));
cron.schedule(STEAM_SYNC_CRON, () => runSteamSync());

console.log("[scheduler] agendador local iniciado.");
console.log(`[scheduler] publicação por turno: ${SHIFT_PUBLISH_CRON} (09h/15h/21h)`);
console.log(`[scheduler] sync com a Steam:     ${STEAM_SYNC_CRON} (03h)`);

// Roda uma verificação imediata ao iniciar — útil em desenvolvimento, para
// não precisar esperar até o próximo turno para ver algo publicado.
runPublish("inicialização");
