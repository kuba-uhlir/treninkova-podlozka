import { storage, uid } from '../storage/index.js';
import { levelInfo, rankOf, MAX_LEVEL } from './xp.js';

export const AVATARS = [0, 1, 2, 3, 4, 5, 6, 7]; // indexy gradientů v ui/dom.js
// Sytá základní paleta + moderní odstíny (barvy dresu bez týmu)
export const COLORS = [
  "#E10600", "#FF6A00", "#FFD100", "#00A650", "#0057FF", "#0B2A6F", "#151515", "#F2F2F2",
  "#00B3A4", "#00A3FF", "#6A2BD9", "#E6007E", "#A6E22E", "#7A0019",
];

export const listProfiles = () => storage.list('profiles');
export const getProfile = (id) => storage.get('profiles', id);

export async function createProfile({ name = '', avatar = AVATARS[0], color = COLORS[0], color2 = '#FFFFFF', jersey = '', photo = null, team = null, hand = 'right', isGuest = false, face = 0 }) {
  const p = { id: uid(), name: name || (isGuest ? 'Host' : 'Hráč'), avatar, color, color2, jersey, photo, team, hand, isGuest, face, xp: 0, level: 1, createdAt: Date.now() };
  await storage.put('profiles', p);
  return p;
}
export const saveProfile = (p) => storage.put('profiles', p);

export async function deleteProfile(id) {
  await storage.remove('profiles', id);
  const h = await storage.list('history');
  for (const e of h.filter((x) => x.profileId === id)) await storage.remove('history', e.id);
}

export async function addHistory(profileId, entry) {
  await storage.put('history', { id: uid(), profileId, date: Date.now(), ...entry });
  const p = await getProfile(profileId);
  if (p) { p.xp += entry.xp; await saveProfile(p); }
}
export async function listHistory(profileId) {
  return (await storage.list('history')).filter((e) => e.profileId === profileId).sort((a, b) => b.date - a.date);
}
/**
 * Level hráče nastavuje rodič (p.level); XP se jen sbírá pro odměny. Starý profil bez p.level dostane level podle XP.
 * suggested = jaký level by odpovídal nasbíraným XP (rodič ho vidí jako doporučení).
 */
export const profileLevel = (p) => {
  const suggested = levelInfo(p.xp || 0).level;
  const level = Math.min(MAX_LEVEL, Math.max(1, p.level != null ? p.level : suggested));
  return { level, rank: rankOf(level), maxed: level >= MAX_LEVEL, suggested };
};
