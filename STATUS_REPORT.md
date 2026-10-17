# 📊 SOCCERAI PRO &bull; PROJEKT STÁTUSZ JELENTÉS (STATUS REPORT)

**Projekt azonosító:** `soccerai` (SoccerAI PRO)  
**Aktuális verzió:** 🏷️ **`v1.6.0`** (SemVer 2.0.0)  
**Kiadás neve:** *Saját Bankroll Követő & Tétnapló (Bet Tracker)*  
**Dátum:** 2026. október 17.  
**Állapot:** ✅ **v1.6.0 Funkciók Elkészültek & Verifikálva (Oxlint 0 hiba, Build OK)**  
**GitHub Repository:** [https://github.com/banyaattila-crypto/soccerai](https://github.com/banyaattila-crypto/soccerai)  
**Vercel Live URL:** [https://soccerai-pink.vercel.app](https://soccerai-pink.vercel.app)  
**Helyi szerver port:** `http://localhost:3000` (Vite 8 HMR)  
**Projekt elérési útja:** `/home/attila/projects/soccerai` (és szimbolikus linkkel: `~/soccerai`)

---

## 1. Vezetői Összefoglaló (Executive Summary)

A **SoccerAI PRO** egy független, professzionális, prémium sötét témájú magyar nyelvű kvantitatív sportelemző és gépi tanulási futball-predikciós platform.

A legújabb **`v1.6.0`** kiadással megérkezett a platform egyik legfontosabb funkcionális bővítménye: a **Saját Bankroll Követő & Tétnapló (Bet Tracker)**.

### Fő Megvalósítások a v1.6.0-ban:
1. **Saját Bankroll Követő & Tétnapló (`BankrollView.tsx`, `bankrollService.ts`):**
   - Dinamikus tőkemenedzsment: aktuális egyenleg valós idejű számítása a kezdőtőkéből, a megnyert/vesztett szelvényekből és a függőben lévő lekötött összegekből.
   - Egyéni kezdőtőke szerkesztés (alapértelmezett 50 000 Ft, bármikor átírható).
   - Teljes KPI statisztika: Nettó Profit (+/- Ft), Személyes ROI (%), Találati Arány (Strike Rate %), Lekötött tőke és átlagos oddsok.
   - Biztonságos helyi perzisztencia (`localStorage`), JSON export/import és egykattintásos mintaadat-visszaállítás.

2. **Közvetlen Szelvény Rögzítés a Szelvényépítőből (`BetSlipDrawer.tsx`):**
   - Egykattintásos mentés a Tétnaplóba automatikus odds és valószínűség számítással.
   - Negyed-Kelly kockázati kitettség figyelmeztetés (>10% bankroll arány esetén).
   - Opcionális egyedi jegyzetelés és közvetlen ugrás a Tétnaplóhoz.

3. **Intelligens Automatikus Szelvény Kiértékelés (Auto-Evaluate):**
   - A meccsadatbázis befejezett mérkőzéseinek tényleges végeredményei alapján egy kattintással kiértékeli a függőben lévő szelvényeket.
   - Intelligens korai veszteség-felismerés kombinált szelvényeknél.
   - Kézi felülbírálati lehetőség bármelyik szelvényre (Nyert / Vesztett / Függőben / Void).

4. **5-fülű Bővített Navigáció & Élő Bankroll Kijelző (`Header.tsx`):**
   - Élő egyenleg-chip a fejlécben (`💰 53 450 Ft`) azonnali navigációval.
   - Reszponzív 5-elemes mobil tab-sáv (`Top`, `Rács`, `Eredmény`, `Bankroll`, `Módszer`).

---

## 2. Technológiai Stack & Architektúra

| Komponens | Alkalmazott Technológia | Jellemző / Előny |
| :--- | :--- | :--- |
| **Frontend Keretrendszer** | React 19 (TypeScript) | Legmodernebb reaktív komponens-architektúra |
| **Build & Tooling** | Vite 8 + `@tailwindcss/vite` | Instant HMR, 1 másodperc alatti éles fordítás |
| **Linter & Kódminőség** | Oxlint | 0 hiba, 0 figyelmeztetés |
| **Dizájn & CSS** | Tailwind CSS v4 | Deep Dark téma (`#070B14`, `#0D1527`, `#F59E0B`, `#10B981`) |
| **PWA & Offline** | Web App Manifest + Service Worker | Standalone telepíthetőség, Cache-First & Network-First |
| **Bankroll & Tétnapló** | LocalStorage + JSON Export/Import | Biztonságos helyi tárolás, automatikus kiértékelés |
| **Élő API Források** | Football-Data.org v4 + API-Sports | Top bajnokságok + Másodosztályok + NB I + Élő oddsok |
| **API Proxyk** | Vercel Serverless Functions (`/api/*`) | CORS áthidalás és Edge CDN gyorsítótárazás |
| **Kvantitatív Elemzés** | Dixon–Coles + Shin + Negyed-Kelly | Bivariáns Poisson mátrix és variancia-védett tétméretezés |

---

## 3. Megvalósított Fő Modulok

1. **🔥 Napi Top Tippek (Top Picks):**
   - Szigorúan szűrt robusztus $\lambda$-rács ítéletű tippek, Kelly tőkeallokációval.
2. **📊 Mérkőzés Rács & Hőtérkép (Stats Grid):**
   - 10+ bajnokság, táblázat és kártyanézet, esély-hőtérkép és szorzók.
3. **🏆 Eredmények Archívum (Results Archive):**
   - Piac-specifikus bontás (BTTS, Over 2.5, Kombi, 1X2, Under 2.5) és virtuális ROI kalkulátor.
4. **💼 Saját Bankroll Követő & Tétnapló (Bet Tracker, Új a v1.6.0-ban):**
   - Egyéni tőkekövetés, szelvénymentés, személyes ROI%, találati arány és automatikus kiértékelés.
5. **📐 Kvantitatív Módszertan (Methodology):**
   - Dixon-Coles modell, Shin de-vigging bukméker árrés szűrés és hőtérkép magyarázat.
6. **📱 PWA Standalone Működés:**
   - Asztali és mobil alkalmazásként telepíthető, Service Worker offline védelemmel.

---

## 4. Fájl- és Könyvtárstruktúra

```
/home/attila/projects/soccerai/
├── STATUS_REPORT.md                 <-- Aktuális projekt státusz jelentés (v1.6.0)
├── CHANGELOG.md                     <-- Verziótörténet v1.6.0 leírással
├── README.md                        <-- Fő bemutató dokumentáció
├── package.json                     <-- v1.6.0 verzió, függőségek és scriptek
├── vite.config.ts                   <-- Vite 8 + Tailwind v4 + Dev Proxy
├── tsconfig.json                    <-- TypeScript konfiguráció
├── index.html                       <-- Belépési pont PWA meta címkékkel
├── public/
│   ├── manifest.json                <-- PWA Web App Manifest
│   ├── sw.js                        <-- Service Worker (Cache-First & Network-First)
│   └── icons/                       <-- 192x192, 512x512, apple-touch-icon
├── api/
│   ├── matches.ts                   <-- Football-Data.org Vercel proxy & Edge cache
│   └── apisports.ts                 <-- API-Sports Vercel proxy & Edge cache
└── src/
    ├── main.tsx                     <-- React belépési pont + Service Worker
    ├── version.ts                   <-- v1.6.0 verziókonstansok és kiadási kiemelések
    ├── App.tsx                      <-- Dashboard navigáció (5 fül), Bankroll szinkron
    ├── types/
    │   └── football.ts              <-- TrackedBet, BankrollSummary, Match típusok
    ├── services/
    │   ├── bankrollService.ts       <-- Bankroll menedzsment, perzisztencia, auto-settle
    │   ├── predictionEngine.ts      <-- Dixon-Coles, Shin de-vig, λ-rács, Kelly
    │   ├── footballDataApi.ts       <-- Football-Data.org API kliens
    │   └── apiSportsClient.ts       <-- API-Sports kliens & élő oddsok
    └── components/
        ├── BankrollView.tsx         <-- Tétnapló, KPI kártyák, szelvények, kézi rögzítés
        ├── BetSlipDrawer.tsx        <-- Szelvényépítő Bankroll mentés integrációval
        ├── Header.tsx               <-- 5-fülű navigáció, élő egyenleg chip, PWA badge
        ├── StatsGrid.tsx            <-- Táblázat és Kártyanézet, ligaszűrők
        ├── TopPicks.tsx             <-- Napi kiemelt tippek és szignálok
        ├── ResultsView.tsx          <-- Eredmények, piaconkénti ROI
        ├── MethodologyView.tsx      <-- Módszertan és matematikai modellek
        ├── MatchDetailModal.tsx     <-- Kvantitatív elemzés, Poisson és odds összevetés
        ├── AboutModal.tsx           <-- Névjegy, v1.6.0 infók
        └── SettingsModal.tsx        <-- API kulcsok és liga-engedélyezés
```

---

## 5. Elérhetőségek & Git Státusz

* 🌐 **Éles Weboldal:** [https://soccerai-pink.vercel.app](https://soccerai-pink.vercel.app)
* 🐙 **GitHub Repository:** [https://github.com/banyaattila-crypto/soccerai](https://github.com/banyaattila-crypto/soccerai)
* 🏷️ **Célzott Git Tag:** `v1.6.0`
* 💻 **Helyi Fejlesztői Környezet:** `http://localhost:3000` (`npm run dev`)
* 🧹 **Kódminőség:** `oxlint` 0 hiba, 0 figyelmeztetés | `tsc -b && vite build` 751ms alatt hibátlanul fut.

---

## 6. Javasolt Következő Lépések (Backlog)

1. **Nemzetközi Kupák Lefedettsége:** Bajnokok Ligája (UCL) és Európa Liga (UEL) kiemelt mérkőzéseinek integrálása és szűrése a bajnokságlistában.
2. **PWA Web Push Értesítések:** Automatikus értesítés küldése a felhasználónak a nap legmagasabb várható értékű (+EV) meccseiről és a lezárt szelvények eredményéről.
3. **Haladó Bankroll Grafikonok:** Kumulatív tőkegörbe (equity curve) vizualizáció és drawdown kalkuláció a Tétnaplóban.
