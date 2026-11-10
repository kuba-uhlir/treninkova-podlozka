// Zkontroluje popisy hráčů: musí zmiňovat jméno (příjmení) hráče, být o fotbalistovi a nesmí jít o rozcestník. Špatné smaže z bios.json.
// Spuštění: node scripts/audit-bios.mjs [--fix]
import fs from 'node:fs';
const fix = process.argv.includes('--fix');
const cards = JSON.parse(fs.readFileSync('src/content/cards.json', 'utf8'));
const bios = JSON.parse(fs.readFileSync('src/content/bios.json', 'utf8'));
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const bad = [];
for (const c of cards) {
  const t = bios[c.id];
  if (!t) continue;
  const parts = norm(c.name).split(/\s+/).filter((x) => x.length > 2);
  const nt = norm(t);
  const hasName = parts.some((p) => nt.includes(p)) || norm(c.name).split(/\s+/).length === 1 && nt.includes(norm(c.name).slice(0, 4));
  const disamb = /vice vyznamu|nekolik vyznamu|muze oznacovat|muze byt|rozcestnik|nasledujici vyznam|nasledujicich osob|jmeno nasledujicich/.test(nt);
  const football = /fotbal/.test(nt);
  if (!hasName || disamb || !football) bad.push([c.id, c.name, !hasName ? 'jméno' : disamb ? 'rozcestník' : 'fotbal', t.slice(0, 90)]);
}
bad.forEach((b) => console.log(b.join(' | ')));
console.log('podezřelých:', bad.length, 'z', Object.keys(bios).length);
if (fix) { bad.forEach((b) => delete bios[b[0]]); fs.writeFileSync('src/content/bios.json', JSON.stringify(bios, null, 1)); console.log('smazáno'); }
