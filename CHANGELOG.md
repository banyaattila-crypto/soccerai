# Changelog

Minden fontosabb változás ebben a fájlban kerül rögzítésre a [Keep a Changelog](https://keepachangelog.com/hu/1.0.0/) szabvány szerint.
A projekt a [Semantic Versioning (SemVer 2.0.0)](https://semver.org/lang/hu/) verziózási szabályait követi.

## [1.0.0] - 2026-10-17

### Hozzáadva (Added)
- **Élő Football-Data.org API integráció:** Valós napi mérkőzések lekérése és Vercel Serverless proxy (`/api/matches`) Edge cache-sel.
- **Kvantitatív Elemző Motor:** Dixon–Coles (1997) korrigált bivariáns Poisson mátrix ($\rho = -0.13$), Shin (1992) bukmékeri de-vigging, $\lambda$-rács robusztussági szűrő és $\lambda$-inverzió gólpiac-validáció.
- **Negyed-Kelly (Quarter-Kelly) tétméretezés:** Konzervatív bankroll-menedzsment ajánlások.
- **Statisztikai Esély Rács (Stats Grid):** 8 piacra kiterjedő valószínűségi hőtérkép és fókuszpiac választó (`[I]`, `[A]`, `[B]`, `[G]`, `[D]`, `[C]`).
- **Napi Top AI Tippek (Top Picks):** Szigorú robusztussági szűrőn átment, legmagasabb várható értékű (+EV) ajánlások.
- **Interaktív Szelvényépítő & Eredménykövető:** Kumulált szorzók és forintosított kifizetési kalkuláció.
- **Egyedi 3D Vektoros Focilabda Logó (`Logo.tsx`):** Fémes arany peremmel és AI orbitális ívekkel ellátott prémium embléma.
- **Alkalmazáson belüli Verziójelző & Névjegy Modál (`AboutModal.tsx`):** Kattintható verziószám a fejlécben és láblécben, részletes kiadási információkkal és release notes-szal.
- **10 perces intelligens háttérfrissítés:** Automatikus mérkőzésfrissítés kizárólag aktív böngészőfül esetén.

### Javítva (Fixed)
- **Mobilos menüsor elrendezés:** A fejléc többé nem lóg ki kis kijelzőkön; a fő navigációs fülek külön szegmentált alsó sávba kerültek.
- **Mobilos vízszintes elmozdulás megszüntetése:** Globális `touch-action: pan-y; overflow-x: hidden;` és táblázat-szintű `touch-pan-x` + overscroll izoláció.
- **Bajnokság-szűrés és csoportosítás:** A Football-Data.org versenykódjainak (`PD`, `SA`, `BL1`, `ELC`, `FL1`, `DED`, `BSA`) kanonikus leképezése, így mind a 39 mérkőzés elérhető és szűrhető.

### Módosítva (Changed)
- `package.json` verziószám frissítve `0.0.0` -> `1.0.0`, és projekt név beállítva `soccerai`-ra.
- Teljes független arculat kialakítása, harmadik félre utaló hivatkozások törlése.
