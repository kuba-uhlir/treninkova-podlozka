import cardsData from '../content/cards.json';
import { saveProfile } from './profiles.js';

// ---- týden: Po až Ne, hvězdička za každý den s tréninkem ----
export const dayKey = (t) => { const d = new Date(t); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
const DAYS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
export const WEEK_GOAL = 3;

/** Sedm dnů aktuálního týdne (pondělí první) s údajem, jestli se trénovalo, a nejvyšším počtem hvězd. */
export function weekOf(history, now = Date.now()) {
  const d = new Date(now); d.setHours(0, 0, 0, 0);
  const monday = new Date(d); monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday); day.setDate(monday.getDate() + i);
    const key = dayKey(day);
    const list = history.filter((e) => dayKey(e.date) === key);
    days.push({ label: DAYS[i], num: day.getDate(), month: day.getMonth() + 1, trained: list.length > 0, stars: list.reduce((m, e) => Math.max(m, e.stars || 0), 0), today: key === dayKey(now), future: day > d });
  }
  return days;
}

// ---- denní výzva: jedna za den, dítě ji odklikne po splnění (+XP) ----
export const CHALLENGES = [
  'Udělej 10 přeskoků míče na každou nohu',
  'Zkus 20 dotyků chodidlem na místě, co nejrychleji',
  'Proveď míč kolem celé podložky po čtverečcích',
  'Udrž míč pod kontrolou 30 sekund bez zastavení',
  'Zkus trefit číslo na podložce 5krát za sebou',
  'Slabší nohou udělej 15 tlaků a přitažení míče',
  'Zkus cvik se zavřenýma očima, rodič hlídá (jen 3 dotyky)',
  'Nauč někoho doma jeden cvik z aplikace',
  'Udělej 8 kolečkových otočení míče kolem sebe',
  'Zahraj si s tátou nebo mámou nahrávku na podložce 10krát',
];
export const CHALLENGE_XP = 15;
export const challengeOf = (now = Date.now()) => CHALLENGES[dayKey(now) % CHALLENGES.length];
export const challengeDone = (p, now = Date.now()) => p.challengeDay === dayKey(now);
export async function completeChallenge(p) {
  if (challengeDone(p)) return false;
  p.challengeDay = dayKey(Date.now()); p.xp = (p.xp || 0) + CHALLENGE_XP; p.challengeCount = (p.challengeCount || 0) + 1;
  await saveProfile(p); return true;
}

// ---- rozcvička jen při prvním tréninku dne ----
export const warmupNeeded = (p) => p.warmupDay !== dayKey(Date.now());
export async function markWarmup(p) { if (p.warmupDay !== dayKey(Date.now())) p.warmupCount = (p.warmupCount || 0) + 1; p.warmupDay = dayKey(Date.now()); await saveProfile(p); }
export const WARMUP = [
  { name: 'Kroužení kotníků', text: 'Pomalu krouží chodidlem na každé noze', sec: 20 },
  { name: 'Dřepy', text: 'Záda rovně, kolena nad špičkami', sec: 20 },
  { name: 'Výpady', text: 'Střídej nohy, pomalu a rovně', sec: 20 },
  { name: 'Poskoky na místě', text: 'Lehce na špičkách, ruce uvolněné', sec: 20 },
  { name: 'Protažení lýtek', text: 'Špička nahoru, drž a dýchej', sec: 20 },
];

// ---- sběratelské karty ----
export const RARITY = {
  common: { name: 'Základní', a: '#9AA3B2', b: '#4A5160', w: 60 },
  rare: { name: 'Vzácná', a: '#38BDF8', b: '#0B5E8A', w: 25 },
  epic: { name: 'Epická', a: '#C46BFF', b: '#5B1E9C', w: 11 },
  legend: { name: 'Legendární', a: '#FFD400', b: '#B07A00', w: 4 },
};
export const rarityOf = (c) => (c.rating >= 94 ? 'legend' : c.rating >= 91 ? 'epic' : c.rating >= 88 ? 'rare' : 'common');
export const allCards = () => cardsData.map((c) => ({ ...c, rarity: rarityOf(c) }));
export const cardCount = (p) => Object.keys(p.cards || {}).length;

/** Vylosuje kartu (vzácnější je řidší; ještě nemáte = větší šance). Vrací { card, isNew }. */
export async function openPack(p) {
  const owned = p.cards || {};
  const list = allCards();
  const weight = (c) => RARITY[c.rarity].w * (owned[c.id] ? 0.35 : 1);
  let r = Math.random() * list.reduce((a, c) => a + weight(c), 0);
  let pick = list[0];
  for (const c of list) { r -= weight(c); if (r <= 0) { pick = c; break; } }
  const isNew = !owned[pick.id];
  p.cards = { ...owned, [pick.id]: (owned[pick.id] || 0) + 1 };
  await saveProfile(p);
  return { card: pick, isNew };
}

// ---- rekordy ze zápasu (počet opakování za čas) ----
export async function saveRecord(p, drillId, count) {
  p.records = p.records || {};
  const prev = p.records[drillId] || 0;
  if (count > prev) { p.records[drillId] = count; await saveProfile(p); return true; }
  return false;
}

/** Spustí trénink; při prvním tréninku dne před ním proběhne rozcvička. */
export const launch = (go, profile, params) => (warmupNeeded(profile) ? go('warmup', { profile, next: params }) : go('player', params));

// ---- rub karty: zajímavost (ručně psaná, jinak krátký popis z české Wikipedie) ----
import factsData from '../content/facts.json';
import biosData from '../content/bios.json';
export const bioOf = (c) => biosData[c.id] || factsData[c.id] || '';
export const bioSource = (c) => (biosData[c.id] ? 'Text: Wikipedie (cs), CC BY-SA 4.0' : '');
/** Krátká zajímavost na rubu karty: ručně psaná, jinak první věta popisu. */
export const factOf = (c) => factsData[c.id] || (biosData[c.id] ? (biosData[c.id].match(/[^.!?]+[.!?]+/) || [''])[0].trim() : '');
export const factSource = () => '';
