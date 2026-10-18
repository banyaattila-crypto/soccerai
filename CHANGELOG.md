# Changelog

Minden fontosabb változás ebben a fájlban kerül rögzítésre a [Keep a Changelog](https://keepachangelog.com/hu/1.0.0/) szabvány szerint.
A projekt a [Semantic Versioning (SemVer 2.0.0)](https://semver.org/lang/hu/) verziózási szabályait követi.

## [1.9.0] - 2026-10-18

### Hozzáadva (Added)
- **Valódi Dixon–Coles (1997) MLE Paraméter-illesztő Motor (`dixonColesFitting.ts`):** A korábbi kézzel beírt 17 csapatos `TEAM_POWER` tábla és a lapos másodosztályú konstansok teljes törlése. A rendszer a szezonban már lejátszott mérkőzésekből, iteratív arányos illesztéssel (Iterative Proportional Fitting Poisson MLE) és exponenciális időbeli súlyozással ($\xi = 0.0025$) számítja ki minden csapat valós támadóerejét ($\alpha_i$), védelmi gyengeségét ($\beta_i$), a hazai pálya előnyt ($\gamma$) és a $\rho$ korrekciót.
- **Dinamikus Bajnokság-szintű Modell Gyorsítótár (`dixonColesFitting.ts`, `api/matches.ts`):** 24 órás Edge- és kliensoldali gyorsítótár a szezonális mérkőzésadatokra, ami minimális kvótafogyasztás mellett biztosít valós idejű, egzakt statisztikai modellt.
- **Dixon–Coles Paraméter-kijelző Panel (`MatchDetailModal.tsx`):** A mérkőzés részleteiben megjelenik mindkét csapat egzakt illesztett $\alpha$ (támadás) és $\beta$ (védelem) mutatója, a $\gamma$ hazai előny, a $\rho$ érték és az illesztéshez felhasznált befejezett meccsek száma.
- **Lejátszási Dátum és Időpont Kijelzése Lezárt Meccseknél (`ResultsView.tsx`, `StatsGrid.tsx`, `MatchDetailModal.tsx`):** A lezárult mérkőzéseken mostantól minden felületen (Eredmények archívuma, Mérkőzésrács táblázat- és kártyanézet, Részletes modális ablak) közvetlenül látható a meccs naptári napja (`kickoffDate`) és kezdési időpontja (`kickoffTime`).

### Javítva & Integritás (Fixed & Integrity)
- **First-run Dishonesty Felszámolása a Tétnaplóban (`bankrollService.ts`):** Az új felhasználók többé nem kapnak automatikusan generált, nem létező nyertes szelvényeket (+5 280 Ft, +3 400 Ft). A tétnapló 100%-ig tiszta, üres kezdőállapottal indul.
- **Kitalált Sikerráta Törlése (`HeroKpi.tsx`, `App.tsx`):** A beégetett „Tegnap: 83% találat” felirat törölve. A rendszer kizárólag akkor ír ki sikerrátát, ha ténylegesen léteznek tegnapi lezárt meccsek az archívumban, amit valós eredményekből számol. Ellenkező esetben transzparens modell-státuszt mutat.
- **Önbeteljesítő Körkörös „+EV” Felszámolása (`TopPicks.tsx`):** Szimulált bukmékeri oddsoknál tilos piaci értéktöbbletet hazudni. A felület transzparensen a fair szorzót mutatja, és csak valós külső odds jelenlétekor számol piaci előnyt.

## [1.8.0] - 2026-10-18

### Hozzáadva (Added)
- **3D Interaktív Forgó Labda (`ThreeDBall.tsx`):** Valódi 3D szférikus focilabda komponens orbitális tech részecskegyűrűkkel (`preserve-3d`), kattintás- és hover-érzékeny gyorspörgés-effektussal a fejlécben és a Hero sávban.
- **3D Kártya Döntési Hatás (3D Tilt Effect, `TopPicks.tsx`):** A Nap Top 3 kiemelt kártyája dinamikus, egérmozgásra lágyan billenő 3D perspektívát és rétegzett mélységet (`translateZ`) kapott.
- **Tartós Múltbeli Eredmény Archívum (`historyService.ts`, `ResultsView.tsx`):** A lezárt mérkőzések a helyi tárhelyen (`localStorage`) folyamatosan felhalmozódnak és megőrződnek; új időszaki szűrőkkel (Összes archivált, Ma, Tegnap, 7 nap) és archívum-statisztikával.
- **Tartós Fogadási Szelvény Tárolás (Draft Persistence, `App.tsx`):** Az összeállított szelvénytervezet a böngésző tárhelyén korlátlan ideig megmarad oldalfrissítés vagy PWA újraindítás után is.

### Javítva & Módosítva (Fixed & Changed)
- **Színvilág Finomítása (Túl Sok Sárga Eltávolítása):** A korábbi harsány neonsárga gombok, keretek és aktív tabok helyett modern, professzionális smaragdzöld (`emerald-600`) akciógombok, elegáns sötét pala és zafír navigáció került bevezetésre.
- **Szigorú Top Pick Szűrés (`TopPicks.tsx`):** A λ-rácson instabilnak minősülő `ELVETVE` ítéletű tippek kizárásra kerültek a kiemelt ajánlások közül; a Top 3-ba kizárólag sziklaszilárd `ROBUSZTUS` vagy `valószínű` kimenetelek kerülhetnek.
- **Gördíthető Beállítások Modal & Dedikált Vissza Gombok (`SettingsModal.tsx`):** A beállítások ablak `max-h-[90vh]` korlátozást és görgethető tartalmat kapott, valamint jól látható „← Vissza” navigációs gombok kerültek a fejlécbe és a láblécbe.
- **Teljes Szélességű Bajnokság Választó & Görgető Nyilak (`StatsGrid.tsx`):** A liga választó sáv teljes szélességű lett, bal/jobb görgetőgombokkal és „Összes liga kibontása” több soros váltóval, így a LaLiga után lévő ligák sem vágódnak le többé.

## [1.7.0] - 2026-10-18

### Biztonság (Security - 1. szakasz)
- **API Kulcsok Eltávolítása a Kódból és Bundle-ből (`vite.config.ts`, `SettingsModal.tsx`, `App.tsx`, `footballDataApi.ts`, `apiSportsClient.ts`):** Minden beégetett API-kulcs és részleges kulcsrészlet törölve a verziózott forrásfájlokból. A kulcsok kizárólag a `.gitignore`-olt `.env.local` fájlból és a Vercel környezeti változókból töltődnek be (`.env.example` sablonnal).
- **Vercel Serverless Proxyk Lezárása (`api/matches.ts`, `api/apisports.ts`):**
  - `Access-Control-Allow-Origin: *` helyett szigorú origin-ellenőrzés (`403 Forbidden` idegen domainről).
  - Bemeneti paraméterek (`dateFrom`, `dateTo`, `date`: `YYYY-MM-DD`, `fixture`: pozitív egész szám) szigorú formátum-validációja (`400 Bad Request`).
  - Tartalék (fallback) API kulcsok törlése (`503` hiányzó szerveroldali kulcs esetén) és IP-alapú rate limiting (`429 Too Many Requests`).

### Javítva & Módosítva (Fixed & Changed - 1. és 2. szakasz)
- **Őszinte Feliratok & Demó Adat Sáv (`App.tsx`, `ResultsView.tsx`, `TopPicks.tsx`, `MatchDetailModal.tsx`):** A „Verifikált Modell Teljesítmény” és szimulált „+EV” feliratok helyett „Szimulált Modell Teljesítmény & Becsült ROI Archívum”, illetve „Becsült Odds / Fair szorzó” szerepel. Tartalék (mock) adatok használatakor jól látható borostyánsárga **„Demó adat (szimulált mód)”** figyelmeztető sáv jelenik meg.
- **Piacfüggő Robusztussági Teszt (`predictionEngine.ts`):** A `robustnessGridTest` mostantól megkapja a konkrét célpiacot (`1`, `X`, `2`, `OVER_25`, `UNDER_25`, `BTTS_YES`, `BTTS_AND_OVER_25`), és a $\lambda$-rácson annak valószínűségét értékeli ki. Minden kézzel beégetett `'ROBUSZTUS'` / `'valószínű'` címke és a másodosztályú `charCodeAt(0)` heurisztika törölve; egységes `buildMatchQuantAndPick` függvény szolgálja ki mindkét API klienst.
- **Egzakt Közös Valószínűség a Dixon–Coles Mátrixból (`predictionEngine.ts`):** A `BTTS és Over 2.5` együttes esélye (`bttsAndOver25`) közvetlenül a $11 \times 11$-es bivariáns Poisson gólmátrixból számolódik ($i > 0 \land j > 0 \land i+j > 2.5$), kiváltva a korábbi `(a * b) / 80` heurisztikát és megszüntetve a duplán számolt $\times 1.15$-ös hazai előnyt.
- **Egységes Dátum- és Időzóna-kezelés (`src/utils/dateUtils.ts`, `StatsGrid.tsx`, `footballDataApi.ts`):** Közös helyi időzóna-alapú dátumformázó; a „Ma” fül többé nem mutat más napi meccseket üres találat esetén; a Football-Data API hívás explicit 3 napos (`dateFrom=tegnap`, `dateTo=holnap`) ablakot kér le.
- **Network-First Service Worker & Verziófrissítési Jelzés (`public/sw.js`, `main.tsx`, `App.tsx`):** A navigációs kérések (`index.html`) Network-First stratégiát használnak, új Service Worker verzió elérhetőségekor pedig interaktív **„Új alkalmazásverzió érhető el – Frissítés most”** sáv jelenik meg.
- **Reprodukálható Lockfile & GitHub Actions CI (`package-lock.json`, `.github/workflows/ci.yml`):** Verziózott `package-lock.json` és automatizált CI pipeline (`npm ci`, `tsc -b`, `oxlint --deny-warnings`, `vite build`, valamint kulcsszivárgás-ellenőrzés).

## [1.6.0] - 2026-10-17

### Hozzáadva (Added)
- **Saját Bankroll Követő & Tétnapló (Bet Tracker, `BankrollView.tsx`):** Teljes értékű tőkemenedzsment és fogadáskövető modul dinamikus egyenlegszámítással, testreszabható kezdőtőkével és valós idejű nettó profit kalkulációval (+/- Ft).
- **Személyes ROI % & Statisztikai KPI Rács:** Realizált megtérülés (ROI %), találati arány (Strike Rate %), függőben lévő lekötött tőke, valamint átlagos odds és tétösszeg követése.
- **Közvetlen Szelvény Rögzítés a Szelvényépítőből (`BetSlipDrawer.tsx`):** Egykattintásos elmentés a tétnaplóba, beépített Negyed-Kelly kitettség ellenőrzéssel (>10% bankroll arány esetén intelligens kockázati figyelmeztetés) és opcionális jegyzeteléssel.
- **Automatikus Szelvény Kiértékelés (Auto-Evaluate):** A mérkőzés adatbázisban található befejezett találkozók tényleges végeredményei alapján a függőben lévő szelvények egykattintásos automatikus kiértékelése és egyenleghez írása, intelligens korai veszteség-felismeréssel.
- **Kézi Tét Rögzítés & Tetszőleges Esélyfelvitel:** Kézi felviteli modal egyedi, külső vagy offline mérkőzések és speciális oddsok naplózásához.
- **Teljes Adatmentés & Biztonság (`bankrollService.ts`):** Tétnapló exportálása és importálása JSON formátumban, egykattintásos mintaadat-visszaállítás és kezdőtőke módosítás.
- **5-oszlopos Navigáció & Élő Bankroll Chip (`Header.tsx`):** Élő egyenleg-kijelző chip a felső fejlécben és optimalizált 5-elemes mobil tab-váltó (`Top`, `Rács`, `Eredmény`, `Bankroll`, `Módszer`).

## [1.5.0] - 2026-10-17

### Hozzáadva (Added)
- **Progresszív Webalkalmazás (PWA) Támogatás (`manifest.json`):** Mobilra és asztali böngészőbe közvetlenül telepíthető natív standalone alkalmazásként böngészősáv nélkül.
- **Intelligens Service Worker (`sw.js`):** Kettős gyorsítótárazási stratégia (Cache-First a statikus eszközökre, Network-First az API hívásokra) intelligens offline tartalék üzemmóddal.
- **Alkalmazáson belüli Telepítés Rendszer (`Header.tsx`):** Egy kattintásos közvetlen telepítés indító gomb az automatikus `beforeinstallprompt` esemény alapján, valamint Standalone PWA állapotjelző jelvény.
- **Nagyfelbontású PWA Ikoncsomag (`public/icons/`):** 192x192 és 512x512 méretű PNG ikonok, Apple Touch Icon és frissített 3D SoccerAI SVG logó.

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
