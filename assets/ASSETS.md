# Seznam obrázků (pro generování v Gemini)

Formát: PNG/WebP s průhledností (pozadí `bg_stadium` bez). Názvy a rozměry jsou pevné – viz `manifest.json`.
Styl: dětský, ale moderní a čistý; sytě žlutá (#FFD400), tmavě zelená (#0B1F17), trávníková zelená (#2FB35A).
Dokud soubor chybí, appka zobrazí barevný placeholder s popiskem.

| Klíč | Soubor | Rozměr | Účel |
|---|---|---|---|
| `logo` | img/logo.png | 1024×512 | Logo na úvodní obrazovce |
| `bg_stadium` | img/bg_stadium.webp | 1920×1080 | Tmavé stadionové pozadí (rozostřené) |
| `mascot` | img/mascot.png | 800×800 | Maskot (veselý fotbalový míč / zvířátko) |
| `avatar_1` … `avatar_6` | img/avatar_N.png | 512×512 | Vestavěné avatary hráčů (výběr na TV) |
| `icon_star` | img/icon_star.png | 256×256 | XP / hodnocení |
| `icon_ball` | img/icon_ball.png | 256×256 | Značka míče na podložce |
| `icon_foot_l` / `icon_foot_r` | img/icon_foot_*.png | 256×256 | Značka levé / pravé nohy |
| `tv_banner` | android/…/drawable/tv_banner.png | 320×180 | Banner na ploše Android TV |

## Loga týmů
Uložená v `assets/img/teams/<id>.png` (512×512, PNG s průhledností), seznam týmů a barev je v `src/config/teams.json`.
Staženo z veřejné databáze TheSportsDB (testovací klíč). Loga jsou ochranné známky klubů, používají se jen pro soukromou aplikaci. Další tým = přidat PNG a řádek do `teams.json`.
