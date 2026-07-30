/**
 * Integração com a Steam.
 *
 * Decisão de arquitetura: em vez de Puppeteer (navegador headless), usamos
 * as APIs públicas em JSON da Steam + SteamSpy. Motivo: Puppeteer é pesado
 * e frágil em funções serverless da Vercel (exige um binário de Chromium
 * separado via @sparticuz/chromium, aumenta o cold start e o tamanho do
 * deploy, e quebra com frequência a cada atualização do Chrome). As APIs
 * abaixo são as mesmas fontes de dados, sem esses problemas.
 *
 * Se você realmente precisar fazer scraping de HTML (ex.: uma página que
 * não tem API pública), dá para adicionar Puppeteer + @sparticuz/chromium
 * depois, isoladamente, nesse mesmo módulo.
 */

const STEAMSPY_TOP = "https://steamspy.com/api.php?request=top100in2weeks";
const STEAM_APPDETAILS = "https://store.steampowered.com/api/appdetails";

export async function fetchPopularSteamAppIds(limit = 10): Promise<number[]> {
  const res = await fetch(STEAMSPY_TOP, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`SteamSpy respondeu ${res.status}`);
  const data = (await res.json()) as Record<string, unknown>;
  return Object.keys(data)
    .map(Number)
    .filter((id) => Number.isFinite(id))
    .slice(0, limit);
}

export interface SteamAppDetails {
  name: string;
  header_image: string;
  short_description: string;
  genres?: { description: string }[];
  pc_requirements?: { minimum?: string; recommended?: string };
  platforms?: { windows: boolean; mac: boolean; linux: boolean };
}

export async function fetchSteamAppDetails(appId: number): Promise<SteamAppDetails | null> {
  const res = await fetch(`${STEAM_APPDETAILS}?appids=${appId}&l=brazilian`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as Record<string, { success: boolean; data: SteamAppDetails }>;
  const entry = json[String(appId)];
  if (!entry?.success) return null;
  return entry.data;
}
