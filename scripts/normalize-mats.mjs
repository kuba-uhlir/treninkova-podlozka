// Srovná podložky v src/config/mats/*.json: levá a pravá strana jsou zrcadlově stejné a středové prvky leží přesně na ose viewBoxu (x = 75).
// Spuštění: node scripts/normalize-mats.mjs           (upraví soubory)
//           node scripts/normalize-mats.mjs --check   (jen vypíše největší odchylky od symetrie; nic nezapisuje)
// Podložky s organickým rozložením (PARTIAL) se srovnají jen částečně.
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/config/mats';
// barevné body (a jejich zóny) jsou záměrně nesymetrické; u této podložky se srovnají jen šipky a nápisy
const PARTIAL = { 'color-dots': new Set(['arrows', 'texts']) };
const CHECK = process.argv.includes('--check');
const TOL = 9;  // největší vzdálenost, při které se prvek bere jako zrcadlový protějšek
const SNAP = 6; // středový prvek do této vzdálenosti od osy se přichytí na osu

const d2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const avg = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const r1 = (v) => Math.round(v * 10) / 10;

function pairUp(items, mirrorOf, dist) {
  // vrátí { pairs: [[i, j, reversed]], self: [i] }
  const used = new Set(); const pairs = []; const self = [];
  items.forEach((it, i) => {
    if (used.has(i)) return;
    const m = mirrorOf(it);
    let best = null;
    items.forEach((jt, j) => {
      if (j === i || used.has(j)) return;
      const dd = dist(m, jt); if (dd.d < TOL && (!best || dd.d < best.d)) best = { j, ...dd };
    });
    const ds = dist(m, it);
    if (ds.d < TOL && (!best || ds.d <= best.d * 0.5)) { self.push(i); used.add(i); } else if (best) { pairs.push([i, best.j, best.rev]); used.add(i); used.add(best.j); }
  });
  return { pairs, self };
}

export function normalize(m, parts = null) {
  const on = (k) => !parts || parts.has(k);
  const W = m.viewBox[0]; const CX = W / 2; const mx = (p) => [2 * CX - p[0], p[1]];
  let worst = 0; const note = (v) => { worst = Math.max(worst, v); };

  // ---- body (středy) se stranou: balls, texty, odznaky ----
  const symPoints = (list, get, set) => {
    const pts = list.map(get);
    const { pairs, self } = pairUp(pts, mx, (a, b) => ({ d: d2(a, b), rev: false }));
    for (const [i, j] of pairs) { note(d2(mx(pts[i]), pts[j])); const nj = avg(mx(pts[i]), pts[j]); set(list[j], nj); set(list[i], mx(nj)); }
    for (const i of self) { note(Math.abs(pts[i][0] - CX)); set(list[i], [CX, pts[i][1]]); }
    return { pairs, self };
  };

  // odznaky čísel (střed), přichytit páry a středové
  if (on('badges') && m.badges && m.badges.length) {
    const c = (b) => [b.x + b.w / 2, b.y + b.h / 2];
    const mset = (b, p) => { b.x = r1(p[0] - b.w / 2); b.y = r1(p[1] - b.h / 2); };
    const pts = m.badges.map(c);
    const { pairs, self } = pairUp(pts, mx, (a, b) => ({ d: d2(a, b), rev: false }));
    for (const [i, j] of pairs) { const A = m.badges[i]; const B = m.badges[j]; const w = r1((A.w + B.w) / 2); const h = r1((A.h + B.h) / 2); note(d2(mx(pts[i]), pts[j])); const nj = avg(mx(pts[i]), pts[j]); A.w = B.w = w; A.h = B.h = h; mset(B, nj); mset(A, mx(nj)); }
    for (const i of self) { note(Math.abs(pts[i][0] - CX)); mset(m.badges[i], [CX, pts[i][1]]); }
    // řady odznaků (3 4 5 nahoře, 2 1 6 dole) leží na stejné výšce
    for (const row of [[3, 4, 5], [2, 1, 6], [1, 2, 3], [6, 5, 4]]) {
      const bs = row.map((z) => m.badges.find((b) => b.zone === z)).filter(Boolean);
      if (bs.length < 2) continue;
      const cy = bs.map((b) => b.y + b.h / 2); if (Math.max(...cy) - Math.min(...cy) > 6) continue;
      const mean = cy.reduce((a, v) => a + v, 0) / cy.length; bs.forEach((b) => { b.y = r1(mean - b.h / 2); });
    }
    // chybějící odznak zóny, jejíž protějšek existuje, se nedoplňuje (míč / tištěný míč)
  }

  // míč (zóna 1) a nápis
  if (on('ball') && Math.abs(m.ball.x - CX) < SNAP) { note(Math.abs(m.ball.x - CX)); m.ball.x = CX; }
  if (on('ball') && m.logo && !m.logo.none && Math.abs(m.logo.x - CX) < SNAP) { note(Math.abs(m.logo.x - CX)); m.logo.x = CX; }
  const sk = m.skin || {};
  if (on('balls') && sk.balls) {
    const before = sk.balls.map((b) => b.x);
    symPoints(sk.balls, (b) => [b.x, b.y], (b, p) => { b.x = r1(p[0]); b.y = r1(p[1]); });
    sk.balls.forEach((b, i) => { b.__dx = b.x - before[i]; });
  }
  if (on('texts') && sk.texts) {
    const centered = sk.texts.filter((t) => Math.abs(t.x - CX) < SNAP);
    centered.forEach((t) => { note(Math.abs(t.x - CX)); t.x = CX; });
    const rest = sk.texts.filter((t) => !centered.includes(t));
    const { pairs } = symPoints(rest, (t) => [t.x, t.y], (t, p) => { t.x = r1(p[0]); t.y = r1(p[1]); });
    const paired = new Set(pairs.flat().map((i) => rest[i]));
    // popisky bez protějšku (např. nápověda vedle míče) se posunou o tolik, o kolik se posunul nejbližší míč
    for (const t of rest.filter((t) => !paired.has(t))) {
      const near = (sk.balls || []).map((b) => ({ b, d: Math.hypot(b.x - t.x, b.y - t.y) })).sort((a, b) => a.d - b.d)[0];
      if (near && near.b.__dx) t.x = r1(t.x + near.b.__dx);
    }
  }
  if (sk.balls) sk.balls.forEach((b) => { delete b.__dx; });
  if (sk.dots) sk.dots = sk.dots; // beze změny

  // ---- šipky: páry zrcadlových tvarů ----
  const ptsOf = (a) => (a.points ? a.points.map((p) => [...p]) : [[a.x1, a.y1], [a.x2, a.y2]]);
  const setPts = (a, pts) => { if (a.points) a.points = pts.map((p) => [r1(p[0]), r1(p[1])]); else { [a.x1, a.y1] = [r1(pts[0][0]), r1(pts[0][1])]; [a.x2, a.y2] = [r1(pts[1][0]), r1(pts[1][1])]; } };
  const shapeDist = (mirrored, other) => {
    if (mirrored.length !== other.length) return { d: 1e9, rev: false };
    const f = mirrored.reduce((s, p, k) => s + d2(p, other[k]), 0) / mirrored.length;
    const rv = mirrored.reduce((s, p, k) => s + d2(p, other[other.length - 1 - k]), 0) / mirrored.length;
    return rv < f ? { d: rv, rev: true } : { d: f, rev: false };
  };
  const arrows = on('arrows') ? m.arrows : []; const shapes = arrows.map(ptsOf);
  const mirrorShape = (s) => s.map(mx);
  const { pairs, self } = pairUp(shapes, mirrorShape, shapeDist);
  for (const [i, j, rev] of pairs) {
    const mi = mirrorShape(shapes[i]); const oj = rev ? [...shapes[j]].reverse() : shapes[j];
    note(mi.reduce((s, p, k) => s + d2(p, oj[k]), 0) / mi.length);
    const nj = mi.map((p, k) => avg(p, oj[k])); // nový tvar j (v pořadí oj)
    const njOrdered = rev ? [...nj].reverse() : nj;
    setPts(arrows[j], njOrdered);
    setPts(arrows[i], mirrorShape(nj));
  }
  for (const i of self) {
    const s = shapes[i]; const ms = mirrorShape(s); const rv = shapeDist(ms, s).rev; const o = rv ? [...s].reverse() : s;
    note(ms.reduce((t, p, k) => t + d2(p, o[k]), 0) / ms.length);
    const ns = ms.map((p, k) => avg(p, o[k])); // střed souměrné šipky na osu (u obrácených se pořadí vrátí)
    setPts(arrows[i], rv ? [...ns].reverse() : ns);
    // přesná osa: x všech bodů, které leží téměř na ose
    const fixed = (rv ? [...ns].reverse() : ns).map((p) => (Math.abs(p[0] - CX) < 0.3 ? [CX, p[1]] : p)); setPts(arrows[i], fixed);
  }

  // ---- zóny v procentech (x,w): páry a středové ----
  if (on('zones') && m.zones) {
    const zc = (z) => [z.x + z.w / 2, z.y + z.h / 2];
    const mz = (p) => [100 - p[0], p[1]];
    const pts = m.zones.map(zc);
    const { pairs: zp, self: zs } = pairUp(pts, mz, (a, b) => ({ d: d2(a, b) * 1.5, rev: false }));
    const put = (z, p) => { z.x = r1(p[0] - z.w / 2); z.y = r1(p[1] - z.h / 2); };
    for (const [i, j] of zp) { const A = m.zones[i]; const B = m.zones[j]; A.w = B.w = r1((A.w + B.w) / 2); A.h = B.h = r1((A.h + B.h) / 2); const nj = avg(mz(pts[i]), pts[j]); put(B, nj); put(A, mz(nj)); }
    for (const i of zs) put(m.zones[i], [50, pts[i][1]]);
  }
  return worst;
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json'));
for (const f of files) {
  const file = path.join(DIR, f); const id = f.replace('.json', '');
  const m = JSON.parse(fs.readFileSync(file, 'utf8'));
  const before = JSON.stringify(m);
  const worst = normalize(m, PARTIAL[id] || null);
  const changed = JSON.stringify(m) !== before;
  console.log(`${id}: největší odchylka od symetrie ${worst.toFixed(1)} j.${changed ? (CHECK ? ' (změnilo by se)' : ' → srovnáno') : ' (OK)'}`);
  if (!CHECK && changed) fs.writeFileSync(file, JSON.stringify(m, null, 2));
}
