import { db } from "./db";
import { getDetonadoSource, urlMatchesSource } from "./detonado-sources";
import { fetchArticleText } from "./detonado-research";
import { searchSteamAppByName } from "./steam";
import { generateDetonadoContent } from "./gemini";
import { LOCALES } from "./constants";
import type { PlatformType } from "./constants";

export interface ResearchDetonadoInput {
  gameTitle: string;
  platforms: PlatformType[];
  sourceKey: string;
  sourceUrl: string;
  existingGameId?: string;
  createdById: string;
}

export class InvalidSourceUrlError extends Error {
  constructor() {
    super("A URL informada não pertence à fonte selecionada.");
    this.name = "InvalidSourceUrlError";
  }
}

/**
 * Pesquisa um detonado sob demanda: busca o artigo colado pelo admin/mod,
 * reescreve e traduz com o Gemini (1 chamada, 7 idiomas), tenta achar a
 * imagem oficial na Steam, e grava tudo como uma DetonadoSubmission
 * pendente de aprovação. Não cria nem altera nenhum Game diretamente — isso
 * só acontece na aprovação (veja src/app/api/admin/detonados/[id]/approve).
 */
export async function researchDetonado(input: ResearchDetonadoInput) {
  const source = getDetonadoSource(input.sourceKey);
  if (!source) throw new Error("Fonte desconhecida.");
  if (!urlMatchesSource(input.sourceUrl, source)) throw new InvalidSourceUrlError();

  const { text: rawExtract } = await fetchArticleText(input.sourceUrl);

  const steamMatch = await searchSteamAppByName(input.gameTitle).catch(() => null);

  const translations = await generateDetonadoContent({
    gameTitle: input.gameTitle,
    platforms: input.platforms,
    sourceName: source.name,
    rawExtract,
  });

  const submission = await db.detonadoSubmission.create({
    data: {
      existingGameId: input.existingGameId,
      gameTitle: input.gameTitle,
      platforms: JSON.stringify(input.platforms),
      sourceKey: source.key,
      sourceUrl: input.sourceUrl,
      sourceLanguage: source.language,
      rawExtract,
      headerImage: steamMatch?.headerImage,
      createdById: input.createdById,
      translations: {
        create: LOCALES.map((locale) => ({
          locale,
          title: translations[locale].title,
          shortDescription: translations[locale].shortDescription,
          detonado: translations[locale].detonado,
        })),
      },
    },
    include: { translations: true },
  });

  return submission;
}
