/**
 * Sistema de XP e níveis.
 *
 * Cada nível exige progressivamente mais XP: xpForLevel(n) = 100 * n^1.5,
 * arredondado. O XP total do usuário é "gasto" nível a nível até sobrar
 * o progresso do nível atual.
 */

export function xpForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}

export interface LevelProgress {
  level: number;
  totalXp: number;
  currentLevelXp: number;
  xpToNextLevel: number;
  progressPercent: number;
}

export function computeLevelProgress(totalXp: number): LevelProgress {
  let level = 1;
  let remaining = Math.max(0, totalXp);

  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }

  const xpToNextLevel = xpForLevel(level);
  const progressPercent = Math.min(100, Math.round((remaining / xpToNextLevel) * 100));

  return {
    level,
    totalXp,
    currentLevelXp: remaining,
    xpToNextLevel,
    progressPercent,
  };
}
