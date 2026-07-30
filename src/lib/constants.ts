// Listas de valores permitidos. O SQLite não suporta enum nativo no Prisma,
// então os campos correspondentes no schema são String e validados aqui.

export const PLATFORMS = [
  "PC",
  "MOBILE",
  "PS5",
  "PS4",
  "XBOX_SERIES",
  "XBOX_ONE",
  "SWITCH",
] as const;
export type PlatformType = (typeof PLATFORMS)[number];

export const PLATFORM_LABELS: Record<PlatformType, string> = {
  PC: "PC",
  MOBILE: "Mobile",
  PS5: "PS5",
  PS4: "PS4",
  XBOX_SERIES: "Xbox Series",
  XBOX_ONE: "Xbox One",
  SWITCH: "Switch",
};

export const RARITIES = ["COMUM", "RARA", "EPICA", "LENDARIA"] as const;
export type RarityType = (typeof RARITIES)[number];

export const RARITY_XP: Record<RarityType, number> = {
  COMUM: 10,
  RARA: 50,
  EPICA: 150,
  LENDARIA: 500,
};

export const RARITY_ORDER: Record<RarityType, number> = {
  COMUM: 0,
  RARA: 1,
  EPICA: 2,
  LENDARIA: 3,
};

export const SHIFTS = ["MORNING", "AFTERNOON", "EVENING"] as const;
export type ShiftType = (typeof SHIFTS)[number];

export const SHIFT_HOURS: Record<ShiftType, number> = {
  MORNING: 9,
  AFTERNOON: 15,
  EVENING: 21,
};

export const GAMES_PER_SHIFT = 2;

export const NOTIFICATION_TYPES = [
  "ACHIEVEMENT",
  "NEW_GAME",
  "LEVEL_UP",
  "SYSTEM",
] as const;
export type NotificationTypeValue = (typeof NOTIFICATION_TYPES)[number];

export const PROTONDB_TIERS = [
  "borked",
  "bronze",
  "silver",
  "gold",
  "platinum",
  "native",
] as const;
export type ProtonDbTier = (typeof PROTONDB_TIERS)[number];

export const LOCALES = ["pt-BR", "en", "es", "fr", "de", "ja", "ko"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_META: Record<Locale, { label: string; flag: string }> = {
  "pt-BR": { label: "Português", flag: "🇧🇷" },
  en: { label: "English", flag: "🇺🇸" },
  es: { label: "Español", flag: "🇪🇸" },
  fr: { label: "Français", flag: "🇫🇷" },
  de: { label: "Deutsch", flag: "🇩🇪" },
  ja: { label: "日本語", flag: "🇯🇵" },
  ko: { label: "한국어", flag: "🇰🇷" },
};

export const HARDWARE_VERDICTS = ["GOOD", "WARNING", "BAD"] as const;
export type HardwareVerdict = (typeof HARDWARE_VERDICTS)[number];

// DRAFT: sincronizado da Steam, aguardando ser encaixado num turno.
// SCHEDULED: já tem turno/data definidos, aguardando publicação pelo cron.
// PUBLISHED: visível publicamente no catálogo.
export const RELEASE_STATUSES = ["DRAFT", "SCHEDULED", "PUBLISHED"] as const;
export type ReleaseStatus = (typeof RELEASE_STATUSES)[number];

// Regras de XP por ação (veja src/lib/achievements.ts)
export const XP_RULES = {
  DAILY_LOGIN: 15,
  FIRST_COMMENT_ON_GAME: 50,
  FIRST_RATING_ON_GAME: 50,
} as const;

// Pontos da loja: a cada 100 XP acumulado, 1 Ponto fica disponível.
export const XP_PER_POINT = 100;
