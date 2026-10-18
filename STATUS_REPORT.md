# 📊 SOCCERAI PRO &bull; PROJEKT STÁTUSZ JELENTÉS (STATUS REPORT)

**Projekt azonosító:** `soccerai` (SoccerAI PRO)  
**Aktuális verzió:** 🏷️ **`v1.12.0`** (SemVer 2.0.0)  
**Kiadás neve:** *Nemzetközi Bajnokságok Bővítése (Primeira Liga, Süper Lig, Jupiler Pro, MLS & Top Európa) & Kereszt-API Deduplikáció*  
**Dátum:** 2026. október 19.  
**Állapot:** ✅ **v1.12.0 Verzió Elkészült & Verifikálva (38/38 Teszt Sikeres, 0 Hiba, 0 Figyelmeztetés, Szigorú TypeScript)**  
**GitHub Repository:** [https://github.com/banyaattila-crypto/soccerai](https://github.com/banyaattila-crypto/soccerai)  
**Vercel Live URL:** [https://soccerai-pro.vercel.app](https://soccerai-pro.vercel.app)  
**Helyi szerver port:** `http://localhost:3000` (Vite 8 HMR)  
**Projekt elérési útja:** `/home/attila/projects/soccerai` (és szimbolikus linkkel: `~/soccerai`)

---

## 1. Vezetői Összefoglaló (Executive Summary)

A **SoccerAI PRO** egy független, professzionális, prémium sötét témájú magyar nyelvű kvantitatív sportelemző és futball-predikciós platform.

A **`v1.12.0`** kiadás jelentősen kibővíti az elérhető nemzetközi bajnokságok körét: a korábbi 5 nagy liga, a BL és az NB I mellett mostantól a portugál **Primeira Liga**, a belga **Jupiler Pro League**, a török **Süper Lig**, az osztrák **Tipico Bundesliga**, a svájci **Super League**, a skót **Premiership**, a lengyel **Ekstraklasa**, a görög **Super League 1** és az amerikai **MLS** is teljes mértékben elérhető valós adatokkal és Dixon-Coles Poisson modellezéssel, mindezt megbízható kereszt-API deduplikációval.

### Fő Megvalósítások a v1.12.0-ban:

1. **Nemzetközi Bajnokságok Bővítése (Football-Data & API-Sports):**
   - Aktiválva a Portugál Primeira Liga (`PPL` kód a Football-Data-ban és `94`-es ID az API-Sports-ban).
   - Bekötve a Belga Jupiler Pro (`144`), Török Süper Lig (`203`), Osztrák Bundesliga (`218`), Svájci Super League (`207`), Skót Premiership (`179`), Lengyel Ekstraklasa (`106`), Görög Szuperliga (`197`) és Amerikai MLS (`253`).
   - Minden új ligához rögzítve lettek a valós történelmi gólátlagok az `apiSportsClient.ts`-ben a precíz Poisson eloszlásokhoz.

2. **Intelligens Kereszt-API Mérkőzés Deduplikáció (`src/App.tsx`):**
   - Normalizált csapatnév és dátum vizsgálatával kiszűri a párhuzamosan futó lekérések közötti átfedéseket (pl. ha a Primeira Liga meccseket mindkét forrás visszaadja).

3. **Dinamikus Ligaszűrő & Prioritás-Rendezés (`src/components/StatsGrid.tsx`):**
   - Az új ligák azonnal szűrhetővé válnak a ligasávban logikus prioritási sorrendben és országzászlókkal.

4. **Frissített Beállítások Szövegezés (`src/components/SettingsModal.tsx`):**
   - Egyértelmű, transzparens tájékoztatás az API-Sports kapcsoló alatt az elérhető új bajnokságokról.

1. **Egzakt Matematikai Szelvény- és Fogadáskiértékelés (`src/services/betEvaluation.ts`):**
   - Megszűnt a hibás szövegminta-illesztés és az ismeretlen piacok katasztrofális `totalGoals > 2.5` alapértelmezett kiértékelése.
   - Egzakt piac-illesztés `PickMarket` típus szerint (`1`, `X`, `2`, `BTTS_YES`, `OVER_25`, `FH_OVER_05`, stb.), a címkék végződésének vizsgálatával (`(1)`, `(2)`, `(x)`).
   - Félidős piac (`FH_OVER_05`) javítása: kizárólag valós félidős gólok (`homeHalfTimeScore` + `awayHalfTimeScore`) alapján dől el. Hiányzó félidős adat esetén nem dől el hibásan a 2. félidős gólokból, hanem megőrzi a lezáratlan státuszt (kivéve a bizonyított 0-0 végeredményt).
   - Tétnapló (`bankrollService.ts`) szinkron: lezáráskor a félidős és végeredmény is elmentésre kerül az archív szelvényelemekben.

2. **38 db Automatizált Vitest Egységteszt (0-ról 100%-ra fedett matematikai mag):**
   - `betEvaluation.test.ts` (19 teszt): 1X2, BTTS, Over/Under határok, félidős gólok, ismeretlen piacok biztonsági kezelése.
   - `predictionEngine.test.ts` (14 teszt): Dixon–Coles 8x8 bivariáns Poisson mátrix, $\rho$ korrekciók, Shin de-vigging, Negyed-Kelly méretezés és korlátok.
   - `bankrollService.test.ts` (5 teszt): Szelvénykészítés, egyéni és kombi fogadások automatikus elszámolása, nyitott meccsek kezelése, ROI, találati arány és nettó profit kalkuláció.
   - Beépítve a GitHub Actions CI folyamatba (`.github/workflows/ci.yml`).

3. **Dinamikus „Erős szignál küszöb” Bekötése (`SettingsModal.tsx` ↔ `StatsGrid.tsx`):**
   - A beállításokban megadott `focitipp_threshold` (alapértelmezett: 65%) mostantól közvetlenül vezérli a mérkőzésrács „Csak Kiemelt Jelek” szűrőjét és gombfeliratát (`Csak Kiemelt Jelek (X%+)`).
   - Globális eseményvezérlés (`focitipp_settings_updated`) révén az ablak mentésekor azonnal, oldalfrissítés nélkül frissül a felület.

4. **Szelvényépítő Korreláció-figyelmeztetés (`BetSlipDrawer.tsx`):**
   - Felismeri, ha a szelvényre ugyanabból a mérkőzésből került fel több piac (pl. BTTS + Over 2.5).
   - Figyelmeztető sáv és „Korrelált*” jelzés tájékoztatja a felhasználót arról, hogy az események nem függetlenek, így az együttes szorzott esély torzít.

5. **LocalStorage Kvótavédelem & Automatikus Gyorsítótár-ürítés:**
   - `historyService.ts`: Az archivált meccsek száma maximalizálva (`MAX_ARCHIVED_MATCHES = 150`), `QuotaExceededError` esetén automatikus védelem és szeletelés 50 meccsre.
   - `apiSportsClient.ts`: `pruneOldApiSportsCache` naponta automatikusan törli az elavult napi meccs- és odds-gyorsítótárakat, megelőzve az 5 MB-os böngészőtárhely megtelését.

6. **Kódfelosztás és Lazy Loading (Optimalizált Bundle):**
   - `React.lazy` és `Suspense` integráció a másodlagos nézetekre és modális ablakokra (`AboutModal`, `MethodologyView`, `SettingsModal`, `ResultsView`, `BankrollView`, `MatchDetailModal`).
   - A fő JavaScript bundle mérete 453 KB-ról **384 KB-ra (109 KB gzip)** csökkent.

7. **Kód- és Fájlhigiénia:**
   - Halott Vite/React starter fájlok (`src/App.css`, `src/assets/react.svg`, `vite.svg`, `src/assets/hero.png`) eltávolítva.
   - `Header.tsx` megkapja és megjeleníti az `ÉLŐ API` vs `SZIMULÁLT` adatforrás állapotot.
   - `StatsGrid.tsx` a korábbi elnyelt prop helyett felhasználja a szelvényelemeket az éppen kiválasztott kimenetelek táblázatos kiemelésére.

---

## 2. Technológiai Stack & Architektúra

| Komponens | Alkalmazott Technológia | Jellemző / Előny |
| :--- | :--- | :--- |
| **Frontend Keretrendszer** | React 19 (TypeScript) | Legmodernebb reaktív komponens-architektúra, Lazy Loading |
| **Build & Tooling** | Vite 8 + `@tailwindcss/vite` | Instant HMR, 1 másodperc alatti éles fordítás, route-splitting |
| **Tesztrendszer** | Vitest 5.0.5 | 38 egységteszt a matematikai és pénzkövető motoron |
| **Linter & Kódminőség** | Oxlint | 0 hiba, 0 figyelmeztetés |
| **Típusbiztonság** | TypeScript 5.8 (Strict Mode) | `strict: true`, `noImplicitAny: true`, 0 hiba |
| **Dizájn & CSS** | Tailwind CSS v4 | Deep Dark téma (`#070B14`, `#0D1527`, `#F59E0B`, `#10B981`) |
| **PWA & Offline** | Web App Manifest + Service Worker | Standalone telepíthetőség, Cache-First & Network-First |
| **Bankroll & Tétnapló** | LocalStorage + JSON Export/Import | Egzakt kiértékelés, kvótavédelem, korreláció-figyelés |
| **Élő API Források** | Football-Data.org v4 + API-Sports | Top bajnokságok + Másodosztályok + NB I + Élő oddsok |
| **API Proxyk** | Vercel Serverless Functions (`/api/*`) | CORS áthidalás és Edge CDN gyorsítótárazás |
| **Kvantitatív Elemzés** | Dixon–Coles + Shin + Negyed-Kelly | Bivariáns Poisson mátrix és variancia-védett tétméretezés |

---

## 3. Megvalósított Fő Modulok

1. **🔥 Napi Top Tippek (Top Picks):**
   - Szigorúan szűrt robusztus $\lambda$-rács ítéletű tippek, Kelly tőkeallokációval, közvetlen piacazonosítókkal.
2. **📊 Mérkőzés Rács & Hőtérkép (Stats Grid):**
   - 10+ bajnokság, táblázat, kártya és ScoreLab kompakt nézet, dinamikus küszöbszűrés.
3. **🏆 Eredmények Archívum (Results Archive):**
   - Egzakt piac- és félidő-specifikus kiértékelés, hibás gólszám-visszaesés nélkül, virtuális ROI.
4. **💼 Saját Bankroll Követő & Tétnapló (Bet Tracker):**
   - Egyéni tőkekövetés, pontos félidős és végeredmény tárolás, automatikus nyertes/vesztes könyvelés.
5. **📐 Kvantitatív Módszertan (Methodology):**
   - Dixon-Coles modell, Shin de-vigging bukméker árrés szűrés és hőtérkép magyarázat.
6. **📱 PWA Standalone Működés:**
   - Asztali és mobil alkalmazásként telepíthető, Service Worker offline védelemmel.

---

## 4. Fájl- és Könyvtárstruktúra

```
/home/attila/projects/soccerai/
├── STATUS_REPORT.md                 <-- Aktuális projekt státusz jelentés (v1.11.0)
├── CHANGELOG.md                     <-- Részletes verziótörténet v1.11.0 leírással
├── README.md                        <-- Fő bemutató dokumentáció
├── package.json                     <-- v1.11.0 verzió, vitest teszt script
├── vite.config.ts                   <-- Vite 8 + Tailwind v4 + Dev Proxy
├── tsconfig.json                    <-- Szigorú TypeScript konfiguráció
├── index.html                       <-- Belépési pont PWA meta címkékkel
├── public/
│   ├── manifest.json                <-- PWA Web App Manifest
│   ├── sw.js                        <-- Service Worker (Cache-First & Network-First)
│   └── icons/                       <-- PWA ikonok
├── api/
│   ├── matches.ts                   <-- Football-Data.org Vercel proxy & Edge cache
│   └── apisports.ts                 <-- API-Sports Vercel proxy & Edge cache
└── src/
    ├── main.tsx                     <-- React belépési pont + Service Worker
    ├── version.ts                   <-- v1.11.0 verziókonstansok és kiadási kiemelések
    ├── App.tsx                      <-- Dashboard navigáció, Code-Splitting / Suspense
    ├── types/
    │   └── football.ts              <-- PickMarket union, TrackedBet, Match, félidős eredmények
    ├── services/
    │   ├── betEvaluation.ts         <-- ÚJ: Egzakt matematikai piac-kiértékelő modul
    │   ├── dixonColesFitting.ts     <-- Dixon-Coles MLE paraméter-illesztés
    │   ├── historyService.ts        <-- Kvótavédett mérkőzésarchívum (max 150)
    │   ├── bankrollService.ts       <-- Bankroll menedzsment, perzisztencia, auto-settle
    │   ├── predictionEngine.ts      <-- Dixon-Coles, Shin de-vig, λ-rács, Kelly
    │   ├── footballDataApi.ts       <-- Football-Data.org API kliens & MLE integráció
    │   ├── apiSportsClient.ts       <-- API-Sports kliens, oddsok, cache-purgálás
    │   └── __tests__/               <-- ÚJ: 38 db Vitest egységteszt
    │       ├── betEvaluation.test.ts
    │       ├── predictionEngine.test.ts
    │       └── bankrollService.test.ts
    └── components/
        ├── ThreeDBall.tsx           <-- 3D interaktív forgó futball-labda komponens
        ├── BankrollView.tsx         <-- Tétnapló, KPI kártyák, szelvények (Lazy loaded)
        ├── BetSlipDrawer.tsx        <-- Szelvényépítő korreláció-figyelmeztetéssel
        ├── Header.tsx               <-- Navigáció, élő egyenleg chip, Élő API indikátor
        ├── HeroKpi.tsx              <-- Fő KPI sáv, 3D labda, dinamikus tegnapi mutató
        ├── StatsGrid.tsx            <-- ScoreLab mutatósáv, aktív küszöbszűrés, kiválasztási jelölés
        ├── TopPicks.tsx             <-- Napi kiemelt tippek, 3D kártyák, szelvény piac-átadás
        ├── ResultsView.tsx          <-- Eredmények, piaconkénti ROI és archívum (Lazy loaded)
        ├── MethodologyView.tsx      <-- Módszertan és matematikai modellek (Lazy loaded)
        ├── MatchDetailModal.tsx     <-- Kvantitatív elemzés, Poisson és oddsok (Lazy loaded)
        ├── AboutModal.tsx           <-- Névjegy, v1.11.0 infók (Lazy loaded)
        └── SettingsModal.tsx        <-- Beállítások, küszöb esemény-kiküldés (Lazy loaded)
```

---

## 5. Elérhetőségek & Git Státusz

* 🌐 **Éles Weboldal:** [https://soccerai-pro.vercel.app](https://soccerai-pro.vercel.app)
* 🐙 **GitHub Repository:** [https://github.com/banyaattila-crypto/soccerai](https://github.com/banyaattila-crypto/soccerai)
* 🏷️ **Célzott Git Tag:** `v1.11.0`
* 💻 **Helyi Fejlesztői Környezet:** `http://localhost:3000` (`npm run dev`)
* 🧪 **Egységtesztek:** `npm test` &bull; **38/38 teszt sikeres** (Vitest 5.0.5)
* 🧹 **Kódminőség:** `oxlint` 0 hiba, 0 figyelmeztetés | `tsc -b && vite build` 0 hiba, hibátlan build.

---

## 6. Javasolt Következő Lépések (Backlog)

1. **Nemzetközi Kupák Lefedettsége:** Bajnokok Ligája (UCL) és Európa Liga (UEL) mérkőzések integrálása.
2. **PWA Web Push Értesítések:** Automatikus értesítés küldése a felhasználónak a nap legmagasabb várható értékű (+EV) meccseiről és a lezárt szelvények eredményéről.
3. **Haladó Bankroll Grafikonok:** Kumulatív tőkegörbe (equity curve) vizualizáció és drawdown kalkuláció a Tétnaplóban.
