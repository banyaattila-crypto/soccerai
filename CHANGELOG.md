# Changelog

Minden fontosabb változás ebben a fájlban kerül rögzítésre a [Keep a Changelog](https://keepachangelog.com/hu/1.0.0/) szabvány szerint.
A projekt a [Semantic Versioning (SemVer 2.0.0)](https://semver.org/lang/hu/) verziózási szabályait követi.

## [1.4.0] - 2026-10-17

### Hozzáadva (Added)
- **Piac-specifikus Szűrés & Elemzés (`ResultsView.tsx`):** Külön szűrhető és elemezhető piaci kategóriák (BTTS, Over 2.5, Kombinált, 1X2, Under 2.5) az Eredmények nézetben.
- **Interaktív Piaci Teljesítmény Sáv:** 5 db kattintható mini-KPI kártya piacok szerinti eseményszámmal, nyerési aránnyal és virtuális ROI%-kal.
- **Virtuális ROI & Profit Szimulátor:** 10 000 Ft-os bázistéttel számított tiszta nyereség (+Ft), tőkearányos megtérülés (ROI %) és átlagos nyertes szorzó.
- **Többszintű Szűrőrendszer:** Státusz szerinti gyorsválasztó (Mind, Nyert, Vesztes), bajnokság választó és kártyánkénti nettó hozam kijelzés.
- **Bővített Archívum (`mockMatches.ts`):** Valósághű befejezett meccsek a Premier League, La Liga, Serie A, Ligue 1, Bundesliga és NB I ligákból.

## [1.3.0] - 2026-10-17

### Hozzáadva (Added)
- **Élő Bukmékeri Odds Integráció (`apiSportsClient.ts`, `api/apisports.ts`):** Valós piaci szorzók lekérése az API-Sports `/odds` végponton keresztül Pinnacle, Bet365, William Hill, BetVictor és Marathonbet irodáktól 1X2, Over/Under 2.5 és BTTS piacokra.
- **Piaci Élek és Érték (+EV %) Kijelzés (`MatchDetailModal.tsx`):** A meccs részletezőben megjelenő dedikált panel, amely összehasonlítja a kvantitatív Dixon–Coles fair szorzókat a valós bukmékeri oddsokkal, kiszámítja a bukmékeri árrést (vig) és zölddel jelzi a pozitív várható értéket (+EV).
- **Pinnacle vs Bet365 vs Legjobb Piaci Oddsok Fülválasztó:** Egy kattintásos váltás az éles záró árak (Pinnacle), a mainstream piac (Bet365) és az egész piac legjobb szorzói között.
- **60 perces Odds Kvóta-védelem:** Napi 100 API kéréses limit megóvása igény szerinti (on-demand) meccsszintű lekéréssel és helyi gyorsítótárazással.

## [1.2.1] - 2026-10-17

### Hozzáadva (Added)
- **Mobilos Kompakt Kártyanézet (`StatsGrid.tsx`):** Mobilon (<768px) automatikusan reszponzív kártyás elrendezésben (`MatchCardsList`) jelennek meg a mérkőzések a széles táblázat vízszintes görgetésének kiváltására.
- **Nézetváltó gombpár (`Táblázat 📊` / `Kártyák 🃏`):** Bármikor egy kattintással váltható a részletes hőtérkép-táblázat és a reszponzív kártyarács között.

## [1.2.0] - 2026-10-17

### Hozzáadva (Added)
- **API-Sports (API-Football) szolgáltató integráció (`apiSportsClient.ts`):** 5 új bajnokság valós mérkőzésadatai: 🇪🇸 LaLiga 2 (Segunda División), 🇫🇷 Ligue 2, 🇮🇹 Serie B, 🇩🇪 2. Bundesliga és 🇭🇺 NB I (OTP Bank Liga).
- **Vercel Serverless API-Sports Proxy (`api/apisports.ts`):** 30 perces felhő Edge CDN gyorsítótár a napi 100 kéréses ingyenes keret védelmére és a böngészős CORS áthidalására.
- **Beállítások Másodosztály-kezelő (`SettingsModal.tsx`):** API-Sports fiókstátusz kijelzés, kulcskezelés és egygombos ki/bekapcsoló a másodosztályú ligákhoz.
- **Dinamikus ligaszűrő bővítés (`StatsGrid.tsx`):** Az új ligák automatikusan megjelennek a ligaszűrő chipek között prioritás szerint.

## [1.1.1] - 2026-10-17

### Javítva (Fixed)
- **Eredmények kiértékelési hiba (`ResultsView.tsx`):** A befejezett mérkőzések kiértékelése mostantól a tényleges gólok és a piac alapján történik (`evaluatePickWon`). A 2:2-es végeredmény 2.5 felett és BTTS piacon már helyesen zöld / nyertesként jelenik meg a korábbi téves „NEM JÖTT BE” helyett.
- **Dinamikus nyerési arány kalkuláció:** A felső KPI doboz a valós befejezett meccsekből számolja a modellsikerességet a korábbi fix 83.3% helyett.
- **Tippválasztási szűk keresztmetszet megszüntetése (`footballDataApi.ts`):** Az egyoldalú Over 2.5 dominancia helyett intelligens, többpiacos (BTTS, Over 2.5, BTTS & 2.5 felett, Hazai/Vendég győzelem, 2.5 alatt) értékelés került bevezetésre.

## [1.1.0] - 2026-10-17

### Hozzáadva (Added)
- **4 füles kompakt Dashboard navigáció (`Header.tsx`, `App.tsx`):** Különválasztott `🔥 Napi Top Tippek` (alapértelmezett nyitó fül), `📊 Mérkőzés Rács`, `🏆 Eredmények` és új `📐 Módszertan` fülek a hosszú függőleges görgetés megszüntetésére.
- **Módszertan & Hőtérkép Segédlet nézet (`MethodologyView.tsx`):** Dedikált referencia fül a hőtérkép színskála, a fókuszpiacok (`[I]`, `[A]`, `[B]`, `[G]`, `[D]`, `[C]`) és a Dixon–Coles / Shin / $\lambda$-rács / Negyed-Kelly modellek részletes magyarázatával.
- **Összecsukható (Accordion) bajnokság-panelek (`StatsGrid.tsx`):** A *Minden Bajnokság* nézetben a ligák fejlécére kattintva egyenként összecsukhatók és kinyithatók a táblázatok, kiemelt szignál-számlálóval.

### Módosítva (Changed)
- **Kompakt 1 soros Állapotsáv (`HeroKpi.tsx`):** A korábbi ~400px magas nyitó szekciót egyetlen keskeny, információdús állapotsáv és hőtérkép jelmagyarázat váltotta fel.
- **Alapértelmezett Premier League szűrő (`StatsGrid.tsx`):** A Mérkőzés Rács fül alapértelmezés szerint a Premier League mérkőzéseivel nyit (automatikus visszaállással az összes ligára, ha az adott napon nincs PL-mérkőzés).
- **Kompakt Top Tippek nézet (`TopPicks.tsx`):** A Top 3 kiemelt kártya alatt 6 db kompakt kártyán jelennek meg a további erős (60%+) szignálok, a teljes 39 meccses táblázat duplikálása nélkül.

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
