// Miniatura podložky s nákresem cviku: šipky ukazují, kudy míč (plná čára), nohy (čárkovaně) nebo přeskok (oblouk) jdou.
import { patternFor } from '../config/mats.js';
import { ballInner } from './BallSvg.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (parent) parent.appendChild(e);
  return e;
};
let n = 0;

/** Střed zóny na podložce (střed čísla, zóna 1 = míč). */
function zonePoint(mat, id) {
  const b = (mat.badges || []).find((x) => x.zone === id);
  // okrajová čísla posunout dovnitř, ať se čtverečky neořezávají
  if (b) return { x: Math.min(Math.max(b.x + b.w / 2, 12.5), mat.viewBox[0] - 12.5), y: b.y + b.h / 2 };
  return { x: mat.ball.x, y: mat.ball.y };
}

export function drillDiagram(drill, mat) {
  const [W, H] = mat.viewBox;
  const id = `dd${n++}`;
  const wrap = document.createElement('div');
  wrap.style.cssText = `width:100%;aspect-ratio:${W}/${H + 10};border-radius:var(--r-sm);overflow:hidden`; // vyšší náhled: víc místa nahoře a dole
  const svg = s('svg', { viewBox: `0 -5 ${W} ${H + 10}`, width: '100%', height: '100%', 'aria-hidden': 'true' });
  wrap.append(svg);
  const defs = s('defs', {}, svg);
  const mk = s('marker', { id: `${id}a`, viewBox: '0 0 10 10', refX: 7, refY: 5, markerWidth: 3.4, markerHeight: 3.4, orient: 'auto-start-reverse' }, defs);
  s('path', { d: 'M0 0 L10 5 L0 10 z', style: 'fill:var(--c-sun)' }, mk);

  s('rect', { x: 0, y: -5, width: W, height: H + 10, rx: 3, fill: '#0e0e10', stroke: 'rgba(255,255,255,.12)', 'stroke-width': 0.5 }, svg);

  const type = drill.type || 'ball';
  const pat = type === 'jump' ? [] : (patternFor(drill, mat) || drill.pattern || []);
  const used = new Set(pat);

  // zóny (slabě), použité zvýrazněné
  for (const z of mat.zones) {
    const p = zonePoint(mat, z.id);
    if (z.id === 1) continue;
    const on = used.has(z.id);
    s('rect', { x: p.x - 10.5, y: p.y - 9.2, width: 21, height: 18.4, rx: 2.8, fill: on ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.04)', stroke: on ? 'var(--c-sun)' : 'rgba(255,255,255,.12)', 'stroke-width': on ? 1.5 : 0.6 }, svg);
    const t = s('text', { x: p.x, y: p.y + 6.4, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 800, 'font-family': 'Inter, sans-serif', fill: on ? '#fff' : 'rgba(255,255,255,.3)' }, svg);
    t.textContent = String(z.id);
  }
  // míč (zóna 1)
  const bp = zonePoint(mat, 1);
  const R = 12;
  const ballG = s('g', { transform: `translate(${bp.x} ${bp.y})` }, svg); ballG.innerHTML = ballInner(R);
  if (used.has(1) || type === 'jump') s('circle', { cx: bp.x, cy: bp.y, r: R + 1.6, fill: 'none', style: 'stroke:var(--c-sun)', 'stroke-width': 1.4 }, svg);

  const line = { fill: 'none', style: 'stroke:var(--c-sun)', 'stroke-width': 3.6, 'stroke-linecap': 'round', 'marker-end': `url(#${id}a)` };
  const dash = type === 'step' ? { 'stroke-dasharray': '3 2.4' } : {};

  if (type === 'jump') {
    // oblouk přes míč zleva doprava a zpět
    const y = bp.y; const dx = R * 2.5;
    const top = bp.y - R * 2.3;
    s('path', { d: `M${bp.x - dx} ${y} Q${bp.x} ${top} ${bp.x + dx} ${y}`, ...line, 'marker-start': `url(#${id}a)` }, svg);
    for (const sx of [-dx, dx]) { // dvě chodidla na každé straně
      s('rect', { x: bp.x + sx - 4.4, y: y - 2, width: 3.6, height: 8.2, rx: 1.6, fill: '#fff', opacity: 0.9 }, svg);
      s('rect', { x: bp.x + sx + 0.8, y: y - 2, width: 3.6, height: 8.2, rx: 1.6, fill: '#fff', opacity: 0.9 }, svg);
    }
  } else if (pat.length === 1) {
    // klepání na místě: tři šipky dolů na míč
    for (const dx of [-5, 0, 5]) s('path', { d: `M${bp.x + dx} ${bp.y - R - 9} L${bp.x + dx} ${bp.y - R - 2.4}`, ...line }, svg);
  } else if (pat.length > 1) {
    // cesta mezi zónami (jeden průchod vzoru + návrat na začátek); zpětné spoje mírně odsazené
    const pts = pat.map((z) => ({ z, ...zonePoint(mat, z) }));
    const edges = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]; const b = pts[(i + 1) % pts.length];
      if (a.z === b.z) continue;
      if (!edges.some((e) => e.a.z === a.z && e.b.z === b.z)) edges.push({ a, b });
    }
    for (const { a, b } of edges) {
      const back = edges.some((e) => e.a.z === b.z && e.b.z === a.z);
      let x1 = a.x; let y1 = a.y; let x2 = b.x; let y2 = b.y;
      const L = Math.hypot(x2 - x1, y2 - y1); const ux = (x2 - x1) / L; const uy = (y2 - y1) / L;
      const sh1 = a.z === 1 ? R + 1 : 12.4; const sh2 = b.z === 1 ? R + 3 : 13.6; // zkrátit, ať šipky nelezou na ikony
      x1 += ux * sh1; y1 += uy * sh1; x2 -= ux * sh2; y2 -= uy * sh2;
      if (back) { const ox = -uy * 3.4; const oy = ux * 3.4; x1 += ox; y1 += oy; x2 += ox; y2 += oy; }
      s('path', { d: `M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`, ...line, ...dash }, svg);
    }
    // start
    const st = pts[0];
    s('circle', { cx: st.x - (st.z === 1 ? 0 : 8), cy: st.y - (st.z === 1 ? R + 3 : 6.4), r: 3.4, style: 'fill:var(--c-sun)' }, svg);
  }
  return wrap;
}
