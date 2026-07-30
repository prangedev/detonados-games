/**
 * Jogos grátis por tempo limitado, via GamerPower (gamerpower.com/api) —
 * API pública e gratuita que agrega giveaways de jogos das principais
 * lojas (Steam, Epic Games, GOG, PlayStation, Xbox). Não precisa de chave.
 *
 * Atribuição: os dados vêm da GamerPower; a interface credita a fonte e
 * linka de volta para gamerpower.com em cada oferta.
 */

export interface FreeGameOffer {
  id: number;
  title: string;
  worth: string;
  thumbnail: string;
  description: string;
  platforms: string;
  endDate: string; // "N/A" quando não informado pela loja
  store: string; // Steam, Epic Games Store, GOG, etc.
  openUrl: string; // link de resgate (redireciona pela GamerPower)
  gamerpowerUrl: string; // página da oferta na GamerPower
}

interface GamerPowerRaw {
  id: number;
  title: string;
  worth: string;
  thumbnail: string;
  description: string;
  platforms: string;
  end_date: string;
  open_giveaway_url: string;
  gamerpower_url: string;
}

export async function fetchFreeGameOffers(): Promise<FreeGameOffer[]> {
  try {
    const res = await fetch("https://www.gamerpower.com/api/giveaways?type=game", {
      next: { revalidate: 1800 }, // 30 minutos
    });
    if (!res.ok) return [];

    const data = (await res.json()) as GamerPowerRaw[];

    return data.map((g) => ({
      id: g.id,
      title: g.title,
      worth: g.worth,
      thumbnail: g.thumbnail,
      description: g.description,
      platforms: g.platforms,
      endDate: g.end_date,
      store: guessStore(g.platforms, g.title),
      openUrl: g.open_giveaway_url,
      gamerpowerUrl: g.gamerpower_url,
    }));
  } catch {
    return [];
  }
}

const KNOWN_STORES = ["Steam", "Epic Games", "GOG", "PlayStation", "Xbox", "itch.io", "Ubisoft", "Origin"];

function guessStore(platforms: string, title: string): string {
  const haystack = `${platforms} ${title}`.toLowerCase();
  for (const store of KNOWN_STORES) {
    if (haystack.includes(store.toLowerCase())) return store;
  }
  return "Outra loja";
}
