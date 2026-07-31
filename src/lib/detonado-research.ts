import * as cheerio from "cheerio";

/**
 * Tamanho máximo do texto extraído enviado ao Gemini. Corta o artigo antes
 * do prompt para controlar o uso de tokens (mais barato/rápido no plano
 * gratuito) — o objetivo é ter fatos suficientes pro Gemini reescrever, não
 * reproduzir o artigo inteiro.
 */
const MAX_EXTRACT_LENGTH = 6000;

export interface FetchedArticle {
  text: string;
}

/**
 * Busca uma página de artigo e extrai o texto principal, sem navegador
 * headless (decisão de arquitetura já usada em src/lib/steam.ts — "Sem
 * Puppeteer"). Heurística: pega o bloco com mais texto entre <article>,
 * <main> e o <body>, remove nav/menu/script/style/ads.
 */
export async function fetchArticleText(url: string): Promise<FetchedArticle> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; DetonaGamesBot/1.0)" },
  });
  if (!res.ok) {
    throw new Error(`Não foi possível buscar a URL (status ${res.status}).`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  $("script, style, nav, header, footer, aside, form, iframe, noscript").remove();
  $('[class*="ad"], [class*="cookie"], [class*="newsletter"], [class*="share"], [class*="comment"]').remove();

  const candidates = $("article, main, [role='main']").toArray();
  let bestText = "";
  for (const el of candidates) {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length > bestText.length) bestText = text;
  }

  if (!bestText) {
    bestText = $("body").text().replace(/\s+/g, " ").trim();
  }

  if (!bestText) {
    throw new Error("Não foi possível extrair texto dessa página.");
  }

  return { text: bestText.slice(0, MAX_EXTRACT_LENGTH) };
}
