# 📊 SOCCERAI PRO &bull; PROJEKT STÁTUSZ JELENTÉS (STATUS REPORT)

**Projekt azonosító:** `soccerai` (SoccerAI PRO)  
**Aktuális verzió:** 🏷️ **`v1.9.0`** (SemVer 2.0.0)  
**Kiadás neve:** *Valódi Dixon–Coles MLE Motor & Dinamikus Csapatparaméterek*  
**Dátum:** 2026. október 18.  
**Állapot:** ✅ **v1.9.0 Verzió Elkészült & Verifikálva (Valódi MLE Illesztés, Etikai Javítások, 0 Linter Hiba)**  
**GitHub Repository:** [https://github.com/banyaattila-crypto/soccerai](https://github.com/banyaattila-crypto/soccerai)  
**Vercel Live URL:** [https://soccerai-pro.vercel.app](https://soccerai-pro.vercel.app)  
**Helyi szerver port:** `http://localhost:3000` (Vite 8 HMR)  
**Projekt elérési útja:** `/home/attila/projects/soccerai` (és szimbolikus linkkel: `~/soccerai`)

---

## 1. Vezetői Összefoglaló (Executive Summary)

A **SoccerAI PRO** egy független, professzionális, prémium sötét témájú magyar nyelvű kvantitatív sportelemző és futball-predikciós platform.

A **`v1.9.0`** kiadás az „A” útvonalnak megfelelően átfogó tudományos és etikai modernizációt valósít meg:

### Fő Megvalósítások a v1.9.0-ban:
1. **Valódi Dixon–Coles (1997) MLE Paraméter-illesztés (`dixonColesFitting.ts`):**
   - A statikus, kézzel beírt 17 csapatos `TEAM_POWER` tábla és a másodosztályok lapos konstansai véglegesen törölve lettek.
   - A csapatok támadóerejét ($\alpha_i$) és védelmi gyengeségét ($\beta_i$), valamint a hazai pálya előnyt ($\gamma$) és a $\rho$ korrekciót mostantól a szezonban ténylegesen lejátszott mérkőzésekből, iteratív Poisson Maximum Likelihood Estimation (MLE) eljárással számítja a motor.
2. **First-run Dishonesty Felszámolása (`bankrollService.ts`):**
   - Az új felhasználók tétnaplója tiszta, üres lappal (`[]`) indul: nincs automatikusan generált hamis múltbeli nyereség.
3. **Kitalált Statisztikák Törlése (`HeroKpi.tsx`, `App.tsx`):**
   - A fix „Tegnap: 83% találat” törölve lett: kizárólag valós, befejezett meccsekből számolt dinamikus sikerrátát jelenít meg, vagy transzparens modell-státuszt ad.
4. **Körkörös „+EV” Megszüntetése (`TopPicks.tsx`):**
   - A szimulált szorzókból számított önbeteljesítő „Valós érték: +X%” felirat megszűnt, a felület tiszta fair szorzót mutat.
5. **Dixon–Coles Paraméter-panel (`MatchDetailModal.tsx`):**
   - A mérkőzés részleteiben transzparensen megjelenik mindkét klub illesztett $\alpha$ és $\beta$ paramétere, a hazai előny és az illesztéshez felhasznált meccsszám.
6. **Tartós Fogadási Szelvény Tárolás (Draft Persistence, `App.tsx`):**
   - Az összeállított szelvénytervezet a böngésző tárában (`localStorage`) oldalfrissítés vagy PWA újraindítás után is megmarad.
7. **Gördíthető Beállítások Modal & Dedikált Vissza Gombok (`SettingsModal.tsx`):**
   - `max-h-[90vh]` méretezés görgethető tartalommal, és jól látható „← Vissza” navigációs gombok a fejlécben és a láblécben.
8. **Teljes Szélességű Bajnokság Választó & Görgető Nyilak (`StatsGrid.tsx`):**
   - A LaLiga után lévő ligák sem vágódnak le többé; dedikált sáv bal/jobb görgetőgombokkal és „Összes liga kibontása” több soros nézettel.
9. **Lezárult Mérkőzések Dátuma és Időpontja (`ResultsView.tsx`, `StatsGrid.tsx`, `MatchDetailModal.tsx`):**
   - Minden lezárt meccs kártyáján, a táblázatos nézetben és a részletező ablakban is közvetlenül megjelenik a lejátszás pontos naptári napja (`kickoffDate`) és kezdési időpontja (`kickoffTime`), naptár és óra ikonokkal.
10. **Színátmenetes Hátterek & Enyhe Rácsos Háló (Subtle Cyber Grid Mesh, `index.css` & komponensek):**
   - Minden felület (főoldal, sávok, kártyák, táblázatok, modális panelek, fiókok) sötét technológiai színátmenetet kapott enyhe, professzionális 24–32px-es rácsos hálóval és környezeti fényekkel (`bg-mesh-*`).

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
├── STATUS_REPORT.md                 <-- Aktuális projekt státusz jelentés (v1.9.0)
├── CHANGELOG.md                     <-- Verziótörténet v1.9.0 leírással
├── README.md                        <-- Fő bemutató dokumentáció
├── package.json                     <-- v1.9.0 verzió, függőségek és scriptek
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
    ├── version.ts                   <-- v1.9.0 verziókonstansok és kiadási kiemelések
    ├── App.tsx                      <-- Dashboard navigáció (5 fül), Bankroll szinkron
    ├── types/
    │   └── football.ts              <-- TrackedBet, BankrollSummary, Match típusok
    ├── services/
    │   ├── dixonColesFitting.ts     <-- Valódi Dixon-Coles MLE paraméter-illesztés
    │   ├── historyService.ts        <-- Tartós meccseredmény archívum kezelő
    │   ├── bankrollService.ts       <-- Bankroll menedzsment, perzisztencia, auto-settle
    │   ├── predictionEngine.ts      <-- Dixon-Coles, Shin de-vig, λ-rács, Kelly
    │   ├── footballDataApi.ts       <-- Football-Data.org API kliens & MLE integráció
    │   └── apiSportsClient.ts       <-- API-Sports kliens & élő oddsok
    └── components/
        ├── ThreeDBall.tsx           <-- 3D interaktív forgó futball-labda komponens
        ├── BankrollView.tsx         <-- Tétnapló, KPI kártyák, szelvények, kézi rögzítés
        ├── BetSlipDrawer.tsx        <-- Szelvényépítő Bankroll mentés integrációval
        ├── Header.tsx               <-- 5-fülű navigáció, élő egyenleg chip, PWA badge
        ├── HeroKpi.tsx              <-- Fő KPI sáv, 3D labda, dinamikus tegnapi mutató
        ├── StatsGrid.tsx            <-- Táblázat és Kártyanézet, ligaszűrők
        ├── TopPicks.tsx             <-- Napi kiemelt tippek és 3D kártyadöntés
        ├── ResultsView.tsx          <-- Eredmények, piaconkénti ROI és múltbeli archívum
        ├── MethodologyView.tsx      <-- Módszertan és matematikai modellek
        ├── MatchDetailModal.tsx     <-- Kvantitatív elemzés, Poisson és odds összevetés
        ├── AboutModal.tsx           <-- Névjegy, v1.9.0 infók
        └── SettingsModal.tsx        <-- API kulcsok és liga-engedélyezés
```

---

## 5. Elérhetőségek & Git Státusz

* 🌐 **Éles Weboldal:** [https://soccerai-pro.vercel.app](https://soccerai-pro.vercel.app)
* 🐙 **GitHub Repository:** [https://github.com/banyaattila-crypto/soccerai](https://github.com/banyaattila-crypto/soccerai)
* 🏷️ **Célzott Git Tag:** `v1.9.0`
* 💻 **Helyi Fejlesztői Környezet:** `http://localhost:3000` (`npm run dev`)
* 🧹 **Kódminőség:** `oxlint` 0 hiba, 0 figyelmeztetés | `tsc -b && vite build` 751ms alatt hibátlanul fut.

---

## 6. Javasolt Következő Lépések (Backlog)

1. **Nemzetközi Kupák Lefedettsége:** Bajnokok Ligája (UCL) és Európa Liga (UEL) kiemelt mérkőzéseinek integrálása és szűrése a bajnokságlistában.
2. **PWA Web Push Értesítések:** Automatikus értesítés küldése a felhasználónak a nap legmagasabb várható értékű (+EV) meccseiről és a lezárt szelvények eredményéről.
3. **Haladó Bankroll Grafikonok:** Kumulatív tőkegörbe (equity curve) vizualizáció és drawdown kalkuláció a Tétnaplóban.
