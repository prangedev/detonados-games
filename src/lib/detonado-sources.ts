// Fontes usadas pela pesquisa de detonados em /admin/detonados
// (src/lib/detonado-pipeline.ts). Lista fixa, editada só por quem mexe no
// código — não é uma tabela do banco, igual PLATFORMS/RARITIES em
// src/lib/constants.ts.
//
// O Admin/Moderador escolhe uma fonte e cola a URL de um artigo específico
// já encontrado manualmente nela; o servidor valida que a URL pertence ao
// domínio da fonte escolhida antes de buscar o conteúdo (evita virar um
// proxy de busca de URL arbitrária).

export interface DetonadoSource {
  key: string;
  name: string;
  baseUrl: string;
  language: "pt" | "es";
}

export const DETONADO_SOURCES: DetonadoSource[] = [
  { key: "ign-br", name: "IGN Brasil", baseUrl: "https://br.ign.com", language: "pt" },
  { key: "voxel", name: "Voxel", baseUrl: "https://www.voxel.com.br", language: "pt" },
  { key: "eurogamer-pt", name: "Eurogamer Portugal", baseUrl: "https://www.eurogamer.pt", language: "pt" },
  { key: "meups", name: "MeuPS", baseUrl: "https://meups.com.br", language: "pt" },
  { key: "flow-games", name: "Flow Games", baseUrl: "https://flowgames.gg", language: "pt" },
  { key: "techtudo-jogos", name: "TechTudo Jogos", baseUrl: "https://www.techtudo.com.br/jogos", language: "pt" },
  { key: "xbox-power", name: "Xbox Power", baseUrl: "https://xboxpower.com.br", language: "pt" },
  { key: "gameblast", name: "GameBlast", baseUrl: "https://www.gameblast.com.br", language: "pt" },
  { key: "vandal", name: "Vandal", baseUrl: "https://vandal.elespanol.com", language: "es" },
  { key: "3djuegos", name: "3DJuegos", baseUrl: "https://www.3djuegos.com", language: "es" },
];

export function getDetonadoSource(key: string): DetonadoSource | undefined {
  return DETONADO_SOURCES.find((s) => s.key === key);
}

/** Confere se a URL colada realmente pertence ao domínio da fonte escolhida. */
export function urlMatchesSource(url: string, source: DetonadoSource): boolean {
  try {
    const target = new URL(url);
    const sourceHost = new URL(source.baseUrl).hostname.replace(/^www\./, "");
    const targetHost = target.hostname.replace(/^www\./, "");
    return target.protocol === "https:" && (targetHost === sourceHost || targetHost.endsWith(`.${sourceHost}`));
  } catch {
    return false;
  }
}
