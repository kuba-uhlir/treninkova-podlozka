// Storage vrstva: jednoduché async rozhraní. Ve fázi 3 přibude firebase adapter se stejným rozhraním.
// Rozhraní: get(store, id), put(store, obj), remove(store, id), list(store), clear().
// Stores: profiles, history, settings (objekty s polem `id`).
const DB = 'fotbal';
const STORES = ['profiles', 'history', 'settings'];
let dbp = null;

function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => STORES.forEach((s) => r.result.createObjectStore(s, { keyPath: 'id' }));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  return dbp;
}
const run = async (store, mode, fn) => {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = fn(tx.objectStore(store));
    tx.oncomplete = () => resolve(req && req.result);
    tx.onerror = () => reject(tx.error);
  });
};

export const storage = {
  get: (store, id) => run(store, 'readonly', (s) => s.get(id)),
  put: (store, obj) => run(store, 'readwrite', (s) => s.put(obj)),
  remove: (store, id) => run(store, 'readwrite', (s) => s.delete(id)),
  list: (store) => run(store, 'readonly', (s) => s.getAll()),
  async clear() { for (const s of STORES) await run(s, 'readwrite', (o) => o.clear()); },
};

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const settings = {
  defaults: { pin: '0246', pinCustom: false, matId: 'uniteam-90x60', difficulty: 'auto', tempoMode: 'auto', voiceStyle: 'trener', voiceIdx: 0, tempoMul: 1, workoutMin: 6, volVoice: 1, volSfx: 0.8, volMusic: 0.4, customWorkouts: [], matVariants: {}, voiceMode: 'voice' },
  async load() { return { ...this.defaults, ...((await storage.get('settings', 'main')) || {}) }; },
  async save(patch) { const cur = await this.load(); await storage.put('settings', { ...cur, ...patch, id: 'main' }); },
};
