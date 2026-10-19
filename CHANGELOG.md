# Changelog

Minden fontosabb változás ebben a fájlban kerül rögzítésre a [Keep a Changelog](https://keepachangelog.com/hu/1.0.0/) szabvány szerint.
A projekt a [Semantic Versioning (SemVer 2.0.0)](https://semver.org/lang/hu/) verziózási szabályait követi.

## [1.16.0] - 2026-10-19

### Hozzáadva (Added)
- **Nemzetközi Kupák Integrációja (API-Sports & Football-Data.org):**
  - **Bajnokok Ligája (UEFA Champions League, ⭐):** Bekötve az API-Sports (`id: 2`, `ucl`) és Football-Data (`CL`) végpontokon, empirikus kupa gólátlagokkal (hazai: 1.74, vendég: 1.34).
  - **Európa Liga (UEFA Europa League, 🏆):** Bekötve az API-Sports (`id: 3`, `uel`) és Football-Data (`EL`) forrásokon, sajátos gólátlagokkal (hazai: 1.66, vendég: 1.30).
  - **Konferencia Liga (UEFA Conference League, 🟢):** Bekötve az API-Sports (`id: 848`, `uecl`) és Football-Data (`EC`) forrásokon (hazai: 1.62, vendég: 1.26).
- **Kupameccs Statisztika & Dixon-Coles Modellezés:**
  - A nemzetközi kupák magasabb tempójához és intenzívebb gólvárakozásához optimalizált paraméterek, amelyek automatikusan illeszkednek a bivariáns Dixon-Coles és Poisson mátrix kalkulációkba.
- **Kupaszűrés & Prioritás a Meccslistában (`src/components/StatsGrid.tsx`):**
  - Kiemelt prioritás a ligasávban (Bajnokok Ligája: 5, Európa Liga: 6, Konferencia Liga: 7).
  - Kettős alias feloldás (`ucl`/`cl`, `uel`/`el`, `uecl`/`ec`), így bármely forrásból származik a kupameccs, a ligagomb egységesen szűri.
- **Frissített Beállítások Dialógus (`src/components/SettingsModal.tsx`):**
  - Kiemelt kupajelvények (⭐ Bajnokok Ligája, 🏆 Európa Liga, 🟢 Konferencia Liga) és egyértelmű tájékoztató szöveg.
- **7 Új Automatizált Vitest Egységteszt (`cupCompetitions.test.ts`):**
  - A teljes tesztcsomag **55/55 sikeres tesztre** bővült, 0 hiba és 0 figyelmeztetés az Oxlint ellenőrzésen.

## [1.15.0] - 2026-10-19

### Hozzáadva (Added)
- **Pulzáló Élő Meccs Kapszula a Fejlécben (`src/components/Header.tsx`):**
  - Élénk piros, animált pulzáló (`animate-ping`) élő meccs számláló kapszula a fejléc jobb felső műveleti sávjában.
  - Közvetlen kattintásra automatikusan átvált a meccslistára és bekapcsolja az élő szűrőt.
  - Ha nincs folyamatban lévő meccs, diszkrét mentesített jelzőként funkcionál.
- **Élő Mérkőzések Gyorsszűrő Kapcsoló (`src/components/StatsGrid.tsx`):**
  - Dedikált „Csak Élő” gomb a vezérlősávban valós idejű mérkőzésszámlálóval és pulzáló jelvénnyel.
  - Globális eseményvezérlés (`focitipp_filter_live`): Fejlécből történő kattintásra azonnal megnyitja és beállítja az élő találkozók listáját.
  - Intelligens üres állapot kezelés gyorsgombbal a szűrő visszakapcsolására.
- **Valós Idejű Élő Eredmény & Perc Jelzések a Felületen:**
  - Játékperc (`minute'`), hazai és vendég gólok és lezárási állapot azonnali renderelése.

## [1.14.0] - 2026-10-19

### Hozzáadva (Added)
- **Kvantitatív Értékkereső & Piacvizsgáló (`src/components/ScannerView.tsx`):**
  - Teljes körű piacvizsgáló modul a teljes meccskínálatból kinyert fogadási lehetőségek automatikus rangsorolásával.
  - 8 db intelligens preset kapszula: 💎 +EV Értéktippek, 🎯 Kiemelt MI Tippek, ⚽ Over 2.5 Gólradar, 🥅 Mindkét Csapat Lő (BTTS), 🛡️ Erős Favoritok, ⚡ 1. Félidő >0.5 Gól, 💣 Értékes Meglepetések és Összes lehetőség.
  - Dinamikus szűrő- és rendezősáv: Valós idejű kereső csapatra és ligára, bajnokságválasztó, minimum modell-esély küszöbök (50%+, 60%+, 70%+) és 5-irányú rendezés (+EV %, Valószínűség, Szorzó, Negyed-Kelly méret, Kezdési idő).
  - Találati kártyák valós Pinnacle/Bet365 vagy szimulált bukmékeri oddsokkal, várható éllel (+EV %), Negyed-Kelly tőkeallokációval és közvetlen szelvényre tevéssel.
- **Bajnokság Statisztikai & Értékradar Nézet:**
  - Kvantitatív liga-ranglista átlagos várható gólok (xG), Over 2.5 gyakoriság, BTTS arány és top gólvárakozású mérkőzés szerint rendezve.
- **Navigáció Bővítése (`src/components/Header.tsx`, `src/App.tsx`):**
  - Új `scanner` tab bekötve mind az asztali navigációs sávba, mind a mobil 6-oszlopos kompakt gombsorba.
  - Dinamikus `React.lazy` és `Suspense` kód-felosztás a minimális bundle méret megőrzése érdekében.
- **Dedikált Scanner Szolgáltatás & 3 Új Egységteszt (`scannerService.ts`, `scannerService.test.ts`):**
  - Összesen 48 db sikeres Vitest egységteszt, 100%-os típusbiztonság és 0 Oxlint hiba/figyelmeztetés.

## [1.13.0] - 2026-10-19

### Hozzáadva (Added)
- **ScoreLab Csapat-összehasonlító Kártya (`src/components/ScoreLabH2HCard.tsx`):**
  - Forma- és momentum-index: Az utolsó 5 mérkőzés pontozása (W=3p, D=1p, L=0p, max 15p) és arányos vizualizációja.
  - Kétoldalas dinamikus összehasonlító sávok: Várható gólok ($xG$), támadási hatékonyság ($\alpha$), védelmi stabilitás ($\beta$, alacsonyabb a kedvezőbb) és lőtt/kapott gólátlagok.
  - Felső intelligens modell-összegző panel a legfőbb meccsdinamikai és előny-tényezőkkel.
- **Részletes Egymás Elleni Történet (Head-to-Head):**
  - Rögzített H2H találkozók esetén: Győzelmi mérleg (Hazai, Döntetlen, Vendég), átlagos H2H gólszám, mindkét csapat szerez gólt (BTTS) arány és a korábbi összecsapások eredményei kártyákon.
  - Új vagy közvetlen múlt nélküli párosításoknál: Intelligens szimulált összecsapási elemzés a csapatok szezonbeli Dixon-Coles MLE paraméterei és aktuális formája alapján.
- **Bivariáns Dixon-Coles Poisson Gólmátrix (`src/components/ScoreLabPoissonMatrix.tsx`):**
  - Interaktív 5x5-ös pontos végeredmény valószínűségi hőtérkép cellánkénti esélyekkel és fair szorzókkal ($1/p$).
  - Top 6 legvalószínűbb pontos végeredmény rangsor (pl. 🥇 1-1, 🥈 2-1, 🥉 1-0) kimeneteli színkódolással (1, X, 2).
  - Gólszám-intervallum sávok (0-1 gól, 2-3 gól, 4+ gól) és 1X2 mátrix zónák összesítése.
- **3-utas Fülválasztó a Meccs Részletekben (`src/components/MatchDetailModal.tsx`):**
  - `[📊 Áttekintés & Oddsok]`, `[⚔️ H2H & Csapatok]`, `[🎯 Poisson Mátrix]` fülek az áttekinthető, modern navigációért.
- **ScoreLab Szolgáltatás & 7 Új Egységteszt (`scoreLabService.ts`, `scoreLabService.test.ts`):**
  - Összesen 45 db sikeres Vitest egységteszt, 100%-os matematikai stabilitás és 0 Oxlint hiba/figyelmeztetés.

## [1.12.0] - 2026-10-19

### Hozzáadva (Added)
- **Nemzetközi Bajnokságok Bővítése (Football-Data & API-Sports):**
  - Portugál Primeira Liga (`PPL` / `94`)
  - Belga Jupiler Pro League (`144`)
  - Török Süper Lig (`203`)
  - Osztrák Tipico Bundesliga (`218`)
  - Svájci Credit Suisse Super League (`207`)
  - Skót Premiership (`179`)
  - Lengyel PKO BP Ekstraklasa (`106`)
  - Görög Super League 1 (`197`)
  - Amerikai Major League Soccer / MLS (`253`)
- **Intelligens Kereszt-API Mérkőzés Deduplikáció (`src/App.tsx`):** Normalizált csapatnév- és dátum-összevetés révén kiszűri a duplikált mérkőzéseket, ha mindkét API szolgáltatná ugyanazt a találkozót (pl. Primeira Liga).
- **Valós Történelmi Gólátlagok & Dixon-Coles Bajnokság-modellek (`src/services/apiSportsClient.ts`):** Minden új ligához dedikált hazai és vendég gólátlagok, biztosítva a pontos Poisson eloszlásokat és Kelly-méretezést.
- **Dinamikus Ligarendezés és Alias Támogatás (`src/components/StatsGrid.tsx`):** Az új ligák azonnal szűrhetők, saját prioritással és országzászlókkal jelennek meg a ligasávban.
- **Frissített Beállítások Szövegezés (`src/components/SettingsModal.tsx`):** Egyértelműen tájékoztat a bővített európai élvonalbeli bajnokságokról és másodosztályokról.

## [1.11.0] - 2026-10-18

### Hozzáadva (Added)
- **Automatizált Vitest Egységteszt Csomag (`src/services/__tests__/`):** 38 db egységteszt lefedettség a matematikai és elszámolási motorra (`betEvaluation.test.ts`: 19 teszt, `predictionEngine.test.ts`: 14 teszt, `bankrollService.test.ts`: 5 teszt). A tesztfuttatás beépítésre került a GitHub Actions CI munkafolyamatba (`npm test`).
- **Dedikált Matematikai Szelvénykiértékelő Modul (`src/services/betEvaluation.ts`):** Új, tiszta függvényekből álló motor a fogadási piacok szigorú kiértékelésére, félidős és végeredmény támogatással.
- **Kódfelosztás és Lazy Loading (`src/App.tsx`):** A másodlagos nézetek (`BankrollView`, `ResultsView`, `MethodologyView`) és a nehéz modális ablakok (`MatchDetailModal`, `SettingsModal`, `AboutModal`) dinamikus `React.lazy` és `Suspense` betöltést kaptak, csökkentve a fő JS csomag méretét 384 KB-ra (109 KB gzip).
- **Szelvényépítő Korreláció-figyelmeztetés (`src/components/BetSlipDrawer.tsx`):** Azonos mérkőzésből származó piacok (pl. BTTS + Over 2.5) észlelése esetén automatikus figyelmeztetés jelenik meg, jelezve a szorzott esély torzítását.
- **LocalStorage Kvótavédelem és Cache Purgálás (`historyService.ts`, `apiSportsClient.ts`):** 150 meccses plafon az archívumnak és `QuotaExceededError` elkapás, valamint naponta lefutó elavult API-Sports cache takarítás az 5 MB böngészőkvóta megvédésére.

### Javítva (Fixed)
- **Szelvénykiértékelés String-Matching Hibájának Megszüntetése:** A `evaluatePickWon` korábban magyar csapatneveket tartalmazó címkéknél (pl. `Arsenal (1)`) hibásan az alapértelmezett `totalGoals > 2.5`-re esett vissza. Az új motor egzakt piac-kódok (`PickMarket`) és végződések (`(1)`, `(2)`, `(x)`) alapján értékel, ismeretlen piacnál pedig sosem könyvel tévesen, hanem `null`-t ad.
- **Félidős Piac (`FH_OVER_05`) Helyes Kiértékelése:** A félidős piacok a korábbi teljes meccs helyett mostantól kizárólag a félidős gólok (`homeHalfTimeScore`, `awayHalfTimeScore`) alapján záródnak le; hiányzó félidős adatnál nem történik téves kiértékelés a 2. félidős gólokból.
- **Erős Szignál Küszöb Bekötése (`SettingsModal.tsx`, `StatsGrid.tsx`):** A beállításokban megadott `focitipp_threshold` (alapértelmezett: 65%) mostantól közvetlenül érvényesül a mérkőzésrács „Csak Kiemelt Jelek” szűrőjében és dinamikus gombfeliratában.
- **Felesleges / Halott Fájlok Eltávolítása:** `src/App.css`, `src/assets/react.svg`, `vite.svg` és `src/assets/hero.png` törölve a repóból.
- **Prop-higiénia:** `Header.tsx` mostantól megjeleníti az `isLiveApi` státuszt, a `StatsGrid.tsx` táblázat pedig felhasználja a szelvényelemeket az aktív tétek vizuális kiemelésére.

## [1.10.0] - 2026-10-18

### Hozzáadva (Added)
- **Dupla Dinamikus Statisztika-Választó Sáv (ScoreLab stílus):** Két független lenyíló választó a vezérlősávban (`1.` és `2.` számozott kapszulák), amivel a felhasználó szabadon kiválaszthatja, melyik 2 kvantitatív mutató jelenjen meg a meccssorokon.
- **ScoreLab Kompakt Meccslista Nézet:** Horizontális meccssoros felület két folyamatjelző pill-lel és közvetlen szelvényre tevéssel.
- **Kedvenc Mérkőzések (My Matches):** Mérkőzések csillagozása és kiemelése a lista tetejére aranyszínű blokkban.
- **Háromirányú Nézetváltó:** Kompakt lista, Kártyák és 11 oszlopos Részletes Táblázat nézet szabadon választható és perzisztens módon mentve.

## [1.9.1] - 2026-10-18

### Javítva & Biztonság (Fixed & Security)
- **React Rules of Hooks Szabálysértés Megszüntetése (`MatchDetailModal.tsx`):** A korábban a feltételes korai visszatérés (`if (!match) return null;`) után elhelyezett hook-hívások (`useState`, `useEffect`) feltétel nélkül, a komponens legtetejére kerültek. Ezzel megszűnt a renderek közötti dinamikus hook-szám váltakozás (0 ↔ 4) és a modális ablak megnyitásakor/bezárásakor fellépő összeomlásveszély.
- **Valódi Szigorú TypeScript Mód Bekapcsolása (`tsconfig.app.json`, `tsconfig.node.json`):** A korábban csak névleges szigorúságot jelentő konfiguráció helyett aktiválásra került a `"strict": true`, `"noImplicitAny": true` és `"strictNullChecks": true` a teljes projektben. A teljes forráskód 0 hibával és 0 figyelmeztetéssel felel meg a szigorú típusbiztonsági követelményeknek.
- **CI Titokszivárgás Megszüntetése és SHA-256 Hash Alapú Titokkeresés (`.github/workflows/ci.yml`):** A CI munkafolyamatból eltávolításra kerültek a korábban keresési mintaként plaintextben beírt API-kulcsok. Helyüket általános, regex alapú auth-fejléc/kulcs formátum-ellenőrzés és SHA-256 ujjlenyomatos hash-vizsgálat vette át, így a CI fájl önmaga többé nem tartalmaz és nem szivárogtat titkokat.

## [1.9.0] - 2026-10-18

### Hozzáadva (Added)
- **Valódi Dixon–Coles (1997) MLE Paraméter-illesztő Motor (`dixonColesFitting.ts`):** A korábbi kézzel beírt 17 csapatos `TEAM_POWER` tábla és a lapos másodosztályú konstansok teljes törlése. A rendszer a szezonban már lejátszott mérkőzésekből, iteratív arányos illesztéssel (Iterative Proportional Fitting Poisson MLE) és exponenciális időbeli súlyozással ($\xi = 0.0025$) számítja ki minden csapat valós támadóerejét ($\alpha_i$), védelmi gyengeségét ($\beta_i$), a hazai pálya előnyt ($\gamma$) és a $\rho$ korrekciót.
- **Dinamikus Bajnokság-szintű Modell Gyorsítótár (`dixonColesFitting.ts`, `api/matches.ts`):** 24 órás Edge- és kliensoldali gyorsítótár a szezonális mérkőzésadatokra, ami minimális kvótafogyasztás mellett biztosít valós idejű, egzakt statisztikai modellt.
- **Dixon–Coles Paraméter-kijelző Panel (`MatchDetailModal.tsx`):** A mérkőzés részleteiben megjelenik mindkét csapat egzakt illesztett $\alpha$ (támadás) és $\beta$ (védelem) mutatója, a $\gamma$ hazai előny, a $\rho$ érték és az illesztéshez felhasznált befejezett meccsek száma.
- **Lejátszási Dátum és Időpont Kijelzése Lezárt Meccseknél (`ResultsView.tsx`, `StatsGrid.tsx`, `MatchDetailModal.tsx`):** A lezárult mérkőzéseken mostantól minden felületen (Eredmények archívuma, Mérkőzésrács táblázat- és kártyanézet, Részletes modális ablak) közvetlenül látható a meccs naptári napja (`kickoffDate`) és kezdési időpontja (`kickoffTime`).
- **Színátmenetes Hátterek & Enyhe Rácsos Háló (`index.css`, minden komponens):** Az alkalmazás minden háttere (főoldal, fejléc, lábléc, statisztikai KPI sáv, mérkőzéskártyák, táblázatok, eredmény- és bankroll-kártyák, modális ablakok és fiókok) modern, gazdag sötét színátmenetet (`linear-gradient`) és enyhe, elegáns rácsos háló réteget (`bg-mesh-*`) kapott finom környezeti smaragd és borostyán fényekkel.

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
