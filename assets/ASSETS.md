# Grafika aplikace

Hotové prvky jsou v `assets/img/art/*.webp` (průhledné WebP). Vyrábí je `node scripts/build-art.mjs` ze zdrojových obrázků
z Gemini ve složce `obrazky/` (přiřazení souborů k významu je na začátku skriptu; `node scripts/build-art.mjs levels` přegeneruje jen jednu část).
Styl: tmavé pozadí `#0A0A0C`, jediná výrazná zelená `#16C45A`, lesklé 3D prvky se zelenou září.

| Soubor | Použití |
|---|---|
| `hero_ball.webp` | úvodní obrazovka |
| `bg_menu.webp` / `bg_win.webp` / `bg_field.webp` | pozadí aplikace / výsledku tréninku / záloha |
| `ic_*.webp` | ikony rozhraní (`icon('name')` v `src/ui/dom.js`) |
| `rw_<bronze\|silver\|gold\|diamond>_<druh>.webp` | odměny (`src/ui/RewardIcon.js`); diamant se odvozuje ze stříbra |
| `lv_1..4.webp` | štíty úrovní cviků (výběr cviků) |
| `av_01..24.webp` | postavičky hráčů (`src/ui/faces.js`, pole `face` v profilu) |
| `fx_*.webp` | efekty (jiskry, konfety, záblesk) |
| `card_frame_<common|rare|epic|legend>.webp` + `src/ui/cardFrame.json` | rámeček karty přebarvený podle vzácnosti a rozměry okna, štítku a destičky (`src/ui/CardView.js`) |
| `app_icon.webp`, `logo.webp`, `banner.webp` | ikona, logo, banner (Android ikony a `tv_banner.png` skript zapisuje do `android/`) |

Loga týmů: `assets/img/teams/<id>.png`, seznam v `src/config/teams.json`. Podložka, nohy, míč na podložce a šipky se kreslí kódem (`src/ui/MatView.js`).
