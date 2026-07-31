import { GoogleGenAI, Type, ApiError } from "@google/genai";
import { getGeminiApiKey } from "./site-settings";
import { LOCALES } from "./constants";

/**
 * Modelo padrão: "flash" é o mais barato/rápido da linha Gemini, pensado
 * para caber no plano gratuito (Basic). Configurável via GEMINI_MODEL no
 * .env, sem precisar mexer em código se a Google renomear/depreciar modelos.
 */
const DEFAULT_MODEL = "gemini-2.0-flash";

export class GeminiNotConfiguredError extends Error {
  constructor() {
    super("Chave da API do Gemini não configurada. Peça a um Administrador para configurá-la em /admin/settings.");
    this.name = "GeminiNotConfiguredError";
  }
}

async function getClient(): Promise<GoogleGenAI> {
  const apiKey = await getGeminiApiKey();
  if (!apiKey) throw new GeminiNotConfiguredError();
  return new GoogleGenAI({ apiKey });
}

export interface DetonadoLocaleContent {
  title: string;
  shortDescription: string;
  detonado: string;
}

export type DetonadoTranslations = Record<string, DetonadoLocaleContent>;

interface GenerateDetonadoInput {
  gameTitle: string;
  platforms: string[];
  sourceName: string;
  rawExtract: string;
}

// Schema de resposta: um objeto com uma chave por locale suportado, cada uma
// com {title, shortDescription, detonado}. Pedir os 7 idiomas em UMA única
// chamada (em vez de 7 chamadas separadas) é o principal otimizador de cota
// do plano gratuito do Gemini.
function buildResponseSchema() {
  const localeProperties: Record<string, unknown> = {};
  for (const locale of LOCALES) {
    localeProperties[locale] = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        shortDescription: { type: Type.STRING },
        detonado: { type: Type.STRING },
      },
      required: ["title", "shortDescription", "detonado"],
    };
  }
  return {
    type: Type.OBJECT,
    properties: localeProperties,
    required: [...LOCALES],
  };
}

export async function generateDetonadoContent(
  input: GenerateDetonadoInput
): Promise<DetonadoTranslations> {
  const client = await getClient();
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  const prompt = `Você é um redator de detonados (walkthroughs) de jogos para o site Detona Games.

Jogo: ${input.gameTitle}
Plataformas: ${input.platforms.join(", ")}
Fonte usada como referência de fatos: ${input.sourceName}

Abaixo está o texto extraído de um artigo dessa fonte sobre o jogo. Use-o
SOMENTE como referência factual (mecânicas, itens, chefes, dicas, etc.).
NÃO copie frases nem a estrutura do texto original — escreva um detonado
100% original, com suas próprias palavras.

Texto de referência:
"""
${input.rawExtract}
"""

Gere, em pt-BR primeiro e depois traduzido para os outros idiomas, um objeto
JSON com uma chave para cada um destes locales: ${LOCALES.join(", ")}.
Cada locale deve ter:
- "title": título do jogo nesse idioma (mantenha nomes próprios como estão
  se não houver tradução natural).
- "shortDescription": descrição curta (1-2 frases, até 200 caracteres).
- "detonado": o detonado completo reescrito (vários parágrafos, sem copiar o
  texto de referência), traduzido de forma natural para o idioma do locale
  (não é uma tradução literal palavra-por-palavra do pt-BR — escreva como um
  falante nativo escreveria).`;

  let response;
  try {
    response = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: buildResponseSchema(),
      },
    });
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 429) {
        throw new Error(
          "Limite de uso do Gemini atingido (cota do plano gratuito). Aguarde alguns instantes e tente novamente, ou confira o plano/cota da chave em https://ai.google.dev/gemini-api/docs/rate-limits."
        );
      }
      if (err.status === 403 || err.status === 401) {
        throw new Error(
          "O Gemini recusou a chave da API (sem permissão). Gere uma chave em https://aistudio.google.com/apikey e confirme que a API Generative Language está habilitada nesse projeto."
        );
      }
      throw new Error(`Erro do Gemini (${err.status}): ${err.message}`);
    }
    throw err;
  }

  const text = response.text;
  if (!text) throw new Error("O Gemini não retornou conteúdo.");

  const parsed = JSON.parse(text) as DetonadoTranslations;
  for (const locale of LOCALES) {
    if (!parsed[locale]?.title || !parsed[locale]?.detonado) {
      throw new Error(`Resposta do Gemini incompleta para o locale ${locale}.`);
    }
  }
  return parsed;
}
