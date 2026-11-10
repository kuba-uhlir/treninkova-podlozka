// Registr podložek. Nová podložka = nový soubor src/config/mats/<id>.json (viz README), nic dalšího nepřepisovat.
const files = import.meta.glob('./mats/*.json', { eager: true });
const mats = Object.values(files).map((m) => m.default || m);

export const DEFAULT_MAT_ID = 'uniteam-90x60';
export const listMats = () => [...mats].sort((a, b) => (a.id === DEFAULT_MAT_ID ? -1 : b.id === DEFAULT_MAT_ID ? 1 : a.name.localeCompare(b.name, 'cs')));
// Vybrané barevné provedení každé podložky (id podložky -> id varianty); nastavuje rodič, načítá se při startu.
let chosen = {};
export const setMatVariants = (m) => { chosen = m || {}; };
const mergeSkin = (a = {}, b = {}) => ({ ...a, ...b, badge: { ...(a.badge || {}), ...(b.badge || {}) } });
/** Podložka s použitou barevnou variantou (variants[].skin přepíše skin podložky). */
export function withVariant(m, variantId) {
  const v = (m.variants || []).find((x) => x.id === variantId);
  return v ? { ...m, skin: mergeSkin(m.skin, v.skin), activeVariant: v.id } : m;
}
export const getMat = (id, variant) => {
  const m = mats.find((x) => x.id === id) || mats.find((x) => x.id === DEFAULT_MAT_ID) || mats[0];
  return withVariant(m, variant || chosen[m.id]);
};

/**
 * Vzor zón pro cvik na dané podložce: podložka může mít vlastní `drillPatterns[drillId]`;
 * jinak se použije výchozí vzor cviku, pokud všechny jeho zóny na podložce existují; jinak null (cvik se přeskočí).
 */
export function patternFor(drill, mat) {
  const own = mat.drillPatterns && mat.drillPatterns[drill.id];
  if (own) return own;
  const ids = new Set(mat.zones.map((z) => z.id));
  return drill.pattern.every((z) => ids.has(z)) ? drill.pattern : null;
}

/** Střed zóny na podložce (střed čísla; zóna 1 = míč). */
export function zonePoint(mat, id) {
  const b = (mat.badges || []).find((x) => x.zone === id);
  if (b) return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  return { x: mat.ball.x, y: mat.ball.y };
}

/** Klíč hlášky se směrem pohybu ze zóny "from" do zóny "to" (hráč stojí dole za míčem: nahoře = dopředu). */
export function directionKey(mat, from, to) {
  if (from == null || to == null || from === to) return null;
  const a = zonePoint(mat, from); const b = zonePoint(mat, to);
  const dx = b.x - a.x; const dy = b.y - a.y;
  const horiz = Math.abs(dy) < 0.4 * Math.abs(dx); const vert = Math.abs(dx) < 0.4 * Math.abs(dy);
  if (horiz) return dx < 0 ? "dir_l" : "dir_r";
  if (vert) return dy < 0 ? "dir_f" : "dir_b";
  return dy < 0 ? (dx < 0 ? "dir_fl" : "dir_fr") : (dx < 0 ? "dir_bl" : "dir_br");
}
