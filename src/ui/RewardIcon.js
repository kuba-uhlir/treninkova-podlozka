// Ikony odměn: hotové obrázky assets/img/art/rw_<úroveň>_<druh>.webp (medaile, pohár, zlatý míč, hvězda, plamen, kopačka, štít, koruna, hodiny, svítání)
// v bronzu, stříbře, zlatě a diamantu. Zamčené odměny jsou ztmavená černobílá silueta. Obrázky vyrábí scripts/build-art.mjs.
import { TIERS } from '../domain/rewards.js';

const KINDS = new Set(['medal', 'trophy', 'ball', 'flame', 'boot', 'shield', 'crown', 'clock', 'sunrise']);

export function rewardIcon(r, size, { locked = false } = {}) {
  const t = TIERS[r.tier] ? r.tier : 'bronze';
  const kind = KINDS.has(r.kind) ? r.kind : 'star';
  const el = document.createElement('div');
  el.style.cssText = `width:${size};height:${size};flex:none;${locked ? 'opacity:.3;filter:grayscale(1) brightness(.8)' : `filter:drop-shadow(0 .6vmin 1.4vmin rgba(0,0,0,.5)) drop-shadow(0 0 1.6vmin ${TIERS[t].a}55)`}`;
  el.innerHTML = `<img src="img/art/rw_${t}_${kind}.webp" alt="" draggable="false" style="width:100%;height:100%;object-fit:contain">`;
  return el;
}
