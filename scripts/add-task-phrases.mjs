// Doplní do src/content/phrases.json hlášky, co má hráč u cviku dělat (task_<id>, text z "info" v drills.json) a otázku před rozcvičkou.
// Pak: node scripts/gen-voices.mjs && node scripts/trim-voices.mjs
import fs from 'node:fs';

const phrases = JSON.parse(fs.readFileSync('src/content/phrases.json', 'utf8'));
const drills = JSON.parse(fs.readFileSync('src/content/drills.json', 'utf8'));
const speak = (t) => t.replace(/:\s*/g, '. ').replace(/\s+/g, ' ').trim();
for (const d of drills) if (d.info) phrases.fixed[`task_${d.id}`] = speak(d.info);
phrases.fixed.warmup_ask = 'Chceš se nejdřív rozcvičit, nebo půjdeme rovnou na trénink?';
fs.writeFileSync('src/content/phrases.json', JSON.stringify(phrases, null, 2));
console.log('hlášky:', Object.keys(phrases.fixed).length);
