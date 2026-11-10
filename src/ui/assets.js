// Obrázky přes assets/manifest.json. Chybí-li soubor, vykreslí se barevný placeholder s popiskem.
import manifest from '../../assets/manifest.json';

const PALETTE = ['#FF5252', '#FF9F1C', '#3DDC84', '#2EC4FF', '#B15CFF', '#FFD400'];

export function img(key, { cls = '', alt } = {}) {
  const m = manifest[key];
  const wrap = document.createElement('div');
  wrap.className = `relative overflow-hidden ${cls}`;
  const idx = Object.keys(manifest).indexOf(key);
  wrap.style.background = PALETTE[idx % PALETTE.length];
  wrap.style.aspectRatio = m ? `${m.w} / ${m.h}` : '1 / 1';
  wrap.innerHTML = `<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:700 1.2em 'Baloo 2';color:#07140F;text-align:center;padding:.5em">${m ? m.label : key}</span>`;
  if (m) {
    const i = new Image();
    i.alt = alt || m.label;
    i.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain';
    i.onload = () => { wrap.style.background = 'transparent'; wrap.replaceChildren(i); };
    i.src = m.file;
  }
  return wrap;
}
