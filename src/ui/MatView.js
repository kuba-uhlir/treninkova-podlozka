// MatView: SVG simulace podložky podle konfigurace (src/config/mats/*.json).
// Vykreslí podložku (látkový povrch, hazard pruhy, šipky, zaměřovače, čísla, míč) a umí zvýraznit zónu + značku nohy.
import { getMat } from '../config/mats.js';
import { ballInner } from './BallSvg.js';

const NS = 'http://www.w3.org/2000/svg';
const YELLOW = '#F4B711';
const accent = () => getComputedStyle(document.documentElement).getPropertyValue('--c-sun').trim() || '#16C45A';
const RED = '#E5352B';
let uidN = 0;

const s = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (parent) parent.appendChild(e);
  return e;
};

// Jemný šum (látka) – vygeneruje se jednou na malém canvasu, pak jen dlaždicuje (levné i na TV).
let noiseUrl;
function noise() {
  if (noiseUrl !== undefined) return noiseUrl;
  try {
    const c = document.createElement('canvas'); c.width = c.height = 96;
    const x = c.getContext('2d'); const img = x.createImageData(96, 96);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    noiseUrl = c.toDataURL('image/png');
  } catch { noiseUrl = null; }
  return noiseUrl;
}

/**
 * Šipka podle potisku. Styly (kind):
 *  plain  plochý pruh se špičatými konci a tenkým chevronem u hrotu (UNITEAM)
 *  chev   oboustranná: zašpičatělý pruh a dvojice chevronů (« ») na obou koncích (Maximize)
 *  barchev pruh a jeden samostatný chevron na každém konci (zelená Maximize, barevné puky)
 *  stack  řada plných chevronů s kosočtvercem uprostřed (Goal Mat)
 *  tri    pruh s malými trojúhelníky podél celé délky (CitySports)
 * parts = prvky, které se při zvýraznění směru přebarvují ({ el, attr: 'fill' | 'stroke' }).
 */
function arrow(parent, { x1, y1, x2, y2, kind, color: own, points }, { shaft = 2.7, tip = 2.9, color: colorDefault = YELLOW, cut: cutColor = '#0d0d0f', kind: dflt = 'plain' } = {}) {
  const k = kind || dflt;
  const color = own || colorDefault;
  if (k === 'poly' || k === 'polyline') { // libovolný tvar v souřadnicích podložky (klíny, kosočtverec); lze přebarvit jako šipku
    const g0 = s('g', {}, parent);
    const pts = points.map((p) => p.join(',')).join(' ');
    const e = k === 'poly' ? s('polygon', { points: pts, fill: color }, g0) : s('polyline', { points: pts, fill: 'none', stroke: color, 'stroke-width': shaft, 'stroke-linejoin': 'miter', 'stroke-linecap': 'butt' }, g0);
    return { g: g0, parts: [{ el: e, attr: k === 'poly' ? 'fill' : 'stroke', base: color }] };
  }
  const L = Math.hypot(x2 - x1, y2 - y1);
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const hw = shaft / 2;
  const g = s('g', { transform: `translate(${x1} ${y1}) rotate(${ang})` }, parent);
  const parts = [];
  const fillP = (tag, attrs) => { const e = s(tag, { fill: color, ...attrs }, g); parts.push({ el: e, attr: 'fill', base: color }); return e; };
  const strokeP = (tag, attrs, w) => { const e = s(tag, { fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linejoin': 'miter', 'stroke-linecap': 'butt', ...attrs }, g); parts.push({ el: e, attr: 'stroke', base: color }); return e; };
  const hex = (a, b, t, h) => `${a},0 ${a + t},${-h} ${b - t},${-h} ${b},0 ${b - t},${h} ${a + t},${h}`;
  // chevron s hrotem v x a rameny dozadu (dir = -1 doleva, 1 doprava)
  const chev = (x, dir, a, c, w) => strokeP('polyline', { points: `${x - dir * c},${-a} ${x},0 ${x - dir * c},${a}` }, w);

  if (k === 'chev' || k === 'barchev') {
    const n = k === 'chev' ? 2 : 1;
    const a = hw * 1.18; const c = shaft * 0.62; const w = shaft * 0.36; const sp = shaft * 0.7;
    const gap = k === 'chev' ? shaft * 0.5 : shaft * 1.2;
    const edge = (n - 1) * sp + c + w * 0.5 + gap;
    for (let i = 0; i < n; i++) { chev(w * 0.5 + i * sp, -1, a, c, w); chev(L - w * 0.5 - i * sp, 1, a, c, w); }
    // chevrony: špička směřuje ven; vlevo "‹" (hrot vlevo), vpravo "›"
    fillP('polygon', { points: hex(edge, L - edge, shaft * 1.15, hw) });
  } else if (k === 'stack') {
    const d = shaft * 0.95; const t = shaft * 0.3; const c = shaft * 0.42; const sp = t * 1.55;
    const half = (L - d) / 2;
    const n = Math.max(1, Math.floor((half - 0.5) / sp));
    const mid = L / 2; const a = hw;
    fillP('polygon', { points: `${mid - d},0 ${mid},${-d * 0.78} ${mid + d},0 ${mid},${d * 0.78}` });
    const ch = (x, dir) => fillP('polygon', { points: [[x, 0], [x - dir * c, -a], [x - dir * (c + t), -a], [x - dir * t, 0], [x - dir * (c + t), a], [x - dir * c, a]].map((p) => p.join(',')).join(' ') });
    for (let i = 0; i < n; i++) { ch(mid - d - 1.2 - i * sp - c * 0.3, -1); ch(mid + d + 1.2 + i * sp + c * 0.3, 1); }
  } else if (k === 'tri') {
    const th = hw * 0.95; const step = shaft * 1.15; const n = Math.max(2, Math.floor(L / step));
    for (let i = 0; i < n; i++) { const x = (i + 0.5) * (L / n); fillP('polygon', { points: `${x - step * 0.42},${th} ${x + step * 0.42},0 ${x - step * 0.42},${-th}` }); }
  } else if (k === 'line') {
    fillP('polygon', { points: hex(0, L, tip, hw * 0.55) });
  } else {
    fillP('polygon', { points: [[0, 0], [tip, -hw], [L - tip, -hw], [L, 0], [L - tip, hw], [tip, hw]].map((p) => p.join(',')).join(' ') });
    const c = tip * 0.8;
    const cut = { fill: 'none', stroke: cutColor, 'stroke-width': 0.42, 'stroke-linejoin': 'miter' };
    s('polyline', { points: `${c + hw},${-hw} ${c},0 ${c + hw},${hw}`, ...cut }, g);
    s('polyline', { points: `${L - c - hw},${-hw} ${L - c},0 ${L - c - hw},${hw}`, ...cut }, g);
  }
  return { g, parts };
}

export function createMatView({ labels = true, mat = getMat() } = {}) {
  const [W, H] = mat.viewBox;
  const SUN = accent(); // akcentní barva aktuálního týmu
  // vzhled podložky (skin): barvy podkladu, šipek, čísel, pruhů; výchozí = černá UNITEAM s hazard pruhy
  const sk = mat.skin || {};
  const RAD = sk.radius || 2.4;
  const AR = sk.arrow || YELLOW; const HINT = sk.hint || '#19D3FF';
  const hintRgb = (() => { const n = parseInt(HINT.slice(1), 16); return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`; })();
  const bs = sk.badge || {}; const BADGE = bs.fill || RED;
  const id = `m${uidN++}`;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'w-full h-full', preserveAspectRatio: 'xMidYMid meet', style: 'overflow:visible' });
  const defs = s('defs', {}, svg);
  const clip = s('clipPath', { id: `${id}clip` }, defs);
  s('rect', { x: 0, y: 0, width: W, height: H, rx: RAD }, clip);
  const base = s('linearGradient', { id: `${id}base`, x1: 0, y1: 0, x2: 0.35, y2: 1 }, defs);
  s('stop', { offset: 0, 'stop-color': (sk.base || ['#1c1c1f', '#0d0d0f'])[0] }, base);
  s('stop', { offset: 1, 'stop-color': (sk.base || ['#1c1c1f', '#0d0d0f'])[1] }, base);
  const vig = s('radialGradient', { id: `${id}vig`, cx: 0.5, cy: 0.45, r: 0.75 }, defs);
  s('stop', { offset: 0.55, 'stop-color': '#000', 'stop-opacity': 0 }, vig);
  s('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.45 }, vig);
  const sheen = s('linearGradient', { id: `${id}sheen`, x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
  s('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.07 }, sheen);
  s('stop', { offset: 0.5, 'stop-color': '#fff', 'stop-opacity': 0 }, sheen);
  const ballShade = s('radialGradient', { id: `${id}ball`, cx: 0.4, cy: 0.35, r: 0.8 }, defs);
  s('stop', { offset: 0, 'stop-color': '#fff' }, ballShade);
  s('stop', { offset: 0.7, 'stop-color': '#f1f1f1' }, ballShade);
  s('stop', { offset: 1, 'stop-color': '#c9c9cc' }, ballShade);
  const hz = s('pattern', { id: `${id}hz`, width: 4.2, height: 4.2, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
  s('rect', { width: 4.2, height: 4.2, fill: '#0b0b0d' }, hz);
  s('rect', { width: 2.1, height: 4.2, fill: YELLOW }, hz);
  const nu = noise();
  if (nu) {
    const np = s('pattern', { id: `${id}noise`, width: 24, height: 24, patternUnits: 'userSpaceOnUse' }, defs);
    s('image', { href: nu, width: 24, height: 24, preserveAspectRatio: 'none' }, np);
  }

  // stín pod podložkou + tělo
  s('rect', { x: 0.5, y: 1.4, width: W - 1, height: H, rx: RAD + 0.2, fill: '#000', opacity: 0.55, style: 'filter:blur(1.4px)' }, svg);
  s('rect', { x: 0, y: 0, width: W, height: H, rx: RAD, fill: `url(#${id}base)` }, svg);
  const art = s('g', { 'clip-path': `url(#${id}clip)` }, svg);
  if (nu) s('rect', { x: 0, y: 0, width: W, height: H, fill: `url(#${id}noise)`, opacity: 0.07, 'style': 'mix-blend-mode:overlay' }, art);

  // pruhy trávníku (zelené podložky)
  if (sk.stripes) {
    const n = sk.stripes.count || 9; const sw = W / n;
    for (let i = 0; i < n; i++) s('rect', { x: i * sw, y: 0, width: sw + 0.05, height: H, fill: i % 2 ? sk.stripes.dark : sk.stripes.light }, art);
  }
  // hazard pruhy nahoře a dole (s tenkým rámečkem)
  const band = 3.4;
  if (sk.band !== 'none') {
    s('rect', { x: 0, y: 0, width: W, height: band, fill: `url(#${id}hz)` }, art);
    s('rect', { x: 0, y: H - band, width: W, height: band, fill: `url(#${id}hz)` }, art);
    s('rect', { x: 0, y: band, width: W, height: 0.35, fill: '#000', opacity: 0.6 }, art);
    s('rect', { x: 0, y: H - band - 0.35, width: W, height: 0.35, fill: '#000', opacity: 0.6 }, art);
  }

  // zaměřovače: mřížka # s přesahem čar (jako na potisku)
  for (const t of (sk.band === 'none' ? [] : mat.targets || [])) {
    const g = s('g', { stroke: RED, 'stroke-width': 0.3, opacity: 0.95, 'stroke-linecap': 'butt' }, art);
    const x1 = t.x + t.w * 0.36; const x2 = t.x + t.w * 0.68;
    const y1 = t.y + t.h * 0.36; const y2 = t.y + t.h * 0.68;
    const ox = t.w * 0.08; const oy = t.h * 0.08;
    s('line', { x1: t.x - ox, y1, x2: t.x + t.w + ox, y2: y1 }, g);
    s('line', { x1: t.x, y1: y2, x2: t.x + t.w, y2 }, g);
    s('line', { x1, y1: t.y - oy, x2: x1, y2: t.y + t.h + oy }, g);
    s('line', { x1: x2, y1: t.y, x2, y2: t.y + t.h }, g);
  }

  // šipky podložky; ty se spojením zón (between) umí svítit jako plánovaný směr
  const arrowRefs = mat.arrows.map((a) => { const tok = (c) => (c === '$2' ? (sk.arrow2 || '#FFFFFF') : c === '$d' ? (sk.diamond || AR) : c);
  const r = arrow(art, { ...a, color: tok(a.color) }, { ...mat.arrowStyle, ...(a.shaft ? { shaft: a.shaft } : {}), color: AR, cut: sk.arrowCut || '#0d0d0f', kind: sk.arrowKind }); return { between: a.between || null, g: r.g, parts: r.parts }; });

  // vytištěné míče, barevné puky a nápisy (jiné podložky)
  (sk.balls || []).forEach((b) => { const g = s('g', { transform: `translate(${b.x} ${b.y})` }, art); const gi = s('g', {}, g); gi.innerHTML = ballInner(b.r); });
  (sk.dots || []).forEach((d) => { s('circle', { cx: d.x, cy: d.y, r: d.r, fill: d.color }, art); });
  (sk.texts || []).forEach((t) => {
    const cond = t.condense || 1;
    const e = s('text', { x: 0, y: 0, 'text-anchor': 'middle', 'font-size': t.size, 'font-weight': t.weight || 800, 'font-family': 'Inter, sans-serif', fill: t.color || '#fff', 'letter-spacing': t.spacing || 0, transform: `translate(${t.x} ${t.y}) scale(${cond} 1)` }, art);
    e.textContent = t.text;
    if (t.deco) { // tři chevrony po každé straně nápisu, k okrajům slábnou (jako na potisku)
      const half = (t.text.length * t.size * 0.66 * cond) / 2 + t.size * 0.9;
      for (let i = 0; i < 3; i++) {
        const o = 1 - i * 0.3; const ch = t.size * 0.55; const gx = t.size * 0.62;
        const lx = t.x - half - i * gx; const rx = t.x + half + i * gx;
        s('polyline', { points: `${lx - ch * 0.5},${t.y - t.size * 0.34} ${lx + ch * 0.2},${t.y - t.size * 0.34 + ch * 0.9 - ch * 0.2} ${lx - ch * 0.5},${t.y + t.size * 0.22}`, fill: 'none', stroke: t.deco, 'stroke-width': t.size * 0.28, opacity: o, 'stroke-linejoin': 'miter' }, art);
        s('polyline', { points: `${rx + ch * 0.5},${t.y - t.size * 0.34} ${rx - ch * 0.2},${t.y - t.size * 0.34 + ch * 0.9 - ch * 0.2} ${rx + ch * 0.5},${t.y + t.size * 0.22}`, fill: 'none', stroke: t.deco, 'stroke-width': t.size * 0.28, opacity: o, 'stroke-linejoin': 'miter' }, art);
      }
    }
  });
  // logo: značka + UNITEAM
  if (mat.logo && !mat.logo.none) {
    const lg = s('text', { x: mat.logo.x, y: mat.logo.y, 'text-anchor': 'middle', 'font-family': 'Inter, sans-serif', fill: '#fff', 'fill-opacity': 0.92 }, art);
    if (!mat.logo.plain) { const t1 = s('tspan', { 'font-size': 5, 'font-weight': 800 }, lg); t1.textContent = 'µt'; }
    const t2 = s('tspan', { 'font-size': 4.6, 'font-weight': 500, dx: mat.logo.plain ? 0 : 1.6, 'letter-spacing': 0.5 }, lg); t2.textContent = mat.logo.text;
  }

  // světlo a vinětace (jen vizuál, nad potiskem)
  s('rect', { x: 0, y: 0, width: W, height: H, fill: `url(#${id}sheen)` }, art);
  s('rect', { x: 0, y: 0, width: W, height: H, fill: `url(#${id}vig)` }, art);
  s('rect', { x: 0.2, y: 0.2, width: W - 0.4, height: H - 0.4, rx: RAD - 0.1, fill: 'none', stroke: 'rgba(255,255,255,.16)', 'stroke-width': 0.4 }, svg);

  // zóny + jediný pohyblivý zvýrazňovací čtverec (klouže mezi zónami)
  const zoneEls = {};
  mat.zones.forEach((z) => { zoneEls[z.id] = { zone: z, badge: null }; });
  const SQ = mat.ball.r * 1.45; // pevná velikost čtverce kolem míče
  const hl = s('rect', { rx: 2.4, fill: SUN, 'fill-opacity': 0, stroke: SUN, 'stroke-opacity': 0, 'stroke-width': 0.8, x: 0, y: 0, width: SQ, height: SQ }, svg);
  
  // červená čísla: tmavá číslice, všechny rohy stejně zaoblené
  for (const b of mat.badges) {
    const g = s("g", {}, svg);
    const { x, y, w, h } = b;
    const cx = x + w / 2; const cy = y + h / 2; const rr = Math.min(w, h) / 2;
    let r;
    if (bs.shape === 'circle') r = s('circle', { cx, cy, r: rr, fill: BADGE, stroke: bs.stroke || 'none', 'stroke-width': bs.strokeW || 0.6 }, g);
    else if (bs.shape === 'diamond') r = s('polygon', { points: `${cx},${cy - rr * 1.15} ${cx + rr * 1.15},${cy} ${cx},${cy + rr * 1.15} ${cx - rr * 1.15},${cy}`, fill: BADGE, stroke: bs.stroke || 'none', 'stroke-width': 0.5 }, g);
    else if (bs.shape === 'ring') r = s('circle', { cx, cy, r: rr, fill: BADGE, stroke: bs.stroke || '#fff', 'stroke-width': 0.5, 'stroke-dasharray': '1.6 1' }, g);
    else { const q = 3.2; r = s('path', { d: `M${x},${y} H${x + w} V${y + h - q} A${q},${q} 0 0 1 ${x + w - q},${y + h} H${x} Z`, fill: BADGE }, g); } // jen pravý spodní roh je zaoblený
    r.dataset.base = BADGE;
    const t = s("text", { x: cx, y: bs.shape ? cy + rr * 0.42 : y + h * 0.76, "text-anchor": "middle", "font-size": bs.shape ? rr * 1.25 : 7.6, "font-weight": 800, "font-family": "Inter, sans-serif", fill: bs.text || "#1a0c0c" }, g);
    if (labels) t.textContent = mat.zones.find((z) => z.id === b.zone).label;
    zoneEls[b.zone].badge = r;
  }

  // míč: tištěný (zóna 1) + živý, který se pohybuje po podložce podle cviku
  const drawBall = (parent, R) => { parent.innerHTML = ballInner(R); }; // kvalitní míč s geometrií komolého dvacetistěnu
  const R = mat.ball.r;
  const printed = s('g', { transform: `translate(${mat.ball.x} ${mat.ball.y})` }, svg);
  if (sk.printBall !== false) drawBall(printed, R, id);

  const liveR = R * 0.62;
  const live = s('g', { opacity: 0 }, svg);
  const liveIn = s('g', {}, live);
  drawBall(liveIn, liveR, `${id}l`);

  const mk = s('g', { opacity: 0, transform: `translate(0 ${-liveR - 3.6})` }, live);
  s('circle', { r: 2.9, fill: '#fff', stroke: '#0A0A0C', 'stroke-width': 0.5 }, mk);
  const mt = s('text', { y: 1.3, 'text-anchor': 'middle', 'font-size': 3.8, 'font-weight': 800, 'font-family': 'Inter, sans-serif', fill: '#0A0A0C' }, mk);
  const ring = s('circle', { r: liveR, fill: 'none', 'stroke-width': 0.8, opacity: 0 }, svg);

  // míč se zastaví přesně uprostřed čísla zóny (jinak ballAt z konfigurace, zóna 1 = tištěný míč, jinak střed zóny)
  const ballPos = (z) => {
    const b = mat.badges.find((x) => x.zone === z.id);
    if (b) return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
    if (z.ballAt) return z.ballAt;
    if (z.id === 1) return { x: mat.ball.x, y: mat.ball.y };
    return { x: ((z.x + z.w / 2) / 100) * W, y: ((z.y + z.h / 2) / 100) * H };
  };
  const setT = (el, ms, props) => { el.style.transition = ms ? `${props} ${ms}ms cubic-bezier(.3,.7,.2,1)` : 'none'; };
  const move = (p, ms) => {
    setT(live, ms, 'transform');
    live.style.transform = `translate(${p.x}px, ${p.y}px)`;
  };
  const home = ballPos(mat.zones.find((z) => z.id === 1) || { id: 1 });
  live.style.transform = `translate(${home.x}px, ${home.y}px)`;


  // skokan: pár realistických otisků chodidel (cvik "přeskoky": míč stojí, hráč ho přeskakuje zleva doprava)
  const footPrint = (parent, mirror) => {
    const f = s("g", { transform: mirror ? "scale(-1 1)" : "" }, parent);
    // levé chodidlo shora: palec vpravo (vnitřní strana), klenba vpravo
    s("path", { d: "M0,9 C-3.6,9 -4.2,6.2 -4,4 C-3.9,1 -4.6,-2 -4.3,-4.5 C-4.1,-6.3 -2.4,-7 0,-7 C2.6,-7 4.3,-6 4.4,-4 C4.5,-2 2.4,0 2.2,2.5 C2,4.5 3.2,6.2 2.8,7.5 C2.4,8.8 1.4,9 0,9 Z", fill: "#f1f1f3" }, f);
    [[3.1, -8.5, 1.75, 1.95], [0.9, -9.3, 1.2, 1.35], [-0.9, -9.0, 1.05, 1.2], [-2.4, -8.3, 0.95, 1.1], [-3.5, -7.2, 0.85, 0.95]].forEach(([x, y, rx, ry]) => s("ellipse", { cx: x, cy: y, rx, ry, fill: "#f1f1f3" }, f));
    return f;
  };
  const jumper = s("g", { opacity: 0 }, svg);
  const jIn = s("g", { transform: "scale(0.8)" }, jumper);
  const pairL = s("g", { transform: "translate(-6.4 0)" }, jIn); footPrint(pairL, false);
  const pairR = s("g", { transform: "translate(6.4 0)" }, jIn); footPrint(pairR, true);
  const spots = mat.jump || { left: { x: mat.ball.x - mat.ball.r * 2.3, y: mat.ball.y }, right: { x: mat.ball.x + mat.ball.r * 2.3, y: mat.ball.y } };
  const JW = 25; const JH = 21;
  let jumpAt = null;
  const place = (p) => { jumper.style.transform = `translate(${p.x}px, ${p.y}px)`; };

  // Twister: každá noha zvlášť (levá a pravá střídavě na různých číslech)
  const mkFoot = (mirror) => { const g = s("g", { opacity: 0 }, svg); const inn = s("g", { transform: "scale(0.5)" }, g); footPrint(inn, mirror); return g; };
  const tf = { left: mkFoot(false), right: mkFoot(true) };
  const feetPos = { left: null, right: null };
  const feetZone = { left: null, right: null };
  const TS = 15; // čtverec kolem aktivní nohy

  // hledání cesty po šipkách (BFS přes zóny) a zhasínání zvýraznění
  const routeBetween = (from, to) => {
    const adj = new Map();
    arrowRefs.forEach((r, i) => { if (!r.between) return; const [a, b] = r.between; (adj.get(a) || adj.set(a, []).get(a)).push([b, i]); (adj.get(b) || adj.set(b, []).get(b)).push([a, i]); });
    const prev = new Map([[from, null]]); const q = [from];
    while (q.length) { const c = q.shift(); if (c === to) break; for (const [n, i] of (adj.get(c) || [])) if (!prev.has(n)) { prev.set(n, [c, i]); q.push(n); } }
    const out = []; let c = to; while (prev.get(c)) { const [p, i] = prev.get(c); out.push(i); c = p; }
    return prev.has(to) ? out : [];
  };
  const hintClear = () => arrowRefs.forEach((r) => { r.parts.forEach((p) => { p.el.setAttribute(p.attr, p.base); p.el.style.animation = ""; }); r.g.style.filter = ""; });

  let active = null;
  let shown = false;
  const api = {
    el: svg,
    /** Zvýrazní zónu: čtverec i živý míč plynule přejedou (glideMs). foot: 'left' | 'right' | undefined. */
    highlight(zoneId, foot, glideMs = 250) {
      const z = zoneEls[zoneId];
      if (!z) return;
      if (active && active.badge) active.badge.setAttribute('fill', active.badge.dataset.base);
      active = z;
      const p = ballPos(z.zone);
      const ms = shown ? glideMs : 0;
      const tr = ms ? `${ms}ms cubic-bezier(.3,.7,.2,1)` : 'none';
      hl.style.transition = `${tr === 'none' ? 'none' : `x ${tr}, y ${tr}`}, fill-opacity .15s, stroke-opacity .15s`;
      hl.style.x = `${p.x - SQ / 2}px`; hl.style.y = `${p.y - SQ / 2}px`;
      hl.setAttribute('fill-opacity', 0.18); hl.setAttribute('stroke-opacity', 1);
      hl.style.filter = `drop-shadow(0 0 3px ${SUN})`;
      if (z.badge) z.badge.setAttribute('fill', SUN);
      live.setAttribute('opacity', 1);
      live.style.filter = 'drop-shadow(0 0 2px rgba(var(--acc-rgb),.8))';
      move(p, ms);
      mk.setAttribute('opacity', foot ? 1 : 0);
      mt.textContent = foot === 'left' ? 'L' : foot === 'right' ? 'P' : '';
      // dopad: kruh se rozšíří a zmizí
      if (shown && ring.animate) {
        ring.setAttribute('cx', p.x); ring.setAttribute('cy', p.y); ring.setAttribute('stroke', SUN);
        ring.animate([{ opacity: 0.9, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(2.4)' }], { duration: 420, delay: ms * 0.8, easing: 'ease-out' });
        ring.style.transformOrigin = `${p.x}px ${p.y}px`;
      }
      shown = true;
    },
    clear() {
      if (active && active.badge) active.badge.setAttribute('fill', active.badge.dataset.base);
      active = null;
      hl.setAttribute('fill-opacity', 0); hl.setAttribute('stroke-opacity', 0);
      hl.style.filter = '';
      mk.setAttribute('opacity', 0);
    },
    /**
     * Plánovaný směr: šipky na cestě ze zóny "from" do zóny "to" se rozsvítí (azurová #19D3FF se září, ať je jiná než žluté šipky a barva týmu) a pulzují.
     * Cesta se hledá po šipkách podložky (nejméně kroků). Bez parametrů zhasne.
     */
    hint(from, to) {
      hintClear();
      if (from == null || to == null || from === to) return;
      const route = routeBetween(from, to);
      route.forEach((i) => {
        const r = arrowRefs[i];
        r.parts.forEach((p) => { p.el.setAttribute(p.attr, HINT); p.el.style.animation = "arrowpulse .55s ease-in-out infinite alternate"; });
        r.g.style.filter = `drop-shadow(0 0 2.6px ${HINT}) drop-shadow(0 0 5px rgba(${hintRgb},.7))`;
      });
    },
    /**
     * Twister: zvolená noha ("left" | "right") se přesune na číslo zóny, druhá zůstává stát tam, kde je.
     * nextZone = kam půjde další (druhá) noha, rozsvítí se k ní šipka.
     */
    step(zone, foot, glideMs = 300, nextZone = null) {
      const z = zoneEls[zone] || zoneEls[1];
      const base = ballPos(z.zone);
      const to = { x: base.x + (foot === "left" ? -3.2 : 3.2), y: base.y };
      const g = tf[foot];
      const had = feetPos[foot];
      const from = had || to;
      g.setAttribute("opacity", 1);
      if (had && g.animate) {
        g.animate([
          { transform: `translate(${from.x}px, ${from.y}px) scale(1)`, offset: 0 },
          { transform: `translate(${(from.x + to.x) / 2}px, ${(from.y + to.y) / 2 - 6}px) scale(1.3)`, offset: 0.5 },
          { transform: `translate(${to.x}px, ${to.y}px) scale(1)`, offset: 1 },
        ], { duration: Math.max(160, glideMs), easing: "ease-in-out" });
      }
      g.style.transform = `translate(${to.x}px, ${to.y}px)`;
      feetPos[foot] = to; feetZone[foot] = zone;
      const ms = had ? glideMs : 0;
      const tr = ms ? `${ms}ms cubic-bezier(.3,.7,.2,1)` : "none";
      hl.style.transition = `${tr === "none" ? "none" : `x ${tr}, y ${tr}, width ${tr}, height ${tr}`}, fill-opacity .15s, stroke-opacity .15s`;
      hl.style.x = `${to.x - TS / 2}px`; hl.style.y = `${to.y - TS / 2}px`; hl.style.width = `${TS}px`; hl.style.height = `${TS}px`;
      hl.setAttribute("fill-opacity", 0.18); hl.setAttribute("stroke-opacity", 1);
      hl.style.filter = `drop-shadow(0 0 3px ${SUN})`;
      // plánovaný směr: z místa druhé nohy na její další číslo
      const other = foot === "left" ? "right" : "left";
      api.hint(nextZone != null ? (feetZone[other] != null ? feetZone[other] : zone) : null, nextZone);
    },
    /** Pro přeskoky: rozsvítí vodorovnou šipku vlevo (1↔2) nebo vpravo (1↔6) od míče. */
    hintSide(side) { api.hint(1, side === "left" ? 2 : 6); },
    /** Zruší zvýraznění a vrátí míč na místo. */
    /** Chodidla skočí na stranu "left" | "right" (přeskok míče, míč stojí) nebo na číslo zóny (kroky bez míče). */
    jump(side, glideMs = 350) {
      const to = typeof side === 'number' ? ballPos((zoneEls[side] || zoneEls[1]).zone) : (spots[side] || spots.left);
      const first = !jumpAt;
      const from = jumpAt || to;
      jumpAt = to;
      jumper.setAttribute("opacity", 1);
      const mid = { x: (from.x + to.x) / 2, y: to.y - mat.ball.r * 1.5 };
      if (!first && jumper.animate) {
        jumper.animate([
          { transform: `translate(${from.x}px, ${from.y}px) scale(1)`, offset: 0 },
          { transform: `translate(${mid.x}px, ${mid.y}px) scale(1.3)`, offset: 0.5 },
          { transform: `translate(${to.x}px, ${to.y}px) scale(1)`, offset: 1 },
        ], { duration: Math.max(180, glideMs), easing: "ease-in-out" });
      }
      place(to);
      const ms = first ? 0 : glideMs;
      const tr = ms ? `${ms}ms cubic-bezier(.3,.7,.2,1)` : "none";
      hl.style.transition = `${tr === "none" ? "none" : `x ${tr}, y ${tr}, width ${tr}, height ${tr}`}, fill-opacity .15s, stroke-opacity .15s`;
      hl.style.x = `${to.x - JW / 2}px`; hl.style.y = `${to.y - JH / 2}px`; hl.style.width = `${JW}px`; hl.style.height = `${JH}px`;
      hl.setAttribute("fill-opacity", 0.18); hl.setAttribute("stroke-opacity", 1);
      hl.style.filter = `drop-shadow(0 0 3px ${SUN})`;
    },
    reset() {
      hintClear();
      jumpAt = null; jumper.setAttribute("opacity", 0);
      feetPos.left = feetPos.right = null; feetZone.left = feetZone.right = null; tf.left.setAttribute("opacity", 0); tf.right.setAttribute("opacity", 0);
      hl.style.width = `${SQ}px`; hl.style.height = `${SQ}px`;
      api.clear(); shown = false;
      move(home, 350); live.setAttribute('opacity', 0);
    },
  };
  return api;
}
