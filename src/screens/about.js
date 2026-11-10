import { h, btn, u, icon } from '../ui/dom.js';
import { applyTheme } from '../ui/theme.js';
import cardsData from '../content/cards.json';

// O aplikaci a licence: odkud co pochází (fotky, texty, loga, hlas, písmo, software). Rodiče → Data a zabezpečení.
const SOURCES = [
  ['Fotky hráčů na kartách', 'Wikimedia Commons, volné licence (CC BY, CC BY-SA, public domain). Autor a licence každé fotky jsou uvedeny na rubu karty a v seznamu níže. Fotky se jen ořezávají.'],
  ['Texty na rubu karet', 'Ručně psané zajímavosti; u ostatních hráčů krátký popis z české Wikipedie (CC BY-SA 4.0, wikipedia.org). Zdroj je uveden na kartě.'],
  ['Loga a názvy klubů a reprezentací', 'Jsou ochrannými známkami svých vlastníků a slouží jen k označení týmu. Aplikace není s kluby, hráči ani svazy nijak spojená ani jimi podporovaná. Zdroje: oficiální weby klubů a databáze TheSportsDB.'],
  ['Hlas Trenér', 'Syntetizovaný neuronový hlas (Microsoft Edge TTS). Věty jsou předgenerované a uložené v aplikaci.'],
  ['Zvuky a hudba', 'Vlastní syntetizované zvuky (úvod, úspěch, odměna, konfety, klik).'],
  ['Písmo', 'Inter, licence SIL Open Font License 1.1.'],
  ['Ikony', 'Lucide (lucide.dev), licence ISC.'],
  ['Software', 'Vite, Tailwind CSS a Capacitor (licence MIT).'],
  ['Cviky', 'Vlastní zpracování běžných tréninkových cviků s míčem a podložkou.'],
];

export default function about(_p, { back }) {
  applyTheme(null);
  const el = h('section', 'screen');
  el.style.cssText += `;justify-content:flex-start;overflow-y:auto;gap:${u(1.6)};align-items:stretch`;
  const head = h('div', 'flex items-center justify-between');
  const ttl = h('div', 'flex flex-col gap-1'); ttl.append(h('div', 'eyebrow', 'Fotbal · Tréninková podložka'), h('div', 'title', 'O aplikaci a <span class="accent">licence</span>'));
  const bk = btn(`${icon('back')}Zpět`, 'btn-primary', () => back(), { auto: true });
  bk.style.minHeight = u(6); bk.style.fontSize = u(2.1);
  head.append(ttl, bk);
  const intro = h('div', 'muted', 'Bezplatná nekomerční aplikace pro trénink s fotbalovou podložkou. Všechna data zůstávají v zařízení, nic se nikam neodesílá. Autor: <b style="color:#fff">Jakub Uhlíř</b>.');
  intro.style.fontSize = u(1.7);
  el.append(head, intro);

  const grid = h('div', ''); grid.style.cssText = `display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:${u(1.2)}`;
  for (const [t, d] of SOURCES) {
    const c = h('div', ''); c.style.cssText = `border:1px solid var(--line);border-radius:var(--r-btn);background:rgba(255,255,255,.03);padding:${u(1.2)} ${u(1.6)};display:flex;flex-direction:column;gap:${u(0.4)}`;
    c.append(h('div', '', t), h('div', 'muted', d));
    c.firstChild.style.cssText = `font-weight:800;font-size:${u(1.8)}`; c.lastChild.style.cssText = `font-size:${u(1.35)};line-height:1.35`;
    grid.append(c);
  }
  el.append(grid);

  const credits = cardsData.filter((c) => c.photo);
  const cl = h('div', 'eyebrow', `Autoři fotek na kartách (${credits.length})`);
  const list = h('div', ''); list.style.cssText = `columns:3;column-gap:${u(2)};font-size:${u(1.15)};line-height:1.45;color:var(--c-mute)`;
  list.innerHTML = credits.map((c) => `<div style="break-inside:avoid"><b style="color:#fff">${c.name}</b>: ${(c.author || 'neuvedeno').slice(0, 60)}, ${c.license || ''}</div>`).join('');
  el.append(cl, list);
  return el;
}
