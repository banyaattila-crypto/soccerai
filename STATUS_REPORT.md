# 📊 SOCCERAI PRO &bull; PROJEKT STÁTUSZ JELENTÉS (STATUS REPORT)

**Projekt azonosító:** `soccerai` (SoccerAI PRO)  
**Aktuális verzió:** 🏷️ **`v1.15.0`** (SemVer 2.0.0)  
**Kiadás neve:** *Pulzáló Élő Meccs Kapszula (Header) & Élő Meccsek Gyorsszűrő (StatsGrid)*  
**Dátum:** 2026. október 19.  
**Állapot:** ✅ **v1.15.0 Verzió Elkészült & Verifikálva (48/48 Teszt Sikeres, 0 Hiba, 0 Figyelmeztetés, Szigorú TypeScript)**  
**GitHub Repository:** [https://github.com/banyaattila-crypto/soccerai](https://github.com/banyaattila-crypto/soccerai)  
**Vercel Live URL:** [https://soccerai-pro.vercel.app](https://soccerai-pro.vercel.app)  
**Helyi szerver port:** `http://localhost:3000` (Vite 8 HMR)  
**Projekt elérési útja:** `/home/attila/projects/soccerai` (és szimbolikus linkkel: `~/soccerai`)

---

## 1. Vezetői Összefoglaló (Executive Summary)

A **SoccerAI PRO** egy független, professzionális, prémium sötét témájú magyar nyelvű kvantitatív sportelemző és futball-predikciós platform.

A **`v1.15.0`** kiadás újdonságai és fejlesztései:
1. **Pulzáló Élő Meccs Kapszula a Fejlécben (`Header.tsx`):**
   - Dinamikus piros, animált pulzáló (`animate-ping`) élő meccs számláló kapszula a fejléc jobb felső műveleti sávjában.
   - Egyetlen kattintással a meccslistára navigál és automatikusan bekapcsolja az élő mérkőzések szűrését.
   - Ha nincs aktív élő meccs, diszkrét állapotjelzőként funkcionál.
2. **Élő Mérkőzések Gyorsszűrő Kapcsoló (`StatsGrid.tsx`):**
   - Dedikált „Csak Élő” gomb a vezérlősávban valós idejű mérkőzésszámlálóval és pulzáló jelvénnyel.
   - Globális eseményvezérlés (`focitipp_filter_live`): a fejlécből történő kattintásra azonnal megnyitja és beállítja az élő találkozók listáját.
   - Intelligens üres állapot kezelés gyorsgombbal az összes mérkőzés visszaállítására.
3. **Valós Idejű Eredmény & Perc Jelzések:**
   - Játékperc (`minute'`), hazai és vendég gólok és lezárási állapot azonnali vizuális renderelése.

### Korábbi Fő Verziók Eredményei:

* **v1.14.0 — Kvantitatív Értékkereső (Scanner) & Bajnokság Radar:**
  - Piacvizsgáló modul 8 okos presettel (💎 +EV Értéktippek, 🎯 Kiemelt MI Tippek, ⚽ Over 2.5, 🥅 BTTS, 🛡️ Favoritok, ⚡ 1. Félidő >0.5, 💣 Meglepetések, Összes lehetőség).
  - Liga Értékradar átlagos várható gólok (xG), Over 2.5 gyakoriság és BTTS arány szerint.
  - Közvetlen szelvényre tétel és kód-felosztott lazy loading.

* **v1.13.0 — ScoreLab H2H & Bivariáns Dixon-Coles Poisson Gólmátrix:**
  - Momentum- és formaindex, kétoldalas összehasonlító sávok ($xG$, $\alpha$, $\beta$, gólátlagok).
  - 5x5-ös pontos végeredmény valószínűségi hőtérkép fair szorzókkal ($1/p$) és Top 6 rangsorral.
  - 3-utas navigáció a modális ablakban (`Áttekintés`, `H2H & Csapatok`, `Poisson Mátrix`).

* **v1.12.0 — Nemzetközi Bajnokságok Bővítése & Deduplikáció:**
  - Portugál Primeira Liga, Belga Jupiler, Török Süper Lig, Osztrák Bundesliga, Svájci Super League, Skót Premiership, Lengyel Ekstraklasa, Görög Szuperliga, MLS integráció.
  - Normalizált kereszt-API deduplikáció az átfedések kiszűrésére.

* **v1.11.0 — Egzakt Matematikai Szelvény- és Fogadáskiértékelés & 48 Teszt:**
  - Piac-illesztés `PickMarket` típus szerint (`1`, `X`, `2`, `BTTS_YES`, `OVER_25`, `FH_OVER_05`, stb.).
  - Félidős gólok egzakt elszámolása és szelvényépítő korreláció-figyelmeztetés.
  - 48 db Vitest egységteszt 100%-os lefedettséggel a matematikai és pénzügyi logikán.

---

## 2. Technológiai Stack & Architektúra

| Komponens | Alkalmazott Technológia | Jellemző / Előny |
| :--- | :--- | :--- |
| **Frontend Keretrendszer** | React 19 (TypeScript) | Legmodernebb reaktív komponens-architektúra, Lazy Loading |
| **Build & Tooling** | Vite 8 + `@tailwindcss/vite` | Instant HMR, 1 másodperc alatti éles fordítás, route-splitting |
| **Tesztrendszer** | Vitest 5.0.5 | 48 egységteszt a matematikai, scanner és pénzkövető motoron |
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
2. **📊 Mérkőzés Rács & Élő Gyorsszűrő (Stats Grid):**
   - 10+ bajnokság, táblázat és kártya nézet, dinamikus küszöbszűrés, „Csak Élő” gyorsszűrő.
3. **⚔️ ScoreLab H2H & 5x5 Poisson Mátrix (MatchDetailModal):**
   - Formaindex, összehasonlító sávok, H2H múlt és 5x5 pontos végeredmény valószínűségi hőtérkép fair szorzókkal.
4. **🔍 Kvantitatív Értékkereső (ScannerView):**
   - 8 intelligens preset, +EV rangsor, Kelly tétméretezés, bajnokság statisztikai radar.
5. **🏆 Eredmények Archívum (Results Archive):**
   - Egzakt piac- és félidő-specifikus kiértékelés, virtuális ROI.
6. **💼 Saját Bankroll Követő & Tétnapló (Bet Tracker):**
   - Egyéni tőkekövetés, pontos félidős és végeredmény tárolás, automatikus nyertes/vesztes könyvelés.
7. **📐 Kvantitatív Módszertan (Methodology):**
   - Dixon-Coles modell, Shin de-vigging bukméker árrés szűrés és hőtérkép magyarázat.
8. **📱 PWA Standalone Működés:**
   - Asztali és mobil alkalmazásként telepíthető, Service Worker offline védelemmel és pulzáló élő meccs kapszulával.

---

## 4. Fájl- és Könyvtárstruktúra

```
/home/attila/projects/soccerai/
├── STATUS_REPORT.md                 <-- Aktuális projekt státusz jelentés (v1.15.0)
├── CHANGELOG.md                     <-- Részletes verziótörténet v1.15.0 leírással
├── README.md                        <-- Fő bemutató dokumentáció
├── package.json                     <-- v1.15.0 verzió, vitest teszt script
├── vite.config.ts                   <-- Vite 8 + Tailwind v4 + Dev Proxy
├── tsconfig.json                    <-- Szigorú TypeScript konfiguráció
├── index.html                       <-- Belépési pont PWA meta címkékkel
├── public/
│   ├── manifest.json                <-- PWA Web App Manifest
│   ├── sw.js                        <-- Service Worker (v1.15.0, Cache-First & Network-First)
│   └── icons/                       <-- PWA ikonok
├── api/
│   ├── matches.ts                   <-- Football-Data.org Vercel proxy & Edge cache
│   └── apisports.ts                 <-- API-Sports Vercel proxy & Edge cache
└── src/
    ├── main.tsx                     <-- React belépési pont + Service Worker
    ├── version.ts                   <-- v1.15.0 verziókonstansok és kiadási kiemelések
    ├── App.tsx                      <-- Dashboard navigáció, Élő kapszula események, Code-Splitting
    ├── types/
    │   └── football.ts              <-- PickMarket union, TrackedBet, Match, félidős és élő mezők
    ├── services/
    │   ├── betEvaluation.ts         <-- Egzakt matematikai piac-kiértékelő modul
    │   ├── dixonColesFitting.ts     <-- Dixon-Coles MLE paraméter-illesztés
    │   ├── historyService.ts        <-- Kvótavédett mérkőzésarchívum (max 150)
    │   ├── bankrollService.ts       <-- Bankroll menedzsment, perzisztencia, auto-settle
    │   ├── predictionEngine.ts      <-- Dixon-Coles, Shin de-vig, λ-rács, Kelly
    │   ├── scoreLabService.ts       <-- 5x5 Poisson mátrix, H2H kalkuláció és formaindex
    │   ├── scannerService.ts        <-- Kvantitatív értékkereső, +EV piacok, liga radar
    │   ├── footballDataApi.ts       <-- Football-Data.org API kliens & MLE integráció
    │   ├── apiSportsClient.ts       <-- API-Sports kliens, oddsok, cache-purgálás
    │   └── __tests__/               <-- 48 db Vitest egységteszt
    │       ├── betEvaluation.test.ts
    │       ├── predictionEngine.test.ts
    │       ├── bankrollService.test.ts
    │       ├── scoreLabService.test.ts
    │       └── scannerService.test.ts
    └── components/
        ├── ThreeDBall.tsx           <-- 3D interaktív forgó futball-labda komponens
        ├── BankrollView.tsx         <-- Tétnapló, KPI kártyák, szelvények (Lazy loaded)
        ├── BetSlipDrawer.tsx        <-- Szelvényépítő korreláció-figyelmeztetéssel
        ├── Header.tsx               <-- Navigáció, élő kapszula pulzáló jelvény, API indikátor
        ├── HeroKpi.tsx              <-- Fő KPI sáv, 3D labda, dinamikus mutatók
        ├── StatsGrid.tsx            <-- Mérkőzésrács, „Csak Élő” gyorsszűrő, ScoreLab sáv
        ├── TopPicks.tsx             <-- Napi kiemelt tippek, 3D kártyák, szelvény piac-átadás
        ├── ScannerView.tsx          <-- Kvantitatív Értékkereső & Bajnokság Radar (Lazy loaded)
        ├── ScoreLabH2HCard.tsx      <-- Csapat-összehasonlítás, momentum és H2H mérleg
        ├── ScoreLabPoissonMatrix.tsx <-- 5x5 interaktív Dixon-Coles hőtérkép & Top 6
        ├── ResultsView.tsx          <-- Eredmények, piaconkénti ROI és archívum (Lazy loaded)
        ├── MethodologyView.tsx      <-- Módszertan és matematikai modellek (Lazy loaded)
        ├── MatchDetailModal.tsx     <-- Kvantitatív elemzés, 3-utas ScoreLab fülkezelés
        ├── AboutModal.tsx           <-- Névjegy, v1.15.0 infók (Lazy loaded)
        └── SettingsModal.tsx        <-- Beállítások, küszöb esemény-kiküldés (Lazy loaded)
```

---

## 5. Elérhetőségek & Git Státusz

* 🌐 **Éles Weboldal:** [https://soccerai-pro.vercel.app](https://soccerai-pro.vercel.app)
* 🐙 **GitHub Repository:** [https://github.com/banyaattila-crypto/soccerai](https://github.com/banyaattila-crypto/soccerai)
* 🏷️ **Célzott Git Tag:** `v1.15.0`
* 💻 **Helyi Fejlesztői Környezet:** `http://localhost:3000` (`npm run dev`)
* 🧪 **Egységtesztek:** `npm test` &bull; **48/48 teszt sikeres** (Vitest 5.0.5)
* 🧹 **Kódminőség:** `oxlint` 0 hiba, 0 figyelmeztetés | `tsc -b && vite build` 0 hiba, hibátlan build.

---

## 6. Javasolt Következő Lépések (Backlog)

1. **Értéktippek & Szelvény Export (CSV/JSON & Vágólap):**
   - Egykattintásos szelvény vagy scanner lista másolása a vágólapra vagy letöltése strukturált CSV/JSON formátumban.
2. **Scanner Hang- és Push Értesítések:**
   - Opcionális audio szignál vagy böngésző értesítés kiemelt (+EV > 8% vagy 75%+ esélyű) mérkőzés/értéktipp azonosításakor.
3. **Nemzetközi Kupák Lefedettsége:**
   - Bajnokok Ligája (UCL) és Európa Liga (UEL) mérkőzések integrálása.
