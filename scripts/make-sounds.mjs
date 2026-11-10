// Syntetizuje jednoduché příjemné zvuky aplikace do assets/audio/sfx/*.wav (bez externích souborů a autorských práv).
// intro = úvodní animace (válení míče, dva odrazy, tóny k písmenům FOTBAL, závěrečný akord), success, levelup (odměna), confetti, click.
import fs from 'node:fs';

const SR = 44100;
const OUT = 'assets/audio/sfx';
fs.mkdirSync(OUT, { recursive: true });

const make = (sec) => new Float32Array(Math.ceil(sec * SR));
const mix = (buf, t0, fn, dur) => { const s0 = Math.floor(t0 * SR); const n = Math.floor(dur * SR); for (let i = 0; i < n && s0 + i < buf.length; i++) buf[s0 + i] += fn(i / SR, i); };

/** Zvonivý tón (základ + harmonické), rychlý náběh a exponenciální doznění. */
function bell(buf, t0, freq, dur, amp, harm = [1, 0.34, 0.12, 0.05]) {
  mix(buf, t0, (t) => {
    const env = Math.min(1, t / 0.006) * Math.exp(-t * (3.2 / dur));
    let v = 0;
    harm.forEach((h, k) => { v += h * Math.sin(2 * Math.PI * freq * (k + 1) * t + k * 0.4); });
    return v * env * amp;
  }, dur);
}
/** Tupý úder (odraz míče): klesající sinus + krátký šum. */
function thud(buf, t0, amp, f0 = 150, f1 = 52) {
  mix(buf, t0, (t) => {
    const f = f1 + (f0 - f1) * Math.exp(-t * 28);
    const env = Math.exp(-t * 16);
    return (Math.sin(2 * Math.PI * f * t) * env + (Math.random() * 2 - 1) * Math.exp(-t * 190) * 0.35) * amp;
  }, 0.4);
}
/** Šum s dolní propustí (válení / konfety). */
function rumble(buf, t0, dur, amp, shape, cut = 0.04) {
  let y = 0;
  mix(buf, t0, (t) => { y += cut * ((Math.random() * 2 - 1) - y); return y * shape(t / dur) * amp * 6; }, dur);
}
function save(name, buf, peak = 0.8, fade = 0.12) {
  let m = 0; for (const v of buf) m = Math.max(m, Math.abs(v));
  const g = m > 0 ? peak / m : 1;
  const nf = Math.floor(fade * SR);
  const out = Buffer.alloc(44 + buf.length * 2);
  out.write('RIFF', 0); out.writeUInt32LE(36 + buf.length * 2, 4); out.write('WAVEfmt ', 8); out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22); out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 2, 28);
  out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(buf.length * 2, 40);
  for (let i = 0; i < buf.length; i++) {
    let v = buf[i] * g;
    if (i > buf.length - nf) v *= (buf.length - i) / nf; // doznění bez lupnutí
    v = Math.tanh(v * 1.1) / Math.tanh(1.1);               // jemné zaoblení špiček
    out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2);
  }
  fs.writeFileSync(`${OUT}/${name}.wav`, out);
  console.log(name, (buf.length / SR).toFixed(2) + ' s', Math.round(out.length / 1024) + ' kB');
}

// ---- intro (časování podle animace v screens/intro.js) ----
{
  const b = make(3.4);
  rumble(b, 0.15, 1.1, 0.5, (x) => Math.sin(Math.PI * Math.min(1, x * 1.05)) * (1 - 0.5 * x), 0.03); // míč se valí
  thud(b, 1.22, 0.75);                                                                               // dopad
  thud(b, 1.0, 0.0);
  thud(b, 1.46, 0.32, 120, 60);                                                                      // druhý, menší odraz
  const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1318.5]; // C D E G A C E: písmena F O T B A L a tečka
  scale.forEach((f, i) => bell(b, 0.9 + i * 0.085, f, 0.55, 0.2));
  [523.25, 659.25, 783.99, 1174.66].forEach((f, i) => bell(b, 1.78 + i * 0.012, f, 1.5, 0.15, [1, 0.28, 0.1]));  // závěrečný akord
  [2093, 2637, 3136].forEach((f, i) => bell(b, 1.95 + i * 0.11, f, 0.45, 0.06, [1, 0.2]));                       // třpyt
  save('intro', b);
}
// ---- success: dva stoupavé tóny ----
{ const b = make(0.7); bell(b, 0, 659.25, 0.4, 0.5); bell(b, 0.11, 987.77, 0.55, 0.5); save('success', b); }
// ---- levelup / odměna: stoupavé arpeggio a třpyt ----
{
  const b = make(1.9);
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => bell(b, i * 0.09, f, 0.6, 0.3));
  [523.25, 783.99, 1046.5, 1568].forEach((f, i) => bell(b, 0.5 + i * 0.01, f, 1.3, 0.16, [1, 0.28]));
  [2349, 2793, 3322, 3951].forEach((f, i) => bell(b, 0.7 + i * 0.09, f, 0.4, 0.07, [1, 0.2]));
  save('levelup', b);
}
// ---- konfety: prasknutí a třpyt ----
{
  const b = make(1.3);
  rumble(b, 0, 0.18, 1.0, (x) => Math.exp(-x * 7), 0.5);
  thud(b, 0, 0.35, 220, 90);
  for (let i = 0; i < 12; i++) bell(b, 0.1 + Math.random() * 0.9, 1800 + Math.random() * 2600, 0.22, 0.09, [1, 0.15]);
  save('confetti', b);
}
// ---- click: krátké klepnutí ----
{ const b = make(0.12); bell(b, 0, 1318.5, 0.1, 0.5, [1, 0.2]); save('click', b, 0.5, 0.03); }
