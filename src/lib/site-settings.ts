import { db } from "./db";
import { SHIFT_HOURS, type ShiftType } from "./constants";

/**
 * Configurações do site editáveis pelo painel de administrador, guardadas
 * como pares chave/valor (tabela SiteSetting). Cada valor é uma string —
 * os getters abaixo cuidam do parse/fallback para o tipo certo.
 */

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.siteSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await db.siteSetting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

// ---------------------------------------------------------------------------
// Tema (cor de destaque)
// ---------------------------------------------------------------------------

export const DEFAULT_THEME_ACCENT = "#F2231E";

export async function getThemeAccent(): Promise<string> {
  const value = await getSetting("theme.accent");
  return value ?? DEFAULT_THEME_ACCENT;
}

// ---------------------------------------------------------------------------
// Horários dos turnos de publicação (usado pelo agendador local)
// ---------------------------------------------------------------------------

export async function getShiftHours(): Promise<Record<ShiftType, number>> {
  const raw = await getSetting("schedule.shiftHours");
  if (!raw) return SHIFT_HOURS;
  try {
    const parsed = JSON.parse(raw);
    return { ...SHIFT_HOURS, ...parsed };
  } catch {
    return SHIFT_HOURS;
  }
}

export async function setShiftHours(hours: Record<ShiftType, number>): Promise<void> {
  await setSetting("schedule.shiftHours", JSON.stringify(hours));
}

// ---------------------------------------------------------------------------
// Chaves de API (sobrepõem o .env quando definidas pelo painel)
//
// Só RESEND_API_KEY é seguro sobrepor em runtime aqui: é usado só no
// servidor. As chaves VAPID (push) NÃO entram nesse mecanismo de propósito —
// a chave pública fica embutida no bundle do navegador em tempo de build
// (NEXT_PUBLIC_VAPID_PUBLIC_KEY), então sobrepor só no servidor quebraria o
// pareamento cliente/servidor das chaves. Para trocar as chaves VAPID, edite
// o .env e reinicie o servidor.
// ---------------------------------------------------------------------------

type OverridableApiKey = "RESEND_API_KEY" | "GEMINI_API_KEY";

export async function getApiKeyOverride(name: OverridableApiKey): Promise<string | null> {
  return getSetting(`apiKey.${name}`);
}

export async function setApiKeyOverride(name: OverridableApiKey, value: string): Promise<void> {
  await setSetting(`apiKey.${name}`, value);
}

/**
 * Chave efetiva do Gemini: prioriza o valor salvo pelo painel (/admin/settings)
 * sobre o .env, igual ao RESEND_API_KEY. Usada pelo pipeline de pesquisa de
 * detonados (src/lib/gemini.ts).
 */
export async function getGeminiApiKey(): Promise<string | null> {
  const override = await getApiKeyOverride("GEMINI_API_KEY");
  return override || process.env.GEMINI_API_KEY || null;
}

// ---------------------------------------------------------------------------
// Identidade do site
// ---------------------------------------------------------------------------

export async function getSiteName(): Promise<string> {
  const value = await getSetting("site.name");
  return value ?? "Detona Games";
}
