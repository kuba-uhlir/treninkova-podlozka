// Odstraní bílé pozadí kolem loga (zaplavení od okrajů), vnitřní bílé plochy zůstanou. Použití: node scripts/clear-logo-bg.mjs soubor.png
import { PNG } from 'pngjs';
import fs from 'node:fs';

const file = process.argv[2];
const png = PNG.sync.read(fs.readFileSync(file));
const { width: w, height: h, data } = png;
const near = (i) => data[i * 4 + 3] < 8 || (data[i * 4] >= 243 && data[i * 4 + 1] >= 243 && data[i * 4 + 2] >= 243);
const seen = new Uint8Array(w * h);
const q = [];
for (let x = 0; x < w; x++) { q.push(x, (h - 1) * w + x); }
for (let y = 0; y < h; y++) { q.push(y * w, y * w + w - 1); }
while (q.length) {
  const i = q.pop();
  if (seen[i] || !near(i)) continue;
  seen[i] = 1;
  const x = i % w; const y = (i / w) | 0;
  if (x > 0) q.push(i - 1); if (x < w - 1) q.push(i + 1); if (y > 0) q.push(i - w); if (y < h - 1) q.push(i + w);
}
for (let i = 0; i < w * h; i++) {
  const x = i % w; const y = (i / w) | 0;
  if (seen[i]) { data[i * 4 + 3] = 0; continue; }
  const edge = (x > 0 && seen[i - 1]) || (x < w - 1 && seen[i + 1]) || (y > 0 && seen[i - w]) || (y < h - 1 && seen[i + w]);
  if (edge) { const l = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3; if (l > 200) data[i * 4 + 3] = Math.max(0, Math.min(255, 255 - (l - 200) * 4)); }
}
fs.writeFileSync(file, PNG.sync.write(png));
console.log('hotovo', file, `${w}x${h}`);
