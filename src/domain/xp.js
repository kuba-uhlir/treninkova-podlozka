// XP, level a hodnosti. Level n vyžaduje celkem 40*(n-1)*n/2 XP (2: 40, 3: 120, 4: 240, 5: 400 …).
export const XP_PER_DRILL = 10;
export const XP_WORKOUT_BONUS = 20;
export const MAX_LEVEL = 12;

export const RANKS = [
  'Nováček', 'Žáček', 'Mladý talent', 'Šikula', 'Střelec', 'Záložník',
  'Útočník', 'Kapitán', 'Hvězda', 'Mistr', 'Legenda', 'Fotbalová ikona',
];
export const rankOf = (level) => RANKS[Math.min(Math.max(level, 1), RANKS.length) - 1];

/** Celkové XP potřebné pro dosažení levelu n (level 1 = 0 XP). */
export const xpForLevel = (n) => 40 * (n - 1) * n / 2;

export function levelInfo(xp) {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level++;
  const base = xpForLevel(level);
  const next = level >= MAX_LEVEL ? base : xpForLevel(level + 1);
  return { level, base, next, rank: rankOf(level), progress: next === base ? 1 : Math.min(1, (xp - base) / (next - base)), maxed: level >= MAX_LEVEL };
}

export const stars = (done, total) => (done >= total ? 3 : done >= total * 0.6 ? 2 : 1);
