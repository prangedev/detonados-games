"use client";

import { useEffect } from "react";

const COOKIE_NAME = "dg_interests";
const MAX_GENRES = 15;
const COOKIE_DAYS = 180;

function readInterests(): Record<string, number> {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  if (!match) return {};
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return {};
  }
}

function writeInterests(interests: Record<string, number>) {
  const entries = Object.entries(interests)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_GENRES);
  const trimmed = Object.fromEntries(entries);
  const value = encodeURIComponent(JSON.stringify(trimmed));
  const maxAge = COOKIE_DAYS * 24 * 60 * 60;
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${maxAge}; samesite=lax`;
}

/**
 * Registra, num cookie de primeira parte (não é usado para publicidade nem
 * compartilhado com terceiros), quais gêneros o visitante mais visualiza.
 * O Feed (/feed) lê esse cookie no servidor para sugerir jogos parecidos —
 * inclusive para quem não está logado. Ver /faq para a explicação completa.
 */
export function InterestTracker({ genres }: { genres: string[] }) {
  useEffect(() => {
    if (genres.length === 0) return;
    const interests = readInterests();
    for (const genre of genres) {
      interests[genre] = (interests[genre] ?? 0) + 1;
    }
    writeInterests(interests);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genres.join(",")]);

  return null;
}
