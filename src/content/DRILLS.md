# Cviky – odkud jsou a jak se převádějí na podložku

33 cviků ve 4 úrovních (Začátečník, Pokročilý, Těžké, Expert) v `drills.json`.

## Zdroje
- **Quickplay „Ball Mastery Skills Mat“** (ballmastery.ecoach.training) – oficiální seznam cviků podle úrovní:
  rozcvička (Warm Up Beginner/Advanced), začátečníci (Left/Right Side Push, Dummy Pass, Pass & Drag Left/Right/Both, Drag Back Left/Right),
  pokročilí (Pass Around Right/Left/Both Sides, Drag Combo Left/Right), těžké (Step Over Pass & Drag, The W Drill, Stepover Dummy)
  a kombinace. Videa k nim se v aplikaci nepoužívají, jen názvy a princip, přeložené do českých názvů.
- **Obecné prvky ball mastery** (klepání podrážkou, přitahování míče, obkroužení kolem opěrné nohy, klamání, překračování míče).
- Žádný oficiální seznam k podložce UNITEAM nebyl nalezen (podložka je číselná: míč dole uprostřed jako 1, čísla 2–6 v rozích a nahoře).
  Cviky jsou proto převedeny na zóny této podložky a jde je upravit v `drills.json`.

## Typy cviků
- `ball` (výchozí): míč se přesouvá po zónách ze `pattern` (`foot`: left/right/both).
- `jump`: míč stojí, hráč ho přeskakuje (`sides`: left/right).
- `step`: hráč bez míče došlapuje na čísla ze `pattern`.

## Rychlost
Základní tempo cviku je `tempoBpm`. V nastavení je Tempo „Auto“: nováček má 0,65×, každý level +0,06× až 1,15×. Ruční tempo to přebije.

## Hlášení směrů
Cviky s `"call": "direction"` hlásí místo čísla zóny směr pohybu (Doleva, Doprava, Dopředu, Dozadu, Šikmo vlevo/vpravo, i zpět). Směr se počítá z polohy zón na podložce, hráč stojí dole za míčem (nahoře = dopředu).
