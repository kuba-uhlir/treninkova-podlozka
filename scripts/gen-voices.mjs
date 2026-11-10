// Vygeneruje hlasové hlášky průvodce jako MP3 (neuronové české hlasy) z databáze src/content/phrases.json.
// Spuštění: node scripts/gen-voices.mjs [styl ...] && node scripts/trim-voices.mjs   (už existující soubory přeskočí, takže jde bezpečně opakovat)
import { EdgeTTS } from 'node-edge-tts';
import fs from 'node:fs';

const STYLES = {
  trener: { voice: 'cs-CZ-AntoninNeural', rate: '-2%', pitch: '-3Hz' },
};
const db = JSON.parse(fs.readFileSync('src/content/phrases.json', 'utf8'));
const TEXT = { ...db.fixed };
for (const [g, list] of Object.entries(db.groups)) list.forEach((t, i) => { TEXT[`${g}_${i + 1}`] = t; });

const only = process.argv.slice(2);
for (const [style, cfg] of Object.entries(STYLES)) {
  if (only.length && !only.includes(style)) continue;
  const dir = `voice-src/${style}`; // zdrojové MP3; pro aplikaci se ořežou a převedou na WAV skriptem trim-voices.mjs
  fs.mkdirSync(dir, { recursive: true });
  const tts = new EdgeTTS({ voice: cfg.voice, lang: 'cs-CZ', outputFormat: 'audio-24khz-48kbitrate-mono-mp3', rate: cfg.rate, pitch: cfg.pitch, timeout: 20000 });
  for (const [key, text] of Object.entries(TEXT)) {
    const file = `${dir}/${key}.mp3`;
    if (fs.existsSync(file) && fs.statSync(file).size > 1000) continue;
    let ok = false;
    for (let attempt = 1; attempt <= 6 && !ok; attempt++) {
      try { await tts.ttsPromise(text, file); ok = true; console.log('OK', style, key, fs.statSync(file).size); }
      catch (e) { console.log('opakuji', style, key, attempt, String(e.message || e).slice(0, 50)); await new Promise((r) => setTimeout(r, 4000 * attempt)); }
    }
    await new Promise((r) => setTimeout(r, 700));
  }
}
console.log('HOTOVO');
