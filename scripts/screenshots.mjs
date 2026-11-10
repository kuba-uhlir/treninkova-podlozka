// Pořídí snímky obrazovek pro README (docs/screenshots/*.png) přes Edge/Chrome bez okna a ladicí protokol.
// Spuštění: npm run dev (v jiném okně) a pak node scripts/screenshots.mjs  — používá pomůcku src/dev/shots.js (?shot=...)
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const BROWSER = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find((p) => fs.existsSync(p));
if (!BROWSER) throw new Error('Nenalezen Edge ani Chrome');
const BASE = process.env.APP_URL || 'http://localhost:5173';
const SHOTS = [['home', 4500], ['cards', 4500], ['cardopen', 6500], ['rewards', 4500], ['player', 4800], ['match', 4500], ['parent', 5000], ['profiles', 4500]];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync('docs/screenshots', { recursive: true });

for (const [name, wait] of SHOTS) {
  const dir = `${process.env.TEMP || '/tmp'}/shot-${name}`;
  fs.rmSync(dir, { recursive: true, force: true });
  const proc = spawn(BROWSER, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${dir}`, '--remote-debugging-port=9333', '--window-size=1920,1080', 'about:blank'], { stdio: 'ignore' });
  let tabs;
  for (let i = 0; i < 40; i++) { try { tabs = await (await fetch('http://127.0.0.1:9333/json')).json(); if (tabs.length) break; } catch { /* ještě neběží */ } await sleep(250); }
  const page = tabs.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => { ws.onopen = r; });
  let id = 0; const pending = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); } };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `${BASE}/?shot=${name}` });
  await sleep(wait);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`docs/screenshots/${name}.png`, Buffer.from(shot.data, 'base64'));
  console.log('snímek', name);
  ws.close(); proc.kill();
  await sleep(600);
}
