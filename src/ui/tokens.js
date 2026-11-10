// Design systém – jediný zdroj pravdy pro barvy a rozměry.
// Tailwind čte `colors`, CSS proměnné se generují z `cssVars()`.
// Směr: černá + jedna výrazná zelená (tráva), zóny jako jemné neonové akcenty.
export const colors = {
  ink: { 950: '#050506', 900: '#0A0A0C', 800: '#111114', 700: '#18181C', 600: '#232329' },
  sun: { DEFAULT: '#16C45A', soft: '#4EE08A', deep: '#0E9A44' },
  grass: { DEFAULT: '#2FD576', dark: '#17A257' },
  chalk: '#F5F5F7',
  mute: '#8E8E98',
  zone: {
    1: '#FF5C6C', 2: '#FF9A3D', 3: '#FFD400',
    4: '#34D88A', 5: '#38BDF8', 6: '#A78BFA',
  },
};

export const radius = { card: '1.4rem', pill: '999px' };

export function cssVars() {
  const v = {
    '--c-bg': colors.ink[950], '--c-bg-deep': '#000', '--c-surface': colors.ink[800],
    '--c-grass': colors.grass.DEFAULT, '--c-sun': colors.sun.DEFAULT, '--c-chalk': colors.chalk,
    '--c-mute': colors.mute, '--radius-card': radius.card,
  };
  Object.entries(colors.zone).forEach(([k, c]) => { v[`--zone-${k}`] = c; });
  return v;
}
