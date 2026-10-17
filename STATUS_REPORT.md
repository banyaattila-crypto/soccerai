# 📊 SOCCERAI PRO &bull; PROJEKT STÁTUSZ JELENTÉS (STATUS REPORT)

**Projekt azonosító:** `soccerai` (SoccerAI PRO)  
**Aktuális verzió:** 🏷️ **`v1.5.0`** (SemVer 2.0.0)  
**Kiadás neve:** *PWA Támogatás & Intelligens Offline Működés*  
**Dátum:** 2026. október 17.  
**Állapot:** ✅ **Hivatalos v1.5.0 Kiadás Élesítve (GitHub Release + Vercel Production)**  
**GitHub Release:** [https://github.com/banyaattila-crypto/soccerai/releases/tag/v1.5.0](https://github.com/banyaattila-crypto/soccerai/releases/tag/v1.5.0)  
**GitHub Repository:** [https://github.com/banyaattila-crypto/soccerai](https://github.com/banyaattila-crypto/soccerai)  
**Vercel Live URL:** [https://soccerai-pink.vercel.app](https://soccerai-pink.vercel.app) (HTTP 200 OK)  
**Helyi szerver port:** `http://localhost:3000` (Vite 8 HMR)  
**Projekt elérési útja:** `/home/attila/projects/soccerai` (és szimbolikus linkkel: `~/soccerai`)

---

## 1. Vezetői Összefoglaló (Executive Summary)

A **SoccerAI** egy független, professzionális, kompakt és prémium sötét témájú magyar nyelvű kvantitatív sportelemző és gépi tanulási futball-predikciós platform.

A mai átfogó fejlesztési ciklusban mind a 4 kitűzött fő prioritás sikeresen megvalósult, verifikálásra és élesítésre került a legújabb **`v1.5.0`** kiadással bezárólag:

1. **Progresszív Webalkalmazás (PWA) Támogatás (`v1.5.0`):**
   - Hivatalos `manifest.json` `standalone` megjelenítési móddal (böngészősáv nélkül, natív alkalmazásként fut).
   - Intelligens Service Worker (`public/sw.js`) kettős stratégiával: **Cache-First** a statikus fájlokra (azonnali, 0ms betöltés), **Network-First** az élő API meccsadatokra automatikus offline tartalékkal.
   - Alkalmazáson belüli dinamikus telepítési rendszer a fejlécben (`Header.tsx`): lüktető arany **„Telepítés”** gomb böngészőben, valamint **„⚡ PWA Mód”** jelvény Standalone futáskor.
   - Vektoros és nagyfelbontású PNG ikoncsomag (`192x192`, `512x512`, `apple-touch-icon.png`, frissített 3D SVG logó).

2. **Eredmények Archívum & Virtuális ROI Kalkulátor (`v1.4.0`):**
   - Piac-specifikus szűrés és bontás: BTTS, Over 2.5, Kombinált, 1X2 és Under 2.5 külön elemezhető kategóriákkal.
   - 5 db interaktív mini-KPI kártya piacok szerinti meccsszámmal, sikerességgel és realizált ROI mutatóval.
   - Virtuális ROI és profit szimulátor 10 000 Ft-os egységtéttel számított tiszta nyereséggel (+Ft) és átlagos szorzóval.

3. **Élő Bukmékeri Oddsok & EV Elemzés (`v1.3.0`):**
   - API-Sports `/odds` végpont integráció: Pinnacle (éles záró árak), Bet365, William Hill, BetVictor valós piaci szorzói.
   - Piaci Élek és Várható Érték (+EV %) kijelzés a meccs részletezőben (`MatchDetailModal.tsx`): a Dixon–Coles fair árak összevetése a piaci szorzókkal, Shin (1992) de-vigging árrés kalkulációval.
   - 60 perces kvóta-védelmi gyorsítótár a napi API limitek megóvására.

4. **Reszponzív Mobilos Kártyanézet & Nézetváltó (`v1.2.1`):**
   - Mobilon (<768px) függőleges kártyarács (`MatchCardsList`) a vízszintes görgetés kiváltására.
   - Nézetváltó gombpár (`Táblázat 📊` / `Kártyák 🃏`) tetszőleges kézi váltáshoz.

5. **Másodosztályok & NB I Integráció (`v1.2.0`):**
   - API-Sports integráció 5 új bajnoksággal: 🇪🇸 LaLiga 2, 🇫🇷 Ligue 2, 🇮🇹 Serie B, 🇩🇪 2. Bundesliga és 🇭🇺 NB I (OTP Bank Liga).
   - Vercel Serverless API Proxy (`api/apisports.ts`) 30 perces felhő Edge gyorsítótárral.

---

## 2. Technológiai Stack & Architektúra

| Komponens | Alkalmazott Technológia | Jellemző / Előny |
| :--- | :--- | :--- |
| **Frontend Keretrendszer** | React 19 (TypeScript) | Legmodernebb reaktív komponens-architektúra |
| **Build & Tooling** | Vite 8 + `@tailwindcss/vite` | Instant HMR, 1 másodperc alatti éles fordítás |
| **Linter & Kódminőség** | Oxlint | 0 hiba, 0 figyelmeztetés |
| **Dizájn & CSS** | Tailwind CSS v4 | Deep Dark téma (`#070B14`, `#0D1527`, `#F59E0B`, `#10B981`) |
| **PWA & Offline** | Web App Manifest + Service Worker | Standalone telepíthetőség, Cache-First & Network-First |
| **Logó & Vizuál** | Egyedi 3D SVG Grafika | Orbitális energiasávos 3D focilabda arany peremmel |
| **Ikonográfia** | Lucide React | Letisztult, éles SVG szimbólumok |
| **Élő API Források** | Football-Data.org v4 + API-Sports | Top bajnokságok + Másodosztályok + NB I + Élő oddsok |
| **API Proxyk** | Vercel Serverless Functions (`/api/*`) | CORS áthidalás és Edge CDN gyorsítótárazás |
| **Kvantitatív Modellezés** | Dixon–Coles (1997) + Shin (1992) | Bivariáns Poisson mátrix ($\rho = -0.13$) és de-vigging |
| **Tétméretezés** | Negyed-Kelly (Quarter-Kelly) | Variancia-védett optimális tőkeallokáció |

---

## 3. Megvalósított Kvantitatív & Funkcionális Elemek

### 1. Statisztikai Esély Rács (Stats Grid & Fókuszpiacok)
- **Fókuszpiac választó:** `[I] Mindent elemezz`, `[A] Over/Under 2.5`, `[B] BTTS`, `[G] 1X2`, `[D] 1.F Over 0.5`, `[C] Over 1.5`.
- **Valószínűségi Hőtérkép:** 65%+ kiemelt szignál (emerald glow), 55-64% erős esély, 45-54% kiegyenlített, 35-44% mérsékelt, <35% valószínűtlen.
- **Nézetváltó:** Táblázat és Kártyanézet közötti egygombos váltás.
- **Bajnokság-összecsukás:** Bajnokságonként külön nyitható-csukható harmonika panelek szignál-számlálóval.

### 2. A Nap Kiemelt AI Tippjei (Top Picks)
- Szigorú kvantitatív szűrőn átment stabil tippek (`ROBUSZTUS` vagy `valószínű` $\lambda$-rács ítélet).
- Kártyánkénti kvantitatív sáv: stabilitás, adatminőség szint és Negyed-Kelly ajánlott bankroll tét százalékban.
- Top 3 főkártya + 6 db kompakt másodlagos kiemelt tippkártya.

### 3. Részletes Meccselemzés (Match Deep-Dive Modal)
- Dixon–Coles (1997) korrigált Poisson mátrix alacsony gólszámú cellákra ($\rho = -0.13$).
- Shin (1992) De-vigging: bukmékeri árrés (vig %) és kedvenc-esélytelen torzítás szűrése.
- $\lambda$-rács robusztussági teszt: él stabilitás vizsgálata paraméter-ingadozás mellett.
- $\lambda$-inverziós piaci gólátlag ellenőrzés bisection keresővel.
- Valós bukmékeri oddsok és pozitív várható érték (+EV %) kijelzés (Pinnacle vs Bet365 vs Legjobb piaci ár).

### 4. Eredmények Archívum & Virtuális ROI
- Befejezett mérkőzések tényleges kiértékelése (`evaluatePickWon`).
- Piaconkénti bontás (BTTS, Over 2.5, Kombinált, 1X2, Under 2.5).
- Virtuális ROI%, tiszta nyereség (+Ft) és átlagos nyertes szorzó kalkulátor 10 000 Ft egységtét alapján.

### 5. PWA & Offline Képességek
- Mobil kezdőképernyőre vagy asztali gépre telepíthető önálló webapp.
- Alkalmazáson belüli egykattintásos telepítés (`beforeinstallprompt`).
- Service Worker gyorsítótár: offline meccsmegtekintés hálózati kimaradás esetén.

---

## 4. Fájl- és Könyvtárstruktúra

```
/home/attila/projects/soccerai/
├── STATUS_REPORT.md                 <-- Aktuális projekt státusz jelentés (v1.5.0)
├── CHANGELOG.md                     <-- Keep a Changelog szabványos verziótörténet
├── README.md                        <-- Fő bemutató dokumentáció
├── package.json                     <-- v1.5.0 verzió, függőségek és scriptek
├── vite.config.ts                   <-- Vite 8 + Tailwind v4 + Dev Proxy
├── tsconfig.json                    <-- TypeScript konfiguráció
├── index.html                       <-- Belépési pont PWA meta címkékkel és ikonokkal
├── public/
│   ├── favicon.svg                  <-- 3D arany-peremes focilabda vektor ikon
│   ├── manifest.json                <-- PWA Web App Manifest konfiguráció
│   ├── sw.js                        <-- Intelligens Cache-First / Network-First Service Worker
│   └── icons/
│       ├── icon-192x192.png         <-- PWA mobil alkalmazásikon
│       ├── icon-512x512.png         <-- PWA splash screen & asztali ikon
│       └── apple-touch-icon.png     <-- iOS Safari kezdőképernyő ikon
├── api/
│   ├── matches.ts                   <-- Football-Data.org Vercel proxy & Edge cache
│   └── apisports.ts                 <-- API-Sports Vercel proxy & Edge cache
└── src/
    ├── main.tsx                     <-- React belépési pont + Service Worker regisztráció
    ├── version.ts                   <-- v1.5.0 verziókonstansok és kiadási kiemelések
    ├── App.tsx                      <-- Fő Dashboard navigáció, állapotkezelés és szinkronizáció
    ├── index.css                    <-- Tailwind v4, mobil pan védelem, scrollbar stílusok
    ├── types/
    │   └── football.ts              <-- QuantAnalysis, FocusMarket, Match és Odds típusok
    ├── services/
    │   ├── predictionEngine.ts      <-- Dixon-Coles, Shin de-vig, λ-rács, λ-inverzió, Kelly
    │   ├── footballDataApi.ts       <-- Football-Data.org API kliens és cache
    │   └── apiSportsClient.ts       <-- API-Sports kliens (másodosztályok, NB I, élő oddsok)
    ├── data/
    │   └── mockMatches.ts           <-- Prémium mintaadatbázis és archívum
    └── components/
        ├── Logo.tsx                 <-- 3D WOW vektoros focilabda logó arany kerettel
        ├── Header.tsx               <-- Navigáció, PWA telepítő gomb, PWA mód jelvény
        ├── HeroKpi.tsx              <-- Statisztikai számlálók és hőtérkép jelmagyarázat
        ├── TopPicks.tsx             <-- Napi 3 kiemelt + 6 kompakt szignál kártya
        ├── StatsGrid.tsx            <-- Táblázat és Kártyanézet, ligaszűrők, meccsek
        ├── MethodologyView.tsx      <-- Részletes módszertan, hőtérkép és modellek leírása
        ├── MatchDetailModal.tsx     <-- Kvantitatív elemzés, Poisson mátrix és odds összevetés
        ├── BetSlipDrawer.tsx        <-- Szelvényépítő és nyereménykalkulátor (HUF)
        ├── ResultsView.tsx          <-- Eredmények, piaconkénti ROI és szűrők
        ├── AboutModal.tsx           <-- Névjegy, PWA leírás és linkek
        └── SettingsModal.tsx        <-- API kulcsok és liga-engedélyezés
```

---

## 5. Elérhetőségek & Git Státusz

* 🌐 **Éles Weboldal:** [https://soccerai-pink.vercel.app](https://soccerai-pink.vercel.app)
* 🐙 **GitHub Repository:** [https://github.com/banyaattila-crypto/soccerai](https://github.com/banyaattila-crypto/soccerai)
* 🏷️ **Legfrissebb Git Tag:** `v1.5.0`
* 💻 **Helyi Fejlesztői Környezet:** `http://localhost:3000` (`npm run dev`)
* 🧹 **Kódminőség:** `oxlint` 0 hiba, 0 figyelmeztetés | `tsc -b && vite build` hibátlanul fut.

---

## 6. Javasolt Következő Lépések (Backlog a folytatáshoz)

Amikor visszatérsz, innen folytathatjuk bármelyik tetszőleges iránnyal:
1. **Web Push Értesítések:** Automatikus értesítés küldése a felhasználónak a nap legmagasabb várható értékű (+EV) meccseiről a PWA értesítési API-ján keresztül.
2. **Saját Bankroll Követő & Tétnapló:** Szelvények elmentése a böngészőbe és személyes ROI statisztika vezetése a megtett tippekről.
3. **Nemzetközi Kupák Lefedettsége:** Bajnokok Ligája (UCL) és Európa Liga (UEL) kiemelt mérkőzéseinek integrálása és szűrése.
