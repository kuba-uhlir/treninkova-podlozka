// Krátké popisy hráčů z české Wikipedie (CC BY-SA 4.0) pro rub karet tam, kde nejsou ručně psané zajímavosti (facts.json).
// Výstup: src/content/bios.json { id: text }. Text se v appce uvádí s odkazem na zdroj (viz obrazovka Licence).
import fs from 'node:fs';
const UA = 'FotbalTreninkovaPodlozka/1.0 (private family app; football cards)';
const cards = JSON.parse(fs.readFileSync('src/content/cards.json', 'utf8'));
const facts = JSON.parse(fs.readFileSync('src/content/facts.json', 'utf8'));
const prev = fs.existsSync('src/content/bios.json') ? JSON.parse(fs.readFileSync('src/content/bios.json', 'utf8')) : {};
const get = async (url) => { for (let i = 0; i < 5; i++) { const r = await fetch(url, { headers: { 'User-Agent': UA } }); if (r.status === 429) { await new Promise((s) => setTimeout(s, 4000 * (i + 1))); continue; } return r; } throw new Error('429'); };
const shorten = (t) => {
  t = t.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim(); // závorky s daty a výslovností pryč
  const parts = t.match(/[^.!?]+[.!?]+/g) || [t];
  let out = ''; let n = 0;
  for (const p of parts) { if ((out + p).length > 650 && out) break; if (++n > 5) break; out += p; }
  return out.trim();
};
const bios = { ...prev };
for (const c of cards) {
  if (bios[c.id]) continue;
  try {
    const s = await (await get(`https://cs.wikipedia.org/w/api.php?action=query&format=json&list=search&srlimit=1&srsearch=${encodeURIComponent(c.name + ' fotbalista')}`)).json();
    const title = s.query.search[0]?.title;
    if (title) {
      const r = await get(`https://cs.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`);
      if (r.ok) {
        const j = await r.json();
        const ex = shorten(j.extract || '');
        if (/fotbal/i.test(ex) && ex.length > 30) bios[c.id] = ex;
      }
    }
  } catch (e) { console.log('chyba', c.id, e.message); }
  console.log(c.id, bios[c.id] ? 'ok' : 'bez popisu');
  await new Promise((s) => setTimeout(s, 500));
}
fs.writeFileSync('src/content/bios.json', JSON.stringify(bios, null, 1));
console.log('hotovo', Object.keys(bios).length);
