// Audio manager: hlasové hlášky průvodce, efekty, hudba; hlasitost zvlášť.
// Hlášky jsou v databázi src/content/phrases.json: "fixed" (čísla zón, odpočet) a "groups" (skupiny vět s variantami, losují se).
// Soubory: assets/audio/voice/<styl>/<klíč>.wav – oříznuté na čistou řeč (scripts/trim-voices.mjs), takže jejich délka = délka hlášky.
// Chybí-li soubor, mluví TTS zařízení.
//
// Pravidlo „nikdy neusekávat“: v jednu chvíli zní jedna hláška. Další věta počká ve frontě na skutečný konec přehrávání (událost ended),
// krátká hláška zóny se během mluvení přeskočí. Nic se nepřerušuje, kromě explicitního stopVoice().
import phrases from '../content/phrases.json';

const BASE = 'audio/';
const GROUPS = {};
const FALLBACK_TEXT = { ...phrases.fixed };
for (const [g, list] of Object.entries(phrases.groups)) {
  GROUPS[g] = list.map((_, i) => `${g}_${i + 1}`);
  list.forEach((t, i) => { FALLBACK_TEXT[`${g}_${i + 1}`] = t; });
}

// Styly hlasu: jediný nahraný hlas (Antonín); rychlost a výška tónu jsou jen pro TTS zařízení, když soubor chybí.
export const VOICE_STYLES = {
  trener: { label: 'Trenér', rate: 0.95, pitch: 0.8 },
};
const vol = { voice: 1, sfx: 0.8, music: 0.4 };
let style = 'trener';
let voiceIdx = 0;
const cache = new Map(); // url -> 'missing' (efekty)
let music = null;

export const setVolume = (ch, v) => {
  vol[ch] = Math.min(1, Math.max(0, v));
  if (ch === 'music' && music) music.volume = vol.music;
};
export const getVolume = (ch) => vol[ch];
export const setVoiceStyle = (s) => { style = VOICE_STYLES[s] ? s : 'trener'; preloadVoices(); };
export const setVoiceIndex = (i) => { voiceIdx = Math.max(0, i | 0); };

// ---- režim hlasu: 'voice' = Trenér mluví, 'beeps' = jen pípnutí, 'off' = ticho ----
let voiceMode = 'voice';
export const setVoiceMode = (m) => { voiceMode = ['voice', 'beeps', 'off'].includes(m) ? m : 'voice'; if (voiceMode !== 'voice') stopVoice(); };
export const getVoiceMode = () => voiceMode;
let actx = null;
/** Krátký tón (syntetizovaný, bez souborů): freq Hz, dur s, volitelně zpoždění a typ vlny. */
function tone(freq, dur, delay = 0, type = 'sine', gain = 0.5) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t0 = actx.currentTime + delay;
    const o = actx.createOscillator(); const g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    const peak = Math.max(0.0001, gain * vol.sfx);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + dur + 0.03);
  } catch (e) { /* bez zvuku */ }
}
/** Pípnutí místo hlášky: každá zóna má svůj tón, odpočet jsou tři krátká pípnutí a „hraj“ je delší zvonivý tón; věty mlčí. */
function beepFor(key) {
  let m;
  if ((m = /^zone_(\d)$/.exec(key))) tone(380 + Number(m[1]) * 70, 0.16, 0, 'triangle');
  else if (key === 'side_left') tone(520, 0.18, 0, 'triangle');
  else if (key === 'side_right') tone(760, 0.18, 0, 'triangle');
  else if (/^dir_/.test(key)) tone(620, 0.16, 0, 'triangle');
  else if (/^countdown_/.test(key)) tone(880, 0.14, 0, 'square', 0.28);
  else if (/^go_/.test(key)) { tone(1046, 0.16, 0, 'square', 0.28); tone(1568, 0.34, 0.14, 'square', 0.28); }
  else if (/^praise_|^keep_|^half_|^almost_/.test(key)) { tone(880, 0.1, 0, 'sine', 0.4); tone(1318, 0.16, 0.1, 'sine', 0.4); }
  else if (/^pause_/.test(key)) tone(440, 0.2, 0, 'sine', 0.4);
  else if (/^resume_/.test(key)) tone(660, 0.2, 0, 'sine', 0.4);
  else if (/^rest_|^next_|^last_/.test(key)) tone(740, 0.12, 0, 'sine', 0.35);
}

/** České hlasy dostupné v zařízení (TTS). */
export function czVoices() {
  if (!('speechSynthesis' in window)) return [];
  return speechSynthesis.getVoices().filter((v) => /^cs/i.test(v.lang));
}
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {}; // vynutí načtení seznamu hlasů

// ---- přehrávání hlasu: jedna hláška najednou, fronta vět ----
const pool = new Map();   // url -> HTMLAudioElement (přednačtené, opakovaně použité)
const missing = new Set();
let cur = null;           // právě zní: { token, kind, el? }
let tokenN = 0;
let queue = [];           // věty čekající na konec: { key, kind }
let gapTimer = null;      // krátká pauza mezi větami (ať se slova nelepí)
let lastEnd = 0;
const GAP = 120;          // ms ticha mezi větami (nahrávky mají na konci vlastní ticho ~0,6 s); odpočet/„hraj“ jen 60 ms

function voiceEl(url) {
  let a = pool.get(url);
  if (!a) { a = new Audio(url); a.preload = 'auto'; pool.set(url, a); }
  return a;
}
/** Přednačte všechny hlášky zvoleného stylu, ať je odezva okamžitá. */
export function preloadVoices() {
  if (typeof Audio === 'undefined') return;
  Object.keys(FALLBACK_TEXT).forEach((k) => voiceEl(`${BASE}voice/${style}/${k}.wav`));
}

function pump(delay) {
  if (gapTimer || cur || !queue.length) return;
  gapTimer = setTimeout(() => { gapTimer = null; if (!cur && queue.length) { const it = queue.shift(); start(it.key, it.kind); } }, delay);
}
function release(token) {
  if (!cur || cur.token !== token) return;
  cur = null; lastEnd = performance.now();
  if (queue.length) pump(queue[0].kind === 'urgent' ? 60 : GAP);
}

function speak(text, token) {
  if (!('speechSynthesis' in window) || !text || vol.voice === 0) { release(token); return; }
  const st = VOICE_STYLES[style];
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'cs-CZ'; u.volume = vol.voice; u.rate = st.rate; u.pitch = st.pitch;
  const vs = czVoices();
  if (vs.length) u.voice = vs[voiceIdx % vs.length];
  u.onend = () => release(token); u.onerror = () => release(token);
  speechSynthesis.speak(u);
  setTimeout(() => release(token), text.length * 120 + 3000); // pojistka
}

function start(key, kind) {
  const token = ++tokenN;
  cur = { token, kind };
  const url = `${BASE}voice/${style}/${key}.wav`;
  const fallback = () => { release(token); }; // bez robotického záložního hlasu: raději ticho
  if (missing.has(url)) { fallback(); return; }
  const a = voiceEl(url);
  cur.el = a;
  a.volume = vol.voice;
  try { a.currentTime = 0; } catch { /* metadata ještě nejsou */ }
  a.onended = () => release(token);
  a.onerror = () => { missing.add(url); fallback(); };
  const p = a.play();
  if (p && p.catch) p.catch((e) => {
    if (e && e.name === 'NotAllowedError') release(token); // prohlížeč ještě nepovolil zvuk (nebyl dotyk): neoznačovat jako chybějící
    else { missing.add(url); fallback(); }
  });
  setTimeout(() => release(token), 15000); // pojistka, kdyby ended nikdy nepřišlo
}

/**
 * Hlasová hláška podle klíče.
 *  kind "call"   (výchozí) krátká hláška zóny/strany: když něco zní, přeskočí se
 *  kind "phrase" věta: když něco zní, počká ve frontě (max. 2)
 *  kind "urgent" odpočet / „hraj“ / pauza: když něco zní, předběhne frontu (ale nic nepřeruší)
 */
export function say(key, opts = {}) {
  if (voiceMode === 'beeps') { beepFor(key); return; }
  if (voiceMode === 'off' || vol.voice === 0) return;
  const kind = opts.kind || 'call';
  if (cur || gapTimer) {
    if (kind === 'phrase') { queue.push({ key, kind }); if (queue.length > 2) queue.shift(); }
    else if (kind === 'urgent') queue.unshift({ key, kind });
    return; // call se přeskočí
  }
  const since = performance.now() - lastEnd;
  if (kind !== 'call' && since < GAP && lastEnd) { queue.push({ key, kind }); pump(kind === 'urgent' ? 60 : GAP - since); return; }
  start(key, kind);
}

const lastPick = {};
/** Náhodná varianta ze skupiny (nikdy 2× po sobě stejná). Výchozí je věta (řadí se do fronty). */
export function sayGroup(group, opts = {}) {
  const list = GROUPS[group];
  if (!list || !list.length) return;
  let i;
  do { i = Math.floor(Math.random() * list.length); } while (list.length > 1 && i === lastPick[group]);
  lastPick[group] = i;
  say(list[i], { kind: 'phrase', ...opts });
}
/** Zní nebo čeká nějaká hláška? (přehrávač podle toho počká s odpočtem) */
export const voiceBusy = () => !!cur || !!gapTimer || queue.length > 0;
/** Zastaví mluvení a vyprázdní frontu (jen když to chceme, např. předčasné ukončení tréninku). */
export function stopVoice() {
  queue = []; if (gapTimer) { clearTimeout(gapTimer); gapTimer = null; }
  const c = cur; cur = null;
  if (c && c.el) c.el.pause();
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
/** Ukázka hlasu průvodce v nastavení. */
export const sayDemo = () => { stopVoice(); sayGroup('welcome'); };

// ---- efekty a hudba ----
function playSimple(channel, key, ext) {
  const url = `${BASE}${channel}/${key}.${ext}`;
  if (cache.get(url) === 'missing') return Promise.reject(new Error('missing'));
  return new Promise((resolve, reject) => {
    const a = new Audio(url);
    a.volume = vol[channel];
    a.onended = resolve;
    a.onerror = () => { cache.set(url, 'missing'); reject(new Error('missing')); };
    a.play().catch(() => reject(new Error('blocked')));
  });
}
/** Zvukový efekt (když chybí soubor, tiše se přeskočí). */
export function sfx(key) { playSimple('sfx', key, 'wav').catch(() => playSimple('sfx', key, 'mp3')).catch(() => {}); }

export function playMusic(key = 'bg_main') {
  stopMusic();
  music = new Audio(`${BASE}music/${key}.mp3`);
  music.loop = true; music.volume = vol.music;
  music.play().catch(() => { music = null; });
}
export function stopMusic() { if (music) { music.pause(); music = null; } }
