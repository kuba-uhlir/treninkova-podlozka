// Zpracuje obrázky z Gemini (složka obrazky/) na hotové prvky aplikace v assets/img/art/ (WebP s průhledností).
// Spuštění: node scripts/build-art.mjs            (vše, trvá pár minut)   |   node scripts/build-art.mjs levels avatary   (jen vybrané části)
// Části: motivy, ikona, ikony, efekty, odmeny, levels, avatary, karta, android. Potřebuje ffmpeg v PATH a balíček pngjs.
// Jak se zdroje berou: sheet = jedna JPG s mřížkou prvků na jednobarevném pozadí; pozadí se vyřízne na průhlednost.
//  - purpurové pozadí (#FF00FF)  → odznaky, úrovně, avatary
//  - černé pozadí                → ikony, efekty (průhlednost = jas, záře zůstane)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PNG } from 'pngjs';

const SRC = 'obrazky';
const OUT = 'assets/img/art';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'art-'));
fs.mkdirSync(OUT, { recursive: true });

// Přiřazení zdrojových souborů (názvy z Gemini) k významu.
const FILES = {
  hero: 'aaaa.jpg', field: 'Gemini_Generated_Image_32vker32vker32vk.jpg', logo: 'Gemini_Generated_Image_li6tvbli6tvbli6t.jpg',
  appIcon: 'Gemini_Generated_Image_5cqugb5cqugb5cqu.jpg', banner: 'Gemini_Generated_Image_uhyotsuhyotsuhyo.jpg',
  bgMenu: 'Gemini_Generated_Image_oq8rxvoq8rxvoq8r.jpg', bgWin: 'Gemini_Generated_Image_utoqsautoqsautoq.jpg',
  icons1: 'Gemini_Generated_Image_uaadfouaadfouaad.jpg', icons2: 'Gemini_Generated_Image_16c3ca16c3ca16c3.jpg',
  bronze: 'Gemini_Generated_Image_m3m8lnm3m8lnm3m8.jpg', silver: 'Gemini_Generated_Image_5lcs1v5lcs1v5lcs.jpg', gold: 'Gemini_Generated_Image_5drsyr5drsyr5drs.jpg',
  cardFrame: 'Gemini_Generated_Image_nndzzvnndzzvnndz.jpg', levels: 'Gemini_Generated_Image_g2tyrpg2tyrpg2ty.jpg', effects: 'Gemini_Generated_Image_xs36irxs36irxs36.jpg',
  av: ['Gemini_Generated_Image_rwhvhcrwhvhcrwhv.jpg', 'Gemini_Generated_Image_xp6w3uxp6w3uxp6w.jpg', 'Gemini_Generated_Image_6pd12p6pd12p6pd1.jpg', 'Gemini_Generated_Image_5zjhub5zjhub5zjh.jpg'],
};

const only = process.argv.slice(2);
const run = (part) => !only.length || only.includes(part);
const ff = (args) => { const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...args], { encoding: 'utf8' }); if (r.status) throw new Error(`ffmpeg: ${r.stderr}`); };
let tmpN = 0;
const tmp = (ext) => path.join(TMP, `t${tmpN++}.${ext}`);
const readImg = (name) => { const t = tmp('png'); ff(['-i', path.join(SRC, name), t]); return PNG.sync.read(fs.readFileSync(t)); };
const savePng = (png, file) => fs.writeFileSync(file, PNG.sync.write(png));
const clamp01 = (x) => Math.min(1, Math.max(0, x));

/** Uloží (volitelně zmenšený) obrázek jako WebP. */
function webp(png, name, { w, h, q = 90 } = {}) {
  const t = tmp('png'); savePng(png, t);
  const vf = w ? ['-vf', `scale=${w}:${h || -2}:flags=lanczos`] : [];
  ff(['-i', t, ...vf, '-c:v', 'libwebp', '-quality', String(q), '-compression_level', '6', path.join(OUT, name)]);
}
/** Zdroj JPG přímo jako WebP bez úpravy průhlednosti. */
function jpgToWebp(file, name, { w, q = 88, crop } = {}) {
  const vf = [crop ? `crop=${crop}` : null, w ? `scale=${w}:-2:flags=lanczos` : null].filter(Boolean).join(',');
  ff(['-i', path.join(SRC, file), ...(vf ? ['-vf', vf] : []), '-c:v', 'libwebp', '-quality', String(q), '-compression_level', '6', path.join(OUT, name)]);
}

const crop = (png, x, y, w, h) => {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  const o = new PNG({ width: w, height: h });
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const sx = x + i; const sy = y + j; const di = (j * w + i) * 4;
    if (sx < 0 || sy < 0 || sx >= png.width || sy >= png.height) { o.data[di + 3] = 0; continue; }
    const si = (sy * png.width + sx) * 4; o.data[di] = png.data[si]; o.data[di + 1] = png.data[si + 1]; o.data[di + 2] = png.data[si + 2]; o.data[di + 3] = png.data[si + 3];
  }
  return o;
};

/** Purpurové pozadí → průhledné; okraje se zbaví purpurového nádechu. */
function keyMagenta(png, lo = 0.2, hi = 0.65) {
  const d = png.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i]; const g = d[i + 1]; const b = d[i + 2];
    const m = (Math.min(r, b) - g) / 255;
    const a = 1 - clamp01((m - lo) / (hi - lo));
    if (m > 0.04 && m < 0.92) { // odečíst příměs purpuru (255, 0, 255) podle její váhy
      const t = clamp01(m);
      d[i] = Math.max(0, Math.min(255, (r - t * 255) / (1 - t)));
      d[i + 2] = Math.max(0, Math.min(255, (b - t * 255) / (1 - t)));
    }
    d[i + 3] = Math.round(a * 255 * (d[i + 3] / 255));
  }
  return png;
}

/** Černé pozadí → průhledné (alfa = jas), barva se zpětně dopočítá. Pro záři a neonové ikony. */
function keyBlack(png, floor = 10) {
  const d = png.data;
  for (let i = 0; i < d.length; i += 4) {
    const mx = Math.max(d[i], d[i + 1], d[i + 2]);
    const a = clamp01((mx - floor) / (255 - floor));
    if (mx > 0) { const k = 255 / mx; d[i] = Math.min(255, d[i] * k); d[i + 1] = Math.min(255, d[i + 1] * k); d[i + 2] = Math.min(255, d[i + 2] * k); }
    d[i + 3] = Math.round(a * 255);
  }
  return png;
}

const bbox = (png, thr = 0.3) => {
  let x0 = png.width; let y0 = png.height; let x1 = -1; let y1 = -1;
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
    if (png.data[(y * png.width + x) * 4 + 3] / 255 > thr) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  return x1 < 0 ? null : { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
};

/** Čtverec o straně `side` se středem prvku (z bboxu) – pro jednotné měřítko více prvků. */
const squareAround = (png, bb, side) => crop(png, (bb.x0 + bb.x1) / 2 - side / 2, (bb.y0 + bb.y1) / 2 - side / 2, side, side);

/** Rozřeže arch na buňky (sloupce × řádky), vrátí PNG každé buňky. */
const cells = (png, cols, rows) => {
  const cw = png.width / cols; const ch = png.height / rows; const out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push(crop(png, c * cw, r * ch, cw, ch));
  return out;
};

/** Sada prvků na jednotné měřítko: všechny dostanou stejný zoom (podle největšího), každý se vystředí. */
function exportSet(items, names, size, { fill = 0.9, thr = 0.3 } = {}) {
  const boxes = items.map((p) => bbox(p, thr));
  const maxDim = Math.max(...boxes.filter(Boolean).map((b) => Math.max(b.w, b.h)));
  const side = Math.round(maxDim / fill);
  items.forEach((p, i) => { if (!boxes[i]) return; webp(squareAround(p, boxes[i], side), names[i], { w: size, h: size, q: 92 }); });
}

// ---------- hlavní motiv, pozadí, logo, banner ----------
if (run('motivy')) {
console.log('motivy a pozadí…');
jpgToWebp(FILES.hero, 'hero_ball.webp', { w: 1100, crop: '1700:1300:560:100' });
jpgToWebp(FILES.field, 'bg_field.webp', { w: 1920, q: 84 });
jpgToWebp(FILES.bgMenu, 'bg_menu.webp', { w: 1920, q: 84 });
jpgToWebp(FILES.bgWin, 'bg_win.webp', { w: 1920, q: 84 });
jpgToWebp(FILES.logo, 'logo.webp', { w: 1100 });
jpgToWebp(FILES.banner, 'banner.webp', { w: 1280 });
}

// ---------- ikona aplikace: zaoblený čtverec na bílém → průhledné rohy ----------
if (run('ikona') || run('android')) {
console.log('ikona aplikace…');
  const p = readImg(FILES.appIcon); const W = p.width; const H = p.height; const d = p.data;
  const bg = new Uint8Array(W * H); const stack = [];
  const isBg = (i) => Math.min(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) > 185;
  for (let x = 0; x < W; x++) { stack.push(x, (H - 1) * W + x); }
  for (let y = 0; y < H; y++) { stack.push(y * W, y * W + W - 1); }
  while (stack.length) {
    const i = stack.pop(); if (bg[i] || !isBg(i)) continue; bg[i] = 1;
    const x = i % W; if (x > 0) stack.push(i - 1); if (x < W - 1) stack.push(i + 1); if (i >= W) stack.push(i - W); if (i < W * (H - 1)) stack.push(i + W);
  }
  for (let i = 0; i < W * H; i++) {
    if (bg[i]) d[i * 4 + 3] = 0;
    else { // okrajový pixel: zbytek bílé zprůhlednit a ztmavit
      const x = i % W; const y = (i / W) | 0; let near = false;
      for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, 1], [-1, 1], [1, -1]]) { const xx = x + dx; const yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && bg[yy * W + xx]) near = true; }
      if (near) { const t = clamp01((Math.min(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) - 40) / 160); d[i * 4 + 3] = Math.round(255 * (1 - t)); }
    }
  }
  const bb = bbox(p, 0.5);
  const sq = crop(p, bb.x0, bb.y0, bb.w, bb.h);
  savePng(sq, path.join(TMP, 'icon_full.png'));
  webp(sq, 'app_icon.webp', { w: 1024, h: 1024, q: 92 });
  // vnitřek bez zaoblených rohů (pro Android adaptivní ikonu)
  const inset = Math.round(bb.w * 0.1);
  savePng(crop(p, bb.x0 + inset, bb.y0 + inset, bb.w - 2 * inset, bb.h - 2 * inset), path.join(TMP, 'icon_inner.png'));
}

// ---------- ikony rozhraní: 2 archy 4×3 na černém ----------
if (run('ikony')) {
console.log('ikony…');
  const n1 = ['play', 'stop', 'pause', 'back', 'plus', 'check', 'lock', 'gear', 'home', 'info', 'warn', 'trash'];
  const n2 = ['edit', 'camera', 'list', 'grid', 'trophy', 'star', 'users', 'profile', 'cards', 'swords', 'levels', 'ball'];
  const items = [...cells(keyBlack(readImg(FILES.icons1)), 4, 3), ...cells(keyBlack(readImg(FILES.icons2)), 4, 3)];
  exportSet(items, [...n1, ...n2].map((n) => `ic_${n}.webp`), 160, { fill: 0.82, thr: 0.35 });
}

// ---------- efekty ----------
if (run('efekty')) {
console.log('efekty…');
  const names = ['burst', 'confetti', 'swoosh', 'ring', 'sparkle', 'orb'];
  const items = cells(keyBlack(readImg(FILES.effects)), 3, 2);
  items.forEach((p, i) => { const bb = bbox(p, 0.12); webp(squareAround(p, bb, Math.round(Math.max(bb.w, bb.h) * 1.1)), `fx_${names[i]}.webp`, { w: 384, h: 384, q: 88 }); });
}

// ---------- odměny: 3 archy 5×2 (bronz, stříbro, zlato) + diamant odvozený ze stříbra ----------
if (run('odmeny')) {
console.log('odměny…');
  const kinds = ['medal', 'trophy', 'ball', 'star', 'flame', 'boot', 'shield', 'crown', 'clock', 'sunrise'];
  const sheets = {};
  for (const tier of ['bronze', 'silver', 'gold']) {
    sheets[tier] = cells(keyMagenta(readImg(FILES[tier]), 0.2, 0.6), 5, 2);
    exportSet(sheets[tier], kinds.map((k) => `rw_${tier}_${k}.webp`), 256, { fill: 0.94, thr: 0.5 });
  }
  // diamant: stříbro přebarvené do ledově modré (zelený neonový lem zůstává)
  const dia = cells(readImg(FILES.silver), 5, 2); // znovu načíst, klíčovat zvlášť
  dia.forEach((p) => keyMagenta(p, 0.2, 0.6));
  dia.forEach((p) => {
    const d = p.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i]; const g = d[i + 1]; const b = d[i + 2];
      if (g > r * 1.25 && g > b * 1.15) continue; // zelený lem
      const l = (0.3 * r + 0.59 * g + 0.11 * b) / 255; // jas → mezi tmavě a světle modrou
      d[i] = Math.round(30 + 190 * l); d[i + 1] = Math.round(95 + 145 * l); d[i + 2] = Math.round(165 + 90 * l);
    }
  });
  exportSet(dia, kinds.map((k) => `rw_diamond_${k}.webp`), 256, { fill: 0.94, thr: 0.5 });
}

// ---------- úrovně: 4 štíty v řadě ----------
if (run('levels')) {
console.log('úrovně…');
  const items = cells(keyMagenta(readImg(FILES.levels), 0.05, 0.35), 4, 1);
  exportSet(items, [1, 2, 3, 4].map((n) => `lv_${n}.webp`), 256, { fill: 0.94, thr: 0.5 });
}

// ---------- avatary: 4 archy 3×2 (lidé, lidé, zvířata, zvířata) ----------
if (run('avatary')) {
console.log('avatary…');
  const K = 2400 / 1100; // souřadnice níže jsou měřené v náhledu 1100 px
  const cx = [193, 550, 907]; const cy = [232, 622]; const R = 152; const HALF = 190;
  let n = 1;
  for (const file of FILES.av) {
    const sheet = keyMagenta(readImg(file), 0.22, 0.6);
    for (const y of cy) for (const x of cx) {
      const side = Math.round(HALF * 2 * K);
      const p = crop(sheet, (x - HALF) * K, (y - HALF) * K, side, side);
      // tmavý kruh pod postavou (uvnitř zeleného kroužku)
      const o = new PNG({ width: side, height: side });
      const c = side / 2; const rr = R * K * 0.985;
      for (let j = 0; j < side; j++) for (let i = 0; i < side; i++) {
        const di = (j * side + i) * 4; const dist = Math.hypot(i - c, j - c);
        let bgA = dist <= rr ? 1 : clamp01(rr + 1.5 - dist); // měkký okraj
        const k = clamp01(dist / rr); // 0 střed … 1 okraj
        const bgR = 14 + 6 * (1 - k); const bgG = 40 + 30 * (1 - k); const bgB = 28 + 14 * (1 - k);
        const sa = p.data[di + 3] / 255;
        const a = sa + bgA * (1 - sa);
        if (a <= 0) { o.data[di + 3] = 0; continue; }
        o.data[di] = (p.data[di] * sa + bgR * bgA * (1 - sa)) / a; o.data[di + 1] = (p.data[di + 1] * sa + bgG * bgA * (1 - sa)) / a; o.data[di + 2] = (p.data[di + 2] * sa + bgB * bgA * (1 - sa)) / a;
        o.data[di + 3] = Math.round(a * 255);
      }
      webp(o, `av_${String(n++).padStart(2, '0')}.webp`, { w: 320, h: 320, q: 90 });
    }
  }
}

// ---------- rámeček karty: okno na fotku průhledné, přebarvení do čtyř vzácností, rozměry pro CardView ----------
if (run('karta')) {
  console.log('rámeček karty…');
  const p = readImg(FILES.cardFrame); const W = p.width; const H = p.height; const d = p.data;
  // 1) okno = purpurová plocha → průhledné (zároveň si změříme jeho obdélník)
  let wx0 = W; let wy0 = H; let wx1 = 0; let wy1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4; const m = (Math.min(d[i], d[i + 2]) - d[i + 1]) / 255;
    if (m > 0.7) { if (x < wx0) wx0 = x; if (x > wx1) wx1 = x; if (y < wy0) wy0 = y; if (y > wy1) wy1 = y; }
  }
  const win = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) { const m = (Math.min(d[i * 4], d[i * 4 + 2]) - d[i * 4 + 1]) / 255; if (m > 0.35) win[i] = 1; }
  // 2) vnější černé pozadí a záře: zaplavit od okrajů přes pixely tmavší než práh (neonový lem rámečku je jasnější)
  const out = new Uint8Array(W * H); const st = [];
  const dark = (i) => Math.max(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) < 170;
  for (let x = 0; x < W; x++) st.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) st.push(y * W, y * W + W - 1);
  while (st.length) {
    const i = st.pop(); if (out[i] || !dark(i)) continue; out[i] = 1;
    const x = i % W; if (x > 0) st.push(i - 1); if (x < W - 1) st.push(i + 1); if (i >= W) st.push(i - W); if (i < W * (H - 1)) st.push(i + W);
  }
  for (let i = 0; i < W * H; i++) {
    if (win[i]) { d[i * 4 + 3] = 0; continue; }
    if (out[i]) d[i * 4 + 3] = 0; // záře mimo rámeček se zahodí (v aplikaci ji nahradí stín podle vzácnosti)
  }
  const bb = bbox(p, 0.5);
  const fx = (x) => (x - bb.x0) / bb.w; const fy = (y) => (y - bb.y0) / bb.h;
  // 3) štítek vlevo nahoře a destička dole = neprůhledné pixely uvnitř okna
  const inWin = (x, y) => x >= wx0 && x <= wx1 && y >= wy0 && y <= wy1;
  const box = (test) => { let a = W; let b = H; let c = 0; let e = 0; for (let y = wy0; y <= wy1; y++) for (let x = wx0; x <= wx1; x++) { if (d[(y * W + x) * 4 + 3] > 128 && test(x, y)) { if (x < a) a = x; if (x > c) c = x; if (y < b) b = y; if (y > e) e = y; } } return { l: fx(a), t: fy(b), r: fx(c), b: fy(e) }; };
  const ww = wx1 - wx0; const wh = wy1 - wy0;
  const shield = box((x, y) => x < wx0 + ww * 0.4 && y < wy0 + wh * 0.22 && (x - wx0) > ww * 0.012);
  const plate = box((x, y) => y > wy1 - wh * 0.14 && x > wx0 + ww * 0.2 && x < wx1 - ww * 0.2);
  const geo = { window: { l: fx(wx0), t: fy(wy0), r: fx(wx1), b: fy(wy1) }, shield, plate, aspect: bb.w / bb.h };
  fs.writeFileSync('src/ui/cardFrame.json', JSON.stringify(geo, null, 1));
  const body = crop(p, bb.x0, bb.y0, bb.w, bb.h);
  // 4) přebarvení zeleného neonu do barev vzácností
  const TARGET = { common: { h: 215, s: 0.12 }, rare: { h: 199 }, epic: { h: 283 }, legend: { h: 46 } };
  const hsl = (r, g, b) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b); const mn = Math.min(r, g, b); const l = (mx + mn) / 2; const dd = mx - mn; if (!dd) return [0, 0, l]; const s = dd / (1 - Math.abs(2 * l - 1)); const h = mx === r ? ((g - b) / dd + (g < b ? 6 : 0)) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; return [h * 60, s, l]; };
  const rgb = (h, s, l) => { const c = (1 - Math.abs(2 * l - 1)) * s; const x = c * (1 - Math.abs(((h / 60) % 2) - 1)); const m = l - c / 2; const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return [(r + m) * 255, (g + m) * 255, (b + m) * 255]; };
  for (const [name, t] of Object.entries(TARGET)) {
    const v = new PNG({ width: body.width, height: body.height }); body.data.copy(v.data);
    for (let i = 0; i < v.data.length; i += 4) {
      const [h, s, l] = hsl(v.data[i], v.data[i + 1], v.data[i + 2]);
      if (s > 0.2 && h > 80 && h < 180) { const o = rgb(t.h, t.s !== undefined ? s * t.s / 0.7 : s, l); v.data[i] = o[0]; v.data[i + 1] = o[1]; v.data[i + 2] = o[2]; }
    }
    webp(v, `card_frame_${name}.webp`, { w: 700, q: 92 });
  }
  console.log('okno', geo.window, 'štítek', shield, 'destička', plate, 'poměr', geo.aspect.toFixed(3));
}

// ---------- Android: banner a ikony aplikace ----------
if (run('android')) {
console.log('Android…');
  const res = 'android/app/src/main/res';
  ff(['-i', path.join(SRC, FILES.banner), '-vf', 'scale=320:180:flags=lanczos', path.join(res, 'drawable', 'tv_banner.png')]);
  const sizes = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  for (const [d, s] of Object.entries(sizes)) {
    const dir = path.join(res, `mipmap-${d}`); const fg = Math.round(s * 2.25);
    ff(['-i', path.join(TMP, 'icon_full.png'), '-vf', `scale=${s}:${s}:flags=lanczos`, path.join(dir, 'ic_launcher.png')]);
    ff(['-i', path.join(TMP, 'icon_inner.png'), '-vf', `scale=${s}:${s}:flags=lanczos,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lte(hypot(X-${s / 2},Y-${s / 2}),${s / 2}),255,0)'`, path.join(dir, 'ic_launcher_round.png')]);
    ff(['-i', path.join(TMP, 'icon_inner.png'), '-vf', `scale=${Math.round(fg * 0.8)}:-2:flags=lanczos,pad=${fg}:${fg}:(ow-iw)/2:(oh-ih)/2:color=0x0A0A0C`, path.join(dir, 'ic_launcher_foreground.png')]);
  }
  fs.writeFileSync(path.join(res, 'values', 'ic_launcher_background.xml'), '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0A0A0C</color>\n</resources>');
}
fs.rmSync(TMP, { recursive: true, force: true });
console.log('hotovo →', OUT);
