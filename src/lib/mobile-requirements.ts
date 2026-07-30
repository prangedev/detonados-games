/**
 * Requisitos mínimos para Mobile.
 *
 * Diferente da Steam (que tem uma API oficial estruturada com requisitos de
 * PC), não existe uma fonte pública equivalente para specs de RAM/CPU de
 * jogos mobile — nem a Google Play nem a App Store publicam isso de forma
 * estruturada e pesquisável por terceiros.
 *
 * O que É possível obter de fonte oficial: a versão mínima de iOS, via
 * iTunes Lookup API da Apple (pública, sem autenticação):
 * https://itunes.apple.com/search?term=...&entity=software
 *
 * Para o resto (Android, RAM, armazenamento), usamos uma estimativa
 * transparente baseada nos requisitos mínimos de PC do mesmo jogo — e
 * deixamos isso marcado como estimativa na interface, nunca como fato.
 */

import type { ParsedRequirements } from "./hardware-compat";

export interface MobileRequirements {
  iosVersion: string | null; // real, via iTunes API — null se não encontrado
  androidVersion: string; // estimativa
  ramGb: number; // estimativa
  storageGb: number; // estimativa
  estimated: boolean; // true se qualquer parte foi estimada (sempre true hoje, exceto iosVersion)
}

export async function fetchIosMinimumOsVersion(gameTitle: string): Promise<string | null> {
  try {
    const query = new URLSearchParams({
      term: gameTitle,
      entity: "software",
      limit: "1",
      country: "US",
    });
    const res = await fetch(`https://itunes.apple.com/search?${query.toString()}`, {
      next: { revalidate: 604800 }, // 7 dias — esse dado muda raramente
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { results?: { minimumOsVersion?: string; trackName?: string }[] };
    return data.results?.[0]?.minimumOsVersion ?? null;
  } catch {
    return null;
  }
}

/**
 * Estimativa heurística para Android/RAM/armazenamento, a partir dos
 * requisitos mínimos de PC do mesmo jogo (quando existem). Sem uma fonte
 * oficial, isso é deliberadamente conservador e simples — não finge
 * precisão que não existe.
 */
export function estimateMobileRequirements(pcMin: ParsedRequirements | null): {
  androidVersion: string;
  ramGb: number;
  storageGb: number;
} {
  const pcRam = pcMin?.ramGb ?? 4;
  // Versões mobile geralmente pedem bem menos RAM que a versão PC.
  const ramGb = Math.max(2, Math.min(6, Math.round(pcRam / 2)));
  const storageGb = pcMin?.storageGb ? Math.max(1, Math.round(pcMin.storageGb / 4)) : 2;

  return {
    androidVersion: "Android 8.0 ou superior",
    ramGb,
    storageGb,
  };
}

export async function buildMobileRequirements(
  gameTitle: string,
  pcMin: ParsedRequirements | null
): Promise<MobileRequirements> {
  const [iosVersion, estimate] = await Promise.all([
    fetchIosMinimumOsVersion(gameTitle),
    Promise.resolve(estimateMobileRequirements(pcMin)),
  ]);

  return {
    iosVersion,
    androidVersion: estimate.androidVersion,
    ramGb: estimate.ramGb,
    storageGb: estimate.storageGb,
    estimated: true,
  };
}
