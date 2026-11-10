// Ořízne vygenerované MP3 (voice-src/<styl>/*.mp3) na čistou řeč a uloží jako WAV do assets/audio/voice/<styl>/.
// Generované nahrávky mají ~0,2 s ticha na začátku a ~1,3 s na konci; bez oříznutí se věty překrývaly a usekávaly. Délka WAV = přesná délka hlášky.
import { MPEGDecoder } from 'mpg123-decoder';
import fs from 'node:fs';

const SRC = 'voice-src';
const OUT = 'assets/audio/voice';
const THRESH = 0.012;      // pod touto úrovní je ticho
const LEAD = 0.08;         // rezerva před začátkem řeči (s)
const TAIL = 0.24;         // rezerva za koncem řeči (dozvuk, tiché souhlásky) (s)

function wav(samples, sr) {
  const n = samples.length; const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767))), 44 + i * 2);
  return buf;
}

let total = 0;
for (const style of fs.readdirSync(SRC)) {
  const dir = `${SRC}/${style}`;
  if (!fs.statSync(dir).isDirectory()) continue;
  fs.mkdirSync(`${OUT}/${style}`, { recursive: true });
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.mp3'))) {
    const dec = new MPEGDecoder(); await dec.ready; // nový dekodér pro každý soubor
    const r = dec.decode(new Uint8Array(fs.readFileSync(`${dir}/${f}`)));
    dec.free();
    const d = r.channelData[0]; const sr = r.sampleRate;
    let first = -1; let last = -1;
    for (let i = 0; i < d.length; i++) if (Math.abs(d[i]) > THRESH) { if (first < 0) first = i; last = i; }
    if (first < 0) { first = 0; last = d.length - 1; }
    const a = Math.max(0, first - Math.round(LEAD * sr)); const b = Math.min(d.length, last + Math.round(TAIL * sr));
    const out = Float32Array.from(d.subarray(a, b));
    const fi = Math.round(0.008 * sr); const fo = Math.round(0.05 * sr); // krátký náběh a doznění bez lupnutí
    for (let i = 0; i < Math.min(fi, out.length); i++) out[i] *= i / fi;
    for (let i = 0; i < Math.min(fo, out.length); i++) out[out.length - 1 - i] *= i / fo;
    fs.writeFileSync(`${OUT}/${style}/${f.replace('.mp3', '.wav')}`, wav(out, sr));
    total++;
  }
}
console.log('oříznuto', total, 'hlášek');
