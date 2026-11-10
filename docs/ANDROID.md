# Sestavení Android / Android TV aplikace

Aplikace je webová (Vite) zabalená do Androidu přes Capacitor. Stejný kód běží i v prohlížeči.

## Postup

```bash
npm install
npm run cap:sync                 # build webu a kopie do android/
cd android
./gradlew assembleDebug          # Windows: .\gradlew.bat assembleDebug
```

APK najdete v `android/app/build/outputs/apk/debug/app-debug.apk`. Do televize se dá nahrát přes ADB (`adb install app-debug.apk`) nebo z USB.

## Windows a diakritika v cestě

Gradle neumí cesty s diakritikou. Pomůže ASCII alias disku:

```bat
subst X: "C:\cesta\k\projektu"
cd X:\android
.\gradlew.bat assembleDebug
```

## Požadavky

- JDK 17 nebo novější
- Android SDK (platforma 34, build tools)
- Node.js 18 nebo novější

## Ovládání na televizi

Aplikace je určená pro D‑pad: šipky mění výběr, OK potvrzuje a tlačítko Zpět se vrací. Při tréninku OK pozastaví a šipka nahoru zopakuje ukázku pomalu.
