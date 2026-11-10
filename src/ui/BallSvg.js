// Kvalitní fotbalový míč jako SVG: skutečná geometrie komolého dvacetistěnu (12 černých pětiúhelníků, bílé šestiúhelníky, švy),
// ortografická projekce, stínování k okraji a odlesk. Geometrie se spočítá jednou, kreslí se ve jednotkové kružnici (poloměr 1).
let uid = 0;
const PHI = (1 + Math.sqrt(5)) / 2;
const norm = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

const BASE = [[0, 1, PHI], [0, 1, -PHI], [0, -1, PHI], [0, -1, -PHI], [1, PHI, 0], [1, -PHI, 0], [-1, PHI, 0], [-1, -PHI, 0], [PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, 1], [-PHI, 0, -1]].map(norm);

/** Rotace (Rodrigues): vrchol 0 se přetočí na cíl a pak se celé těleso otočí kolem osy pohledu. */
function orient(target, spin) {
  const t = norm(target); const v = BASE[0];
  const ax = cross(v, t); const s = Math.hypot(...ax); const c = dot(v, t);
  const k = s < 1e-9 ? [0, 0, 1] : mul(ax, 1 / s);
  const rod = (p) => add(add(mul(p, c), mul(cross(k, p), s)), mul(k, dot(k, p) * (1 - c)));
  const cs = Math.cos(spin); const sn = Math.sin(spin);
  return (p) => { const q = rod(p); return [q[0] * cs - q[1] * sn, q[0] * sn + q[1] * cs, q[2]]; };
}

function geometry() {
  const rot = orient([0.2, -0.16, 0.966], 0.35);
  const V = BASE.map(rot);
  const nb = V.map((v, i) => V.map((w, j) => [w, j]).filter(([w, j]) => j !== i && dot(v, w) > 0.4)); // 5 sousedů
  const slerp = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => norm(add(mul(a, 1 - i / n), mul(b, i / n))));
  const rim = (p) => { if (p[2] >= 0) return [p[0], p[1]]; const r = Math.hypot(p[0], p[1]) || 1; return [p[0] / r, p[1] / r]; }; // zadní strana se přimáčkne k okraji
  const f = (n) => n.toFixed(3);

  const pent = []; // černé pětiúhelníky
  const corners = V.map(() => []); // pro švy: roh pětiúhelníku směrem k sousedovi
  V.forEach((v, i) => {
    if (v[2] < -0.45) return;
    const e1 = norm(cross(v, Math.abs(v[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0])); const e2 = cross(v, e1);
    const ring = nb[i].map(([w, j]) => ({ j, p: norm(add(mul(v, 2), w)), a: Math.atan2(dot(w, e2), dot(w, e1)) })).sort((x, y) => x.a - y.a);
    ring.forEach((r) => { corners[i][r.j] = r.p; });
    const pts = [];
    ring.forEach((r, k) => { const nx = ring[(k + 1) % ring.length]; slerp(r.p, nx.p, 5).slice(0, -1).forEach((q) => pts.push(rim(q))); });
    pent.push(`M${pts.map((q) => `${f(q[0])} ${f(q[1])}`).join('L')}Z`);
  });

  const seams = []; // švy mezi sousedními pětiúhelníky (hrany mezi šestiúhelníky)
  V.forEach((v, i) => nb[i].forEach(([, j]) => {
    if (j < i) return;
    const a = norm(add(mul(V[i], 2), V[j])); const b = norm(add(mul(V[j], 2), V[i]));
    const pts = slerp(a, b, 6);
    let d = ''; let pen = false;
    pts.forEach((q) => { if (q[2] > 0.02) { d += `${pen ? 'L' : 'M'}${f(q[0])} ${f(q[1])}`; pen = true; } else pen = false; });
    if (d) seams.push(d);
  }));
  return { pent: pent.join(''), seams: seams.join('') };
}

let G = null;

/** Vnitřek SVG míče se středem v (0,0) a poloměrem r (vloží se do <svg>/<g>). */
export function ballInner(r = 1) {
  if (!G) G = geometry();
  const id = `bl${uid++}`;
  const s = r;
  return `<defs>
    <radialGradient id="${id}b" cx=".36" cy=".3" r=".95"><stop offset="0" stop-color="#ffffff"/><stop offset=".62" stop-color="#f1f1f3"/><stop offset="1" stop-color="#c4c5cb"/></radialGradient>
    <radialGradient id="${id}s" cx=".36" cy=".32" r=".92"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></radialGradient>
    <radialGradient id="${id}h" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <clipPath id="${id}c"><circle r="1"/></clipPath>
  </defs>
  <g transform="scale(${s})">
    <circle r="1" fill="url(#${id}b)"/>
    <g clip-path="url(#${id}c)">
      <path d="${G.seams}" fill="none" stroke="#7d7e86" stroke-width=".022" stroke-linecap="round"/>
      <path d="${G.pent}" fill="#17171b" stroke="#17171b" stroke-width=".012" stroke-linejoin="round"/>
      <circle r="1" fill="url(#${id}s)"/>
      <ellipse cx="-.34" cy="-.42" rx=".3" ry=".17" transform="rotate(-38 -.34 -.42)" fill="url(#${id}h)"/>
    </g>
    <circle r=".985" fill="none" stroke="#000" stroke-opacity=".28" stroke-width=".03"/>
  </g>`;
}

/** Samostatný <svg> s míčem (jednotkové viewBox, vyplní kontejner). */
export const ballSvg = () => `<svg viewBox="-1.04 -1.04 2.08 2.08" width="100%" height="100%" aria-hidden="true">${ballInner(1)}</svg>`;
