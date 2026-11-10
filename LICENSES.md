# Zdroje a licence

Aplikace Fotbal – Tréninková podložka je bezplatný nekomerční projekt, jejímž autorem je Jakub Uhlíř. Přehled zdrojů je i přímo v aplikaci: Rodiče → Data a zabezpečení → O aplikaci a licence.

| Co | Odkud | Licence / poznámka |
| --- | --- | --- |
| Fotky hráčů na kartách (`assets/img/cards`) | Wikimedia Commons | CC BY, CC BY-SA, public domain. Autor a licence každé fotky jsou v `src/content/cards.json` (pole `author`, `license`, `source`) a vypisují se v aplikaci. Při dalším šíření je nutné autory uvádět a u CC BY-SA ponechat stejnou licenci pro upravené fotky. |
| Popisy hráčů (`src/content/bios.json`) | Česká Wikipedie | CC BY-SA 4.0, zdroj se uvádí u textu v aplikaci |
| Zajímavosti na rubu karet (`src/content/facts.json`) | Vlastní | ručně psané |
| Loga klubů a reprezentací (`assets/img/teams`) | Oficiální weby klubů, TheSportsDB | ochranné známky svých vlastníků, použito jen k označení týmu; aplikace není se subjekty spojená. Při veřejném šíření zvážit jejich odstranění nebo nahrazení neutrálními znaky. |
| Hlas Trenér (`assets/audio/voice`) | Microsoft Edge TTS (neuronový hlas cs-CZ-Antonin) | předgenerované věty; před veřejným šířením ověřit podmínky služby |
| Zvuky (`assets/audio/sfx`) | Vlastní syntéza (`scripts/make-sounds.mjs`) | – |
| Písmo Inter | @fontsource/inter | SIL Open Font License 1.1 |
| Ikony | Lucide (lucide.dev) | ISC |
| Software | Vite, Tailwind CSS, Capacitor | MIT |
| Podložky | Vlastní vektorové kresby podle fotek produktů | jde o napodobení vzhledu, ne o kopii grafiky výrobců; názvy výrobců se v aplikaci nepoužívají jako značka |

## Před zveřejněním (např. Google Play)
- Jména a fotky žijících hráčů: osobnostní práva se licencí fotky neřeší. Pro širší šíření je bezpečnější použít jen ilustrace bez jmen nebo získat souhlas.
- Loga klubů a názvy týmů: viz výše.
- Hlas: ověřit, že použití syntetizovaného hlasu v distribuované aplikaci odpovídá podmínkám poskytovatele.
