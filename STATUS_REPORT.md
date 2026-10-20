# 📊 SOCCERAI PRO &bull; PROJEKT STÁTUSZ JELENTÉS (STATUS REPORT)

**Projekt azonosító:** `soccerai` (SoccerAI PRO)  
**Aktuális verzió:** 🏷️ **`v1.21.1`** (SemVer 2.0.0)  
**Kiadás neve:** *CI Szigorú Linter & Oxlint Tisztítás (0 warning, 0 error)*  
**Dátum:** 2026. október 20.  
**Állapot:** ✅ **v1.21.1 Verzió Elkészült & Verifikálva (CI Zöld, 145/145 Teszt Sikeres, 0 Linter Hiba, Valós Headless Chromium CDP Zöld)**  
**GitHub Repository:** [https://github.com/banyaattila-crypto/soccerai](https://github.com/banyaattila-crypto/soccerai)  
**Vercel Live URL:** [https://soccerai-pro.vercel.app](https://soccerai-pro.vercel.app)  
**Helyi szerver port:** `http://localhost:3000` (Vite 8 HMR)  
**Projekt elérési útja:** `/home/attila/projects/soccerai` (és szimbolikus linkkel: `~/soccerai`)

---

## 1. Vezetői Összefoglaló (Executive Summary)

A **SoccerAI PRO** egy független, professzionális, prémium sötét témájú magyar nyelvű kvantitatív sportelemző és futball-predikciós platform.

A **`v1.21.1`** kiadás legfontosabb eredményei:
1. **GitHub Actions CI Pipeline Teljes Zöldítése:**
   - Megszüntetve az összes (19 db) Oxlint figyelmeztetés a szigorú `--deny-warnings` CI lépésben.
   - Nem használt modul- és típusimportok kitakarítva a forráskódból és a tesztekből.
   - `unicorn/no-new-array` refaktorálása safe `Array.from` implementációra.
   - 0 hiba, 0 figyelmeztetés a teljes projekten (`npx oxlint --deny-warnings`).
2. **Eredmények Lap Dátumszűrő Bővítése (`ResultsView.tsx`):**
   - Vizuális időszakszűrő gombok hozzáadva az Audit szűrősávhoz.
3. **Minden Automatizált és Böngészős Minőségbiztosítás Zöld:**
   - 145/145 egységteszt és regressziós teszt zöld.
   - `tsc -b` és `vite build` 0 hibával fordul.
   - Titkos kulcs szivárgás ellenőrzés (secret scan) tiszta.
   - Valós Chromium CDP automatizált böngészőteszt 0 hibával lefutott.

### Korábbi Fő Verziók Eredményei:

* **v1.20.0 — Kvóta-, Státusz- és Szelvény Integritás Stabilizáció:**
  - Csúszóablakos kvótavédelem (10 req/min), API-Sports 100/nap számláló, 429 backoff és stale cache fallback; POSTPONED, CANCELLED, SUSPENDED pontos státuszkezelés; kriptográfiai SHA-256 audit napló importálás; szelvény tisztító gomb (135/135 zöld teszt).

* **v1.19.0 — Valós Bukméker Oddsok, Lejárat (TTL) és Szimulált Ár Védelem:**
  - Élő Pinnacle és Bet365 oddsok közvetlen bekötése, 60 perces lejárati idő (TTL), szimulált árak esetén Value (+EV%) és Kelly-tét letiltása (123/123 zöld teszt).

* **v1.18.0 — Egységesített Modellképlet & Numerikus Invariánsok Regressziója:**
  - Kanonikus `computeDixonColesExpectedGoals`, közös nemnegatív `dixonColesTau`, Hare-Niemeyer legnagyobb maradvány 100% normalizáció, Fréchet határok és 48 invariáns teszt (112/112 zöld teszt).

* **v1.17.0 — Pre-Match Megmásíthatatlan Predikciónapló & Szigorú Provenance Rendszer:**
  - Kezdés előtti rögzítés, megmásíthatatlan (write-once) napló, determinisztikus hash aláírás, mock fallback teljes kizárása a hivatalos ROI-ból.

* **v1.16.5 — Játszható Érték-Szorzók (1.50+ Sweet Spot) & Nagyobb 3D Labda:**
  - Kvantitatív érték-index formulák, mini-oddsok (< 1.40) büntetése, 1.55–2.45 édes-pont preferálása, 46px folyamatosan forgó labda.

* **v1.16.4 — Fotorealisztikus 8K adidas TRIONDA PRO FIFA 2026 3D Meccslabda:**
  - 4-nézetes stúdiófotó-szintézis (0°, 90°, 180°, 270°), bilineáris textúra-szűrés, letisztult prémium megjelenés.

* **v1.16.3 — 3D Animált FIFA 2026 Hivatalos Meccslabda:**
  - Kezdeti 3D gömbvetítés és forgási sebesség csökkentés.

* **v1.16.2 — Valós Élő API Adatok Garanciája & Kvótavédelem:**
  - Csendes mock fallback megszüntetése, HTTP 429 kvótavédelem (0 extra API kérés), Bajnokok Ligája modellezés.

* **v1.16.1 — Scanner Napszűrés & Fogadható Meccsek Alapértelmezése:**
  - Idősáv- és státuszválasztó (`Mai Értéktippek`, `Holnapi Meccsek`, `Összes Nyitott`, `Lezárt/Archív EV`).
  - Nyitott meccsek rangsorolása alapértelmezettként (`statusFilter: 'open_only'`).

* **v1.16.0 — Nemzetközi Kupák Teljes Lefedettsége (UCL, UEL, UECL):**
  - Bajnokok Ligája (⭐), Európa Liga (🏆), Konferencia Liga (🟢) bekötve empirikus kupa gólátlagokkal.
  - Kettős alias feloldás (`ucl`/`cl`, `uel`/`el`, `uecl`/`ec`) és prioritás a ligasávban.

* **v1.15.0 — Pulzáló Élő Meccs Kapszula & Gyorsszűrő:**
  - Élénk piros, animált pulzáló (`animate-ping`) élő számláló kapszula a fejlécben.
  - „Csak Élő” gyorsszűrő a mérkőzésrácsban és globális eseményvezérlés (`focitipp_filter_live`).

* **v1.14.0 — Kvantitatív Értékkereső (Scanner) & Bajnokság Radar:**
  - Piacvizsgáló modul 8 okos presettel (💎 +EV Értéktippek, 🎯 Kiemelt MI Tippek, ⚽ Over 2.5, 🥅 BTTS, stb.).
  - Liga Értékradar átlagos várható gólok (xG), Over 2.5 gyakoriság és BTTS arány szerint.

* **v1.13.0 — ScoreLab H2H & Bivariáns Dixon-Coles Poisson Gólmátrix:**
  - Momentum- és formaindex, kétoldalas összehasonlító sávok ($xG$, $\alpha$, $\beta$, gólátlagok).
  - 5x5-ös pontos végeredmény valószínűségi hőtérkép fair szorzókkal ($1/p$) és Top 6 rangsorral.

---

## 2. Technológiai Stack & Architektúra

| Komponens | Alkalmazott Technológia | Jellemző / Előny |
| :--- | :--- | :--- |
| **Frontend Keretrendszer** | React 19 (TypeScript) | Legmodernebb reaktív komponens-architektúra, Lazy Loading |
| **Build & Tooling** | Vite 8 + `@tailwindcss/vite` | Instant HMR, 1 másodperc alatti éles fordítás, route-splitting |
| **Tesztrendszer** | Vitest 5.0.5 | 55 egységteszt a matematikai, kupamodellező és pénzkövető motoron |
| **Linter & Kódminőség** | Oxlint | 0 hiba, 0 figyelmeztetés |
| **Típusbiztonság** | TypeScript 5.8 (Strict Mode) | `strict: true`, `noImplicitAny: true`, 0 hiba |
| **Dizájn & CSS** | Tailwind CSS v4 | Deep Dark téma (`#070B14`, `#0D1527`, `#F59E0B`, `#10B981`) |
| **PWA & Offline** | Web App Manifest + Service Worker | Standalone telepíthetőség, Cache-First & Network-First |
| **Bankroll & Tétnapló** | LocalStorage + JSON Export/Import | Egzakt kiértékelés, kvótavédelem, korreláció-figyelés |
| **Élő API Források** | Football-Data.org v4 + API-Sports | Top ligák + UCL, UEL, UECL + Másodosztályok + NB I + Élő oddsok |
| **API Proxyk** | Vercel Serverless Functions (`/api/*`) | CORS áthidalás és Edge CDN gyorsítótárazás |
| **Kvantitatív Elemzés** | Dixon–Coles + Shin + Negyed-Kelly | Bivariáns Poisson mátrix és variancia-védett tétméretezés |

---

## 3. Megvalósított Fő Modulok

1. **🔥 Napi Top Tippek (Top Picks):** Szigorúan szűrt robusztus $\lambda$-rács ítéletű tippek, Kelly tőkeallokációval.
2. **⭐ Nemzetközi Kupák & Bajnokság Rács (Stats Grid):** UCL, UEL, UECL, 15+ bajnokság, „Csak Élő” gyorsszűrő.
3. **⚔️ ScoreLab H2H & 5x5 Poisson Mátrix (MatchDetailModal):** Formaindex, összehasonlító sávok, 5x5 hőtérkép.
4. **🔍 Kvantitatív Értékkereső (ScannerView):** Időszak & státusz szűrés (Ma, Holnap, Nyitott, Archív), 8 intelligens preset, +EV rangsor, Kelly tétméretezés.
5. **🏆 Eredmények Archívum (Results Archive):** Egzakt piac- és félidő-specifikus kiértékelés, virtuális ROI.
6. **💼 Saját Bankroll Követő & Tétnapló (Bet Tracker):** Egyéni tőkekövetés, automatikus nyertes/vesztes könyvelés.
7. **📐 Kvantitatív Módszertan (Methodology):** Dixon-Coles modell, Shin de-vigging árrés szűrés.
8. **📱 PWA Standalone Működés:** Service Worker offline védelem, pulzáló élő kapszula.

---

## 4. Fájl- és Könyvtárstruktúra

```
/home/attila/projects/soccerai/
├── STATUS_REPORT.md                 <-- Aktuális projekt státusz jelentés (v1.21.0)
├── CHANGELOG.md                     <-- Részletes verziótörténet v1.21.0 leírással
├── README.md                        <-- Fő bemutató dokumentáció
├── package.json                     <-- v1.21.0 verzió, vitest teszt script
├── vite.config.ts                   <-- Vite 8 + Tailwind v4 + Dev Proxy
├── tsconfig.json                    <-- Szigorú TypeScript konfiguráció
├── index.html                       <-- Belépési pont PWA meta címkékkel
├── scripts/
│   └── verifyBrowser.mjs            <-- Valós Headless Chromium CDP böngésző-verifikációs teszt
├── public/
│   ├── manifest.json                <-- PWA Web App Manifest
│   ├── sw.js                        <-- Service Worker (Cache-First & Network-First)
│   └── icons/                       <-- PWA ikonok
├── api/
│   ├── matches.ts                   <-- Football-Data.org Vercel proxy & Edge cache
│   └── apisports.ts                 <-- API-Sports Vercel proxy & Edge cache
└── src/
    ├── main.tsx                     <-- React belépési pont + Service Worker
    ├── version.ts                   <-- v1.21.0 verziókonstansok és kiadási kiemelések
    ├── App.tsx                      <-- Dashboard navigáció, Élő kapszula, Deduplikáció, Valós API garancia, Szelvény szinkron
    ├── types/
    │   └── football.ts              <-- PickMarket, TrackedBet, Match, League, MatchStatus
    ├── services/
    │   ├── calibrationService.ts    <-- Időrendhelyes out-of-sample kalibráció, Brier Score, ECE & Éldöntési Kapu
    │   ├── quotaService.ts          <-- Centralizált kvóta- és kérésszám menedzser (Sliding window & Backoff)
    │   ├── betEvaluation.ts         <-- Egzakt matematikai piac-kiértékelő modul
    │   ├── dixonColesFitting.ts     <-- Dixon-Coles MLE paraméter-illesztés + Európai club priorok
    │   ├── historyService.ts        <-- Kvótavédett mérkőzésarchívum (max 150)
    │   ├── bankrollService.ts       <-- Bankroll menedzsment, perzisztencia, auto-settle, szigorú JSON import
    │   ├── predictionAuditService.ts <-- Megmásíthatatlan pre-match audit napló & SHA-256 tamper-evident import
    │   ├── predictionEngine.ts      <-- Dixon-Coles, Shin de-vig, λ-rács, Kelly
    │   ├── scoreLabService.ts       <-- 5x5 Poisson mátrix, H2H kalkuláció és formaindex
    │   ├── scannerService.ts        <-- Kvantitatív értékkereső, +EV piacok, időszak-szűrés, liga radar
    │   ├── footballDataApi.ts       <-- Football-Data.org API kliens (kvótavédelem, stale cache mentés)
    │   ├── apiSportsClient.ts       <-- API-Sports kliens (kvótavédelem, stale cache mentés)
    │   └── __tests__/               <-- 145 db Vitest egységteszt (11 tesztcsomag)
    │       ├── calibrationService.test.ts
    │       ├── quotaAndIntegrityRegression.test.ts
    │       ├── realOddsExpirationRegression.test.ts
    │       ├── modelInvariantsRegression.test.ts
    │       ├── predictionAuditService.test.ts
    │       ├── betEvaluation.test.ts
    │       ├── predictionEngine.test.ts
    │       ├── bankrollService.test.ts
    │       ├── scoreLabService.test.ts
    │       ├── scannerService.test.ts
    │       └── cupCompetitions.test.ts
    └── components/
        ├── ThreeDBall.tsx           <-- 3D interaktív forgó futball-labda komponens
        ├── BankrollView.tsx         <-- Tétnapló, KPI kártyák, szelvények (Lazy loaded)
        ├── BetSlipDrawer.tsx        <-- Szelvényépítő érvénytelen meccs szűréssel és tisztító gombbal
        ├── Header.tsx               <-- Navigáció, élő kapszula pulzáló jelvény
        ├── HeroKpi.tsx              <-- Fő KPI sáv, 3D labda, dinamikus mutatók
        ├── StatsGrid.tsx            <-- Mérkőzésrács, kupa- és bajnokságszűrő, „Csak Élő”
        ├── TopPicks.tsx             <-- Napi kiemelt tippek, 3D kártyák
        ├── ScannerView.tsx          <-- Kvantitatív Értékkereső, Időszak- és Státuszválasztó, Bajnokság Radar
        ├── ScoreLabH2HCard.tsx      <-- Csapat-összehasonlítás, momentum és H2H mérleg
        ├── ScoreLabPoissonMatrix.tsx <-- 5x5 interaktív Dixon-Coles hőtérkép & Top 6
        ├── ResultsView.tsx          <-- Eredmények, audit napló importálás és archívum (Lazy loaded)
        ├── MethodologyView.tsx      <-- Módszertan, 6. pont alatti Időrendhelyes Kalibráció & Döntési Kapu
        ├── MatchDetailModal.tsx     <-- Kvantitatív elemzés, 3-utas ScoreLab fülkezelés
        ├── AboutModal.tsx           <-- Névjegy, v1.21.0 infók (Lazy loaded)
        └── SettingsModal.tsx        <-- Beállítások, kupa jelvények (Lazy loaded)
```

---

## 5. Elérhetőségek & Git Státusz

* 🌐 **Éles Weboldal:** [https://soccerai-pro.vercel.app](https://soccerai-pro.vercel.app)
* 🐙 **GitHub Repository:** [https://github.com/banyaattila-crypto/soccerai](https://github.com/banyaattila-crypto/soccerai)
* 🏷️ **Célzott Git Tag:** `v1.21.0`
* 💻 **Helyi Fejlesztői Környezet:** `http://localhost:3000` (`npm run dev`)
* 🧪 **Egységtesztek:** `npm test` &bull; **145/145 teszt sikeres** (Vitest 5.0.5, 11 tesztcsomag)
* 🌐 **Böngészős Ellenőrzés:** `node scripts/verifyBrowser.mjs` &bull; **0 unhandled exception, 0 console error**
* 🧹 **Kódminőség:** `oxlint` 0 hiba, 0 figyelmeztetés | `tsc -b && vite build` 0 hiba, hibátlan build.
* 🧹 **Kódminőség:** `oxlint` 0 hiba, 0 figyelmeztetés | `tsc -b && vite build` 0 hiba, hibátlan build.

---

## 6. Javasolt Következő Lépések (Backlog)

1. **Értéktippek & Szelvény Export (CSV/JSON & Vágólap):**
   - Egykattintásos szelvény vagy scanner lista másolása a vágólapra vagy letöltése strukturált CSV/JSON formátumban.
2. **Scanner Hang- és Push Értesítések:**
   - Opcionális audio szignál vagy böngésző értesítés kiemelt (+EV > 8% vagy 75%+ esélyű) mérkőzés/értéktipp azonosításakor.
3. **Haladó Bankroll Kumulatív Tőkegörbe (Equity Curve):**
   - Kumulatív tőkegörbe vizualizáció és drawdown kalkuláció a Tétnaplóban.
