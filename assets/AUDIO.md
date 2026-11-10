# Audio – hlasy průvodce, efekty, hudba

Hlášky jsou v databázi `src/content/phrases.json`:
- `fixed`: čísla zón (`zone_1`…`zone_6`), `side_left`/`side_right`, odpočet (`countdown_3…1`) a staré jednotlivé hlášky.
- `groups`: skupiny vět s **více variantami** (`welcome`, `next`, `last`, `go`, `praise`, `half`, `almost`, `rest`, `end`, `aborted`, `levelup`, `pause`, `resume`).
  Při použití se varianta losuje (nikdy 2× po sobě stejná). Klíč souboru je `<skupina>_<číslo>`, např. `praise_7`.
  Další variantu přidáš jako další řádek ve skupině a znovu spustíš generování.

## Soubory
`assets/audio/voice/<styl>/<klíč>.mp3`, jediný styl: `trener` (neuronový hlas Antonín).
Vedle nich leží `_meta.json` (kdy v nahrávce skutečně začíná a končí řeč). Podle něj se věty nepřerušují a nečeká se na ticho na konci.

```
node scripts/gen-voices.mjs          # vygeneruje chybějící hlášky (neuronové české hlasy), jde opakovat
node scripts/analyze-voices.mjs      # přepočítá _meta.json
```
Chybí-li soubor, mluví TTS zařízení.

## Jak se hlášky řadí
- **call** (čísla zón, strany): přeskočí se, když zrovna zní věta.
- **phrase** (věty): když zní jiná věta, počká ve frontě (max. 2).
- **urgent** (odpočet, „hraj“, pauza): přeruší vše.

## Efekty a hudba
`assets/audio/sfx/<klíč>.mp3`: `click`, `focus`, `tick`, `success`, `levelup`, `confetti`.
`assets/audio/music/bg_main.mp3` (smyčka, klidná).
