import drills from '../content/drills.json';
import { patternFor } from '../config/mats.js';

export const allDrills = () => drills;
export const REST_SEC = 15;

/** Slabší noha podle dominantní ruky/nohy hráče: pravák → levá noha, levák → pravá. */
export const weakFootOf = (hand) => (hand === 'left' ? 'right' : 'left');

/**
 * Sestaví trénink: vybere cviky (obtížnost) a dokud nevyplní zadané minuty, bere je v pořadí váženého losu.
 * difficulty: 'auto' (podle levelu hráče) nebo 1/2/3 = nejvýše tato úroveň cviků.
 * hand: 'right' | 'left' – hlavní noha dostává zhruba 80 % cviků na jednu nohu; slabší noha jen občas (max. ~20 % tréninku), ať na ni hráč úplně nezapomene.
 */
export function buildWorkout(minutes, playerLevel = 1, mat, difficulty = 'auto', hand = 'right') {
  const maxLevel = difficulty === 'auto' ? Math.min(MAX_DRILL_LEVEL, Math.ceil(playerLevel / 2) + 1) : Number(difficulty);
  const pool = drills.filter((d) => d.level <= maxLevel && (!mat || patternFor(d, mat)));
  if (!pool.length) return [];
  const weak = weakFootOf(hand);
  // slabší noha víc; v automatickém režimu navíc začátečník dostává víc lehčích cviků
  const lowBias = (d) => (difficulty === 'auto' ? 1 + Math.max(0, maxLevel - d.level) * 0.35 : 1);
  const weight = (d) => (d.foot === weak ? 0.25 : 1) * lowBias(d);
  // vážený los bez vracení: klíč = náhoda^(1/váha), řadí se sestupně
  const order = pool.map((d) => ({ d, k: Math.pow(Math.random(), 1 / weight(d)) })).sort((x, y) => y.k - x.k).map((x) => x.d);
  const target = minutes * 60;
  const list = [];
  let total = 0;
  let i = 0;
  let weakN = 0;
  while (total < target && list.length < 14) {
    // slabší noha jen když tvoří nejvýš ~20 % tréninku; jinak se vezme další cvik v pořadí
    let k = 0;
    while (k < order.length && order[(i + k) % order.length].foot === weak && (weakN + 1) / (list.length + 1) > 0.2) k++;
    if (k >= order.length) k = 0;
    const d = order[(i + k) % order.length];
    i += k;
    if (d.foot === weak) weakN++;
    list.push(d);
    total += d.durationSec + REST_SEC + 8; // + ukázka a odpočet
    i++;
  }
  return list;
}

/** Délka jednoho úderu v ms (mul = násobek tempa z nastavení). */
export const beatMs = (d, mul = 1) => Math.round(60000 / (d.tempoBpm * mul));

export const MAX_DRILL_LEVEL = 4;
export const LEVEL_NAMES = { 1: "Začátečník", 2: "Pokročilý", 3: "Těžké", 4: "Expert" };

/** Automatické tempo podle levelu hráče: nováček je pomalejší (0,65×), s každým levelem rychleji až 1,15×. */
export const autoTempo = (level) => Math.round(Math.min(1.15, 0.65 + 0.06 * (Math.max(1, level) - 1)) * 100) / 100;
/** Výsledné tempo: ruční násobek z nastavení, nebo automatické podle levelu. */
export const tempoFor = (settings, level) => (settings.tempoMode === "manual" ? settings.tempoMul : autoTempo(level));
export const tempoLabel = (mul) => (mul < 0.8 ? "Pomalu" : mul < 1.05 ? "Střední tempo" : "Rychle");
export const TYPE_NAMES = { ball: 'Míč', jump: 'Přeskoky', step: 'Kroky' };
export const drillType = (d) => d.type || 'ball';

/** Trénink z vlastního výběru: vybrané cviky v pořadí knihovny, opakují se (kola), dokud se nevyplní zadané minuty. */
export function workoutFromSelection(ids, minutes) {
  const chosen = drills.filter((d) => ids.includes(d.id));
  if (!chosen.length) return [];
  const list = [];
  let total = 0;
  while (total < minutes * 60 && list.length < 14) {
    for (const d of chosen) {
      if (list.length >= 14 || (total >= minutes * 60 && list.length >= chosen.length)) break;
      list.push(d);
      total += d.durationSec + REST_SEC + 8;
    }
  }
  return list;
}
