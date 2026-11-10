# Jak si aplikaci nainstalovat

Tréninková podložka funguje třemi způsoby. Vyberte ten nejjednodušší pro vaše zařízení.

| Zařízení | Nejlepší cesta |
|---|---|
| Počítač, tablet, telefon | [A) Otevřít ve webovém prohlížeči](#a-ve-webovém-prohlížeči-nic-se-neinstaluje) |
| Android telefon nebo tablet | [B) Nainstalovat aplikaci (APK)](#b-aplikace-pro-android-apk) |
| Android TV | [C) Android TV](#c-android-tv) |

---

## A) Ve webovém prohlížeči (nic se neinstaluje)

1. Otevřete stránku aplikace: **https://kuba-uhlir.github.io/treninkova-podlozka/**
2. Chcete si to jen vyzkoušet? Otevřete **https://kuba-uhlir.github.io/treninkova-podlozka/?demo**. Vytvoří se hotový ukázkový hráč Honza s trochou postupu a kartami (pokud už v prohlížeči nějací hráči jsou, nic se nezmění).
3. Na telefonu nebo tabletu ji můžete přidat na plochu: v Chrome menu ⋮ → **Přidat na plochu**.
4. Pro celou obrazovku stiskněte **F11** (počítač).

> Zvuk se v prohlížeči spustí až po prvním klepnutí nebo stisku klávesy. To je omezení prohlížečů, ne chyba aplikace.

## B) Aplikace pro Android (APK)

1. Na telefonu otevřete stránku **Releases**: https://github.com/kuba-uhlir/treninkova-podlozka/releases
2. U nejnovější verze stáhněte soubor **`treninkova-podlozka.apk`**.
3. Otevřete stažený soubor. Android zobrazí upozornění, že je instalace z neznámého zdroje blokována. Klepněte na **Nastavení** a povolte **Instalovat z tohoto zdroje** pro prohlížeč nebo správce souborů, který jste použili.
4. Vraťte se zpět a dokončete instalaci. Aplikace se jmenuje **Tréninková podložka**.

> APK není z Google Play, proto Android hlásí upozornění. Aplikace nepotřebuje žádná oprávnění a nic neodesílá.

## C) Android TV

Aplikace je stavěná pro ovládání dálkovým ovladačem. Vyberte jednu z cest:

**C1) Přes aplikaci Downloader (nejjednodušší, bez počítače)**
1. Na TV nainstalujte z Obchodu Play aplikaci **Downloader** (AFTVnews).
2. Povolte jí instalaci aplikací: Nastavení TV → Zabezpečení a omezení → Neznámé zdroje → Downloader.
3. V Downloaderu zadejte adresu APK z vydání (Releases, pravým tlačítkem na soubor → kopírovat adresu odkazu) a potvrďte instalaci.

**C2) Přes USB flash disk**
1. Stáhněte `treninkova-podlozka.apk` v počítači a zkopírujte na flash disk.
2. Na TV nainstalujte správce souborů (např. **File Commander**) a povolte mu neznámé zdroje (viz výše).
3. Otevřete soubor z flash disku a nainstalujte.

**C3) Přes počítač (ADB)**
1. Na TV zapněte Nastavení → O produktu → 7× klepněte na **Sestavení** → Možnosti pro vývojáře → **Ladění USB / ADB**.
2. V počítači: `adb connect IP_ADRESA_TV` a potom `adb install treninkova-podlozka.apk`.

**C4) Bez instalace**
Pokud má TV prohlížeč, otevřete adresu z části A.

---

## První spuštění

1. Po úvodní animaci vyberte **Nový hráč**. Průvodce se zeptá na jméno, číslo dresu, silnější nohu a oblíbený klub.
2. V **Rodiče** (zámek dole) nastavte podložku, tempo, délku tréninku a hlas Trenéra. Při prvním vstupu do Rodičů si vytvoříte vlastní čtyřmístný PIN (později ho změníte v Rodiče → Data a zabezpečení). Když ho zapomenete, obnovíte ho přes „Zapomněl jsem PIN“.
3. Postavte podložku před televizi a začněte **Trénink**. Trenér hlasem říká, kam s míčem.

## Řešení problémů

| Problém | Řešení |
|---|---|
| Nic nezní | V prohlížeči klepněte kamkoli na stránku. V nastavení Rodiče zkontrolujte, že je zapnutý Hlas Trenér a není hlasitost na 0 %. |
| „Instalace blokována“ | Povolte instalaci z neznámých zdrojů pro aplikaci, ze které soubor otevíráte (viz krok B3). |
| Dálkový ovladač nereaguje | Aplikace používá šipky, OK a Zpět. Zkuste kliknout na okno aplikace, aby mělo fokus. |
| Chci začít znovu | Rodiče → Data a zabezpečení → Smazat všechna data. |

Další informace o sestavení vlastní verze najdete v [README](../README.md) a v [ANDROID.md](ANDROID.md).
