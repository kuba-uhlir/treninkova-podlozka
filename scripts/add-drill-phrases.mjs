// Doplní do src/content/phrases.json hlášky pro Trenéra: co má hráč dělat v rozcvičce (wu_1..5) a název každého cviku (drill_<id>).
// Pětileté dítě neumí číst, takže Trenér vždy řekne, co se bude dělat. Pak: node scripts/gen-voices.mjs && node scripts/trim-voices.mjs
import fs from 'node:fs';

const phrases = JSON.parse(fs.readFileSync('src/content/phrases.json', 'utf8'));
const drills = JSON.parse(fs.readFileSync('src/content/drills.json', 'utf8'));

const WARMUP = [
  'Kroužíme kotníky. Točíme chodidlem dokola, pomalu.',
  'Teď dělej dřepy. Dolů a nahoru, záda rovně.',
  'Výpady. Krok dopředu, dolů a střídáme nohy.',
  'Poskoky na místě. Lehce na špičkách.',
  'Protáhneme lýtka. Špičku nahoru a držíme.',
];
WARMUP.forEach((t, i) => { phrases.fixed[`wu_${i + 1}`] = t; });

const speak = (name) => name.replace(/:\s*/g, '. ').replace(/\s*\+\s*/g, ' a ').replace(/\s+/g, ' ').trim();
for (const d of drills) phrases.fixed[`drill_${d.id}`] = `${speak(d.name)}.`;

fs.writeFileSync('src/content/phrases.json', JSON.stringify(phrases, null, 2));
console.log('hlášky:', Object.keys(phrases.fixed).length);
