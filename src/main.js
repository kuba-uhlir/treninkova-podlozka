import './ui/styles.css';
import { cssVars } from './ui/tokens.js';
import { initFocus } from './core/focus.js';
import { register, go } from './core/router.js';
import { setVolume, setVoiceStyle, setVoiceIndex, setVoiceMode } from './core/audio.js';
import { settings } from './storage/index.js';
import { setMatVariants } from './config/mats.js';
import profiles, { createProfileScreen } from './screens/profiles.js';
import home from './screens/home.js';
import player from './screens/player.js';
import result from './screens/result.js';
import parent, { pinScreen, pinResetScreen, setPinScreen } from './screens/parent.js';
import drillsScreen from './screens/drills.js';
import levels from './screens/levels.js';
import rewards from './screens/rewards.js';
import intro from './screens/intro.js';
import newPlayer from './screens/newPlayer.js';
import cards from './screens/cards.js';
import match from './screens/match.js';
import warmup from './screens/warmup.js';
import myWorkouts from './screens/myWorkouts.js';
import about from './screens/about.js';

// pozadí celé aplikace: tmavé hřiště z linek (obrázek se hledá relativně k index.html)
document.body.style.background = "#000 url('img/art/bg_menu.webp') center / cover no-repeat";
Object.entries(cssVars()).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));

register('profiles', profiles);
register('createProfile', createProfileScreen);
register('home', home);
register('player', player);
register('result', result);
register('pin', pinScreen);
register('pinReset', pinResetScreen);
register('setPin', setPinScreen);
register('parent', parent);
register('drills', drillsScreen);
register('levels', levels);
register('rewards', rewards);
register('intro', intro);
register('newPlayer', newPlayer);
register('cards', cards);
register('match', match);
register('warmup', warmup);
register('myWorkouts', myWorkouts);
register('about', about);

initFocus();
// start: načtení nastavení; první hráč se vytvoří průvodcem „Nový hráč“
async function boot() {
  try {
    const s = await settings.load();
    setVolume('voice', s.volVoice); setVolume('sfx', s.volSfx); setVolume('music', s.volMusic);
    setVoiceStyle(s.voiceStyle); setVoiceIndex(s.voiceIdx); setMatVariants(s.matVariants); setVoiceMode(s.voiceMode);
  } catch (e) { /* bez databáze appka pořád běží */ }
  if (new URLSearchParams(location.search).has('demo')) { try { await (await import('./dev/demo.js')).ensureDemoPlayer(); } catch (e) { /* bez dema */ } } // ?demo = ukázkový hráč
  const shot = new URLSearchParams(location.search).get('shot'); // pomůcka pro snímky do README (src/dev/shots.js)
  if (shot) { const m = await import('./dev/shots.js'); await m.run(shot); return; }
  go('intro');
}
boot();

// Android Back (Capacitor) → stejné chování jako klávesa Back
import('@capacitor/app').then(({ App }) => {
  App.addListener('backButton', () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'GoBack' })));
}).catch(() => {});
