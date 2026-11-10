import { focusInitial, onBack } from './focus.js';

const screens = {};
const stack = [];
export const register = (name, fn) => { screens[name] = fn; };

export function go(name, params = {}, { replace = false } = {}) {
  const app = document.getElementById('app');
  const screen = screens[name];
  if (!screen) throw new Error(`Neznámá obrazovka: ${name}`);
  if (replace) stack.pop();
  stack.push({ name, params });
  app.replaceChildren();
  app.scrollTop = 0; document.documentElement.scrollTop = 0; document.body.scrollTop = 0; // po dlouhé obrazovce (formulář) nenechat zbytkový posun
  onBack(back); // výchozí Back = zpět; obrazovka může přepsat přes api.onBack
  const el = screen(params, { go, back, onBack });
  app.appendChild(el);
  focusInitial(el);
  setTimeout(() => { if (el.isConnected) el.classList.add('settled'); }, 1300);
}

export function back() {
  if (stack.length < 2) return false;
  stack.pop();
  const prev = stack.pop();
  go(prev.name, prev.params);
  return true;
}
export const canGoBack = () => stack.length > 1;
