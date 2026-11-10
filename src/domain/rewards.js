// Odměny: medaile, poháry, štíty, koruny a další. Odemykají se za XP, tréninky, pravidelnost i dovednosti.
// Úroveň (level, hodnost) s odměnami nesouvisí, tu nastavuje rodič.
import { allDrills } from './trainer.js';

export const TIERS = {
  bronze: { name: 'Bronzová', a: '#F0AE78', b: '#A9632D' },
  silver: { name: 'Stříbrná', a: '#F4F7FA', b: '#98A4B1' },
  gold: { name: 'Zlatá', a: '#FFE785', b: '#E0A400' },
  diamond: { name: 'Diamantová', a: '#C4F1FF', b: '#3BA6E6' },
};

export const CATEGORIES = [
  { id: 'xp', name: 'Za XP' },
  { id: 'trainings', name: 'Za tréninky' },
  { id: 'streak', name: 'Za pravidelnost' },
  { id: 'skill', name: 'Za dovednosti' },
  { id: 'match', name: 'Za zápasy' },
  { id: 'cards', name: 'Za karty' },
  { id: 'daily', name: 'Za výzvy a rozcvičku' },
];

// unit = klíč do statistik: xp | trainings | stars3 | streak | days | minutes | early | drills | jump | step | l3 | l4 | weak
const R = (id, cat, name, kind, tier, unit, need, desc) => ({ id, cat, name, kind, tier, unit, need, desc });
export const REWARDS = [
  // za XP
  R('xp-50', 'xp', 'Bronzová medaile', 'medal', 'bronze', 'xp', 50, '50 XP'),
  R('xp-150', 'xp', 'Stříbrná medaile', 'medal', 'silver', 'xp', 150, '150 XP'),
  R('xp-300', 'xp', 'Zlatá medaile', 'medal', 'gold', 'xp', 300, '300 XP'),
  R('xp-500', 'xp', 'Bronzový pohár', 'trophy', 'bronze', 'xp', 500, '500 XP'),
  R('xp-800', 'xp', 'Stříbrný pohár', 'trophy', 'silver', 'xp', 800, '800 XP'),
  R('xp-1200', 'xp', 'Zlatý pohár', 'trophy', 'gold', 'xp', 1200, '1200 XP'),
  R('xp-2000', 'xp', 'Zlatý míč', 'ball', 'gold', 'xp', 2000, '2000 XP'),
  R('xp-3500', 'xp', 'Diamantová hvězda', 'star', 'diamond', 'xp', 3500, '3500 XP'),
  // za tréninky
  R('tr-1', 'trainings', 'První trénink', 'medal', 'bronze', 'trainings', 1, 'Dokonči první trénink'),
  R('tr-3', 'trainings', 'Třikrát na podložce', 'medal', 'bronze', 'trainings', 3, '3 tréninky'),
  R('tr-5', 'trainings', 'Pětkrát na podložce', 'medal', 'silver', 'trainings', 5, '5 tréninků'),
  R('tr-10', 'trainings', 'Deset tréninků', 'medal', 'gold', 'trainings', 10, '10 tréninků'),
  R('tr-25', 'trainings', 'Pětadvacítka', 'trophy', 'silver', 'trainings', 25, '25 tréninků'),
  R('tr-50', 'trainings', 'Padesátka', 'trophy', 'gold', 'trainings', 50, '50 tréninků'),
  R('tr-100', 'trainings', 'Stovka!', 'crown', 'diamond', 'trainings', 100, '100 tréninků'),
  // za pravidelnost
  R('strk-2', 'streak', 'Dva dny v řadě', 'flame', 'bronze', 'streak', 2, 'Trénuj 2 dny po sobě'),
  R('strk-3', 'streak', 'Tři dny v řadě', 'flame', 'silver', 'streak', 3, 'Trénuj 3 dny po sobě'),
  R('strk-7', 'streak', 'Týden v řadě', 'flame', 'gold', 'streak', 7, 'Trénuj 7 dní po sobě'),
  R('early', 'streak', 'Ranní ptáče', 'sunrise', 'gold', 'early', 1, 'Trénink před 9. hodinou'),
  R('min-60', 'streak', 'Hodina na podložce', 'clock', 'silver', 'minutes', 60, '60 minut cvičení'),
  R('min-300', 'streak', 'Pět hodin cvičení', 'clock', 'gold', 'minutes', 300, '300 minut cvičení'),
  R('days-10', 'streak', 'Deset různých dnů', 'shield', 'silver', 'days', 10, 'Trénuj v 10 různých dnech'),
  // za dovednosti
  R('st-1', 'skill', 'Tři hvězdy', 'star', 'gold', 'stars3', 1, 'Trénink se 3 hvězdami'),
  R('st-10', 'skill', 'Hvězdný hráč', 'star', 'diamond', 'stars3', 10, '10× tři hvězdy'),
  R('jump-1', 'skill', 'Skokan', 'boot', 'bronze', 'jump', 1, 'Přeskoky míče'),
  R('step-1', 'skill', 'Twister', 'boot', 'silver', 'step', 1, 'Kroky po číslech'),
  R('l3-1', 'skill', 'Těžký soupeř', 'shield', 'silver', 'l3', 1, 'Těžký cvik'),
  R('l4-1', 'skill', 'Expert', 'crown', 'gold', 'l4', 1, 'Cvik úrovně Expert'),
  R('weak-10', 'skill', 'Slabší noha', 'boot', 'silver', 'weak', 10, '10 cviků na slabší nohu'),
  R('weak-30', 'skill', 'Obě nohy jako jedna', 'boot', 'gold', 'weak', 30, '30 cviků na slabší nohu'),
  R('drl-10', 'skill', 'Zvědavec', 'shield', 'bronze', 'drills', 10, '10 různých cviků'),
  R('drl-20', 'skill', 'Objevitel', 'shield', 'silver', 'drills', 20, '20 různých cviků'),
  R('drl-all', 'skill', 'Mistr cviků', 'crown', 'diamond', 'drills', 36, 'Všechny cviky'),
  // další za XP
  R('xp-20', 'xp', 'První krůček', 'medal', 'bronze', 'xp', 20, '20 XP'),
  R('xp-1600', 'xp', 'Stříbrný míč', 'ball', 'silver', 'xp', 1600, '1600 XP'),
  R('xp-5000', 'xp', 'Legendární pohár', 'trophy', 'diamond', 'xp', 5000, '5000 XP'),
  R('xp-8000', 'xp', 'Mistrovská koruna', 'crown', 'diamond', 'xp', 8000, '8000 XP'),
  // další za tréninky
  R('tr-2', 'trainings', 'Dvakrát!', 'medal', 'bronze', 'trainings', 2, '2 tréninky'),
  R('tr-15', 'trainings', 'Patnáctka', 'medal', 'silver', 'trainings', 15, '15 tréninků'),
  R('tr-75', 'trainings', 'Pětasedmdesátka', 'trophy', 'gold', 'trainings', 75, '75 tréninků'),
  R('tr-200', 'trainings', 'Dvě stovky', 'crown', 'diamond', 'trainings', 200, '200 tréninků'),
  // další za pravidelnost
  R('strk-5', 'streak', 'Pět dní v řadě', 'flame', 'silver', 'streak', 5, 'Trénuj 5 dní po sobě'),
  R('strk-14', 'streak', 'Dva týdny v řadě', 'flame', 'diamond', 'streak', 14, 'Trénuj 14 dní po sobě'),
  R('min-120', 'streak', 'Dvě hodiny cvičení', 'clock', 'silver', 'minutes', 120, '120 minut cvičení'),
  R('min-600', 'streak', 'Deset hodin cvičení', 'clock', 'diamond', 'minutes', 600, '600 minut cvičení'),
  R('days-25', 'streak', 'Pětadvacet dnů', 'shield', 'gold', 'days', 25, 'Trénuj v 25 různých dnech'),
  R('days-50', 'streak', 'Padesát dnů', 'shield', 'diamond', 'days', 50, 'Trénuj v 50 různých dnech'),
  // další za dovednosti
  R('st-3', 'skill', 'Třikrát tři hvězdy', 'star', 'silver', 'stars3', 3, '3× tři hvězdy'),
  R('st-25', 'skill', 'Hvězda hvězd', 'star', 'diamond', 'stars3', 25, '25× tři hvězdy'),
  R('l3-10', 'skill', 'Těžká váha', 'shield', 'gold', 'l3', 10, '10 těžkých cviků'),
  R('l4-10', 'skill', 'Mistr expertů', 'crown', 'gold', 'l4', 10, '10 cviků úrovně Expert'),
  R('jump-10', 'skill', 'Pružinka', 'boot', 'silver', 'jump', 10, '10 přeskoků míče'),
  R('jump-30', 'skill', 'Klokan', 'boot', 'gold', 'jump', 30, '30 přeskoků míče'),
  R('step-10', 'skill', 'Tanečník', 'boot', 'silver', 'step', 10, '10 cviků s kroky'),
  R('step-30', 'skill', 'Král Twisteru', 'boot', 'gold', 'step', 30, '30 cviků s kroky'),
  R('weak-60', 'skill', 'Levá jako pravá', 'boot', 'diamond', 'weak', 60, '60 cviků na slabší nohu'),
  R('drl-30', 'skill', 'Znalec', 'shield', 'gold', 'drills', 30, '30 různých cviků'),
  // za zápasy
  R('mt-1', 'match', 'První zápas', 'medal', 'bronze', 'matches', 1, 'Odehraj zápas'),
  R('mt-5', 'match', 'Pět zápasů', 'medal', 'silver', 'matches', 5, '5 zápasů'),
  R('mt-15', 'match', 'Patnáct zápasů', 'trophy', 'gold', 'matches', 15, '15 zápasů'),
  R('win-1', 'match', 'První výhra', 'trophy', 'bronze', 'wins', 1, 'Vyhraj zápas s kamarádem'),
  R('win-5', 'match', 'Pětkrát vítěz', 'trophy', 'silver', 'wins', 5, '5 výher'),
  R('win-15', 'match', 'Šampion', 'crown', 'gold', 'wins', 15, '15 výher'),
  R('rec-1', 'match', 'Rekordman', 'star', 'gold', 'records', 1, 'První rekord ve cviku na čas'),
  R('rec-5', 'match', 'Sbírka rekordů', 'star', 'diamond', 'records', 5, 'Rekord v 5 cvicích'),
  // za karty
  R('card-1', 'cards', 'První karta', 'shield', 'bronze', 'cards', 1, 'Získej první kartu'),
  R('card-10', 'cards', 'Sběratel', 'shield', 'silver', 'cards', 10, '10 různých karet'),
  R('card-30', 'cards', 'Velký sběratel', 'shield', 'gold', 'cards', 30, '30 různých karet'),
  R('card-60', 'cards', 'Král sběratelů', 'crown', 'diamond', 'cards', 60, '60 různých karet'),
  R('card-100', 'cards', 'Muzeum fotbalu', 'crown', 'diamond', 'cards', 100, '100 různých karet'),
  // za výzvy a rozcvičku
  R('ch-1', 'daily', 'Výzva splněna', 'flame', 'bronze', 'challenges', 1, 'Splň první výzvu dne'),
  R('ch-7', 'daily', 'Týden výzev', 'flame', 'silver', 'challenges', 7, '7 výzev dne'),
  R('ch-30', 'daily', 'Mistr výzev', 'flame', 'gold', 'challenges', 30, '30 výzev dne'),
  R('wu-5', 'daily', 'Zahřátý', 'sunrise', 'bronze', 'warmups', 5, '5 rozcviček'),
  R('wu-20', 'daily', 'Vždy rozcvičený', 'sunrise', 'silver', 'warmups', 20, '20 rozcviček'),
];

export const UNIT_LABEL = {
  xp: 'XP', trainings: 'tréninků', stars3: '× 3 hvězdy', streak: 'dnů v řadě', days: 'různých dnů', minutes: 'minut',
  early: '', drills: 'různých cviků', jump: 'přeskoků', step: 'cviků s kroky', l3: 'těžkých cviků', l4: 'cviků Expert', weak: 'cviků na slabší nohu',
  matches: 'zápasů', wins: 'výher', records: 'rekordů', cards: 'karet', challenges: 'výzev', warmups: 'rozcviček',
};

const DRILLS = Object.fromEntries(allDrills().map((d) => [d.id, d]));
const dayKey = (t) => { const d = new Date(t); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
const dayNum = (key) => { const y = Math.floor(key / 10000); const m = Math.floor((key % 10000) / 100) - 1; const d = key % 100; return Math.round(new Date(y, m, d).getTime() / 86400000); };

/** Statistiky z historie tréninků (hand = silnější noha hráče, podle ní se počítá slabší). */
export function statsOf(history, hand = 'right', p = {}) {
  const weakFoot = hand === 'left' ? 'right' : 'left';
  const keys = [...new Set(history.map((e) => dayKey(e.date)))].map(dayNum).sort((a, b) => a - b);
  let streak = keys.length ? 1 : 0; let run = 1;
  for (let i = 1; i < keys.length; i++) { run = keys[i] === keys[i - 1] + 1 ? run + 1 : 1; streak = Math.max(streak, run); }
  const seen = new Set(); let jump = 0; let step = 0; let l3 = 0; let l4 = 0; let weak = 0;
  for (const e of history) {
    for (const id of e.drills || []) {
      const d = DRILLS[id]; if (!d) continue;
      seen.add(id);
      if (d.type === 'jump') jump++; else if (d.type === 'step') step++;
      if (d.level >= 3) l3++;
      if (d.level >= 4) l4++;
      if ((d.type || 'ball') === 'ball' && d.foot === weakFoot) weak++;
    }
  }
  return {
    trainings: history.length,
    stars3: history.filter((e) => e.stars === 3).length,
    streak, days: keys.length,
    minutes: Math.round(history.reduce((a, e) => a + (e.durationSec || 0), 0) / 60),
    early: history.some((e) => new Date(e.date).getHours() < 9) ? 1 : 0,
    drills: seen.size, jump, step, l3, l4, weak,
    matches: p.matches || 0, wins: p.matchWins || 0, records: Object.keys(p.records || {}).length,
    cards: Object.keys(p.cards || {}).length, challenges: p.challengeCount || 0, warmups: p.warmupCount || 0,
  };
}

const valueOf = (r, xp, st) => (r.unit === 'xp' ? xp : (st[r.unit] || 0));
export const isUnlocked = (r, xp, st) => valueOf(r, xp, st) >= r.need;
export const unlockedRewards = (xp, st) => REWARDS.filter((r) => isUnlocked(r, xp, st));
export const rewardProgress = (r, xp, st) => ({ value: valueOf(r, xp, st), need: r.need });

/** Nejbližší odměna za XP (pro lištu doma): jméno, kolik XP zbývá a postup mezi předchozí a touto. */
export function nextXpReward(xp) {
  const list = REWARDS.filter((r) => r.unit === 'xp').sort((a, b) => a.need - b.need);
  const next = list.find((r) => r.need > xp);
  if (!next) return null;
  const prevNeed = list.filter((r) => r.need <= xp).map((r) => r.need).pop() || 0;
  return { reward: next, remaining: next.need - xp, progress: (xp - prevNeed) / (next.need - prevNeed) };
}
