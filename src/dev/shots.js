// Pomůcka pro snímky obrazovek do README: http://localhost:5173/?shot=home (home | cards | cardopen | rewards | player | match | parent | mats | profiles).
// Vytvoří ukázkového hráče s trochou postupu a otevře zadanou obrazovku. Mění jen data prohlížeče, ve kterém se spustí.
import { go } from '../core/router.js';
import { storage } from '../storage/index.js';
import { createProfile, saveProfile, addHistory } from '../domain/profiles.js';
import { allCards } from '../domain/extras.js';
import { workoutFromSelection } from '../domain/trainer.js';
import { getMat, setMatVariants } from '../config/mats.js';

export async function run(name) {
  await storage.clear();
  const team = 'cze'; // česká reprezentace
  const p = await createProfile({ name: 'Honza', jersey: '24', team: 'cze' });
  const day = 86400000;
  for (let i = 4; i >= 0; i -= 2) await addHistory(p.id, { durationSec: 360, xp: 60, drills: ['sole-taps', 'side-push-left', 'drag-back'], stars: 3 - (i % 2) });
  const hist = await storage.list('history'); hist.forEach((h, i) => { h.date = Date.now() - (hist.length - 1 - i) * 2 * day; storage.put('history', h); });
  const fresh = (await storage.get('profiles', p.id));
  const cards = allCards().filter((_, i) => i % 3 === 0 || i < 4);
  fresh.cards = Object.fromEntries(cards.map((c) => [c.id, 1]));
  fresh.xp = 420; fresh.level = 2; fresh.matches = 3;
  await saveProfile(fresh);
  setMatVariants({ 'maximize-black': 'red' });
  const mat = getMat('uniteam-90x60');
  const wo = workoutFromSelection(['sole-taps', 'side-push-left'], 2);
  const act = {
    home: () => go('home', { profileId: p.id }),
    cards: () => go('cards', { profileId: p.id }),
    rewards: () => go('rewards', { profileId: p.id }),
    match: () => go('match', { profileId: p.id }),
    parent: () => go('parent', {}),
    profiles: () => go('profiles', {}),
    player: () => go('player', { profile: fresh, mat, workout: wo, tempoMul: 0.8 }),
    cardopen: async () => {
      go('cards', { profileId: p.id });
      await new Promise((r) => setTimeout(r, 1500));
      const b = [...document.querySelectorAll('button')].find((x) => /Lionel Messi/.test(x.textContent));
      if (b) b.click();
    },
  };
  (act[name] || act.home)();
}
