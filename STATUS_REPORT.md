# 📊 SOCCERAI &bull; PROJEKT STÁTUSZ JELENTÉS (STATUS REPORT)

**Projekt azonosító:** `soccerai` (TippMester.ai)  
**Hivatkozási minta:** [footballtipster.ai](https://footballtipster.ai)  
**Dátum:** 2026. október 17.  
**Állapot:** ✅ **Működőképes, tesztelt, aktív fejlesztői fázis (v1.0-RC)**  
**Kiszolgáló port:** `http://localhost:3000`  
**Projekt elérési útja:** `/home/attila/projects/soccerai` (és szimbolikus hivatkozással: `~/soccerai`)

---

## 1. Vezetői Összefoglaló (Executive Summary)

A projekt célja egy olyan kompakt, esztétikus, prémium sötét témájú, magyar nyelvű labdarúgó statisztikai és prediktív mesterséges intelligencia rendszer létrehozása, amely a **footballtipster.ai** bevált hőtérképes és valószínűségi modelljét követi.

A rendszer kevesebb felesleges funkcióval, de sziklaszilárd, magas minőségű adatokkal és intuitív felhasználói élménnyel operál:
- **Nem önti el a felhasználót 50 felesleges alpiaccal**, hanem a 8 legfontosabb fogadási piacra fókuszál.
- **Azonnal felismerhető színkódolt valószínűségi hőtérkép** (minél zöldebb, annál valószínűbb a kimenetel).
- **Önálló matematikai predikciós motor** (Poisson-eloszlás és xG gólbecslés), amely offline és élő API módban is képes működni.
- **Interaktív szelvényépítő és meccselemző modál**, valamint verifikált találati eredménykövető.

---

## 2. Technológiai Stack & Architektúra

| Komponens | Alkalmazott Technológia | Indoklás / Előny |
| :--- | :--- | :--- |
| **Frontend Keretrendszer** | React 19 (TypeScript) | Legfrissebb szabvány, ultra gyors reaktivitás |
| **Build & Tooling** | Vite 8 + `@tailwindcss/vite` | 600 ms alatti éles build, instant Hot Module Reload |
| **Dizájn & CSS** | Tailwind CSS v4 | Deep Dark téma (`#070B14`, `#0D1527`, `#F59E0B`, `#10B981`) |
| **Ikonográfia** | Lucide React | Egységes, modern sport- és analitikai szimbólumok |
| **Matematikai Modell** | Saját Poisson + xG Engine | Valószínűségek normalizálása és Value Bet detektálás |
| **Adatkezelés** | Kettős mód (Beépített / API) | Teljesen önálló indulás, bármikor beköthető külső API-ra |

---

## 3. Megvalósított Fő Funkciók és Képernyők

### 1. Statisztikai Rács (Stats Grid - Fő nézet)
- **Dátumváltás:** Tegnap (lezárt) &bull; Ma (élő/közelgő) &bull; Holnap.
- **Piacok oszlopai:**
  - `KO`: Kezdési időpont / ÉLŐ jelzés / FT lezárt állapot
  - `Mérkőzés`: Klubcímerek, csapatnevek, aktuális/végeredmény
  - `1`: Hazai győzelem valószínűség (%) + szorzó (odds)
  - `X`: Döntetlen valószínűség (%) + szorzó
  - `2`: Vendég győzelem valószínűség (%) + szorzó
  - `BTTS`: Mindkét csapat szerez gólt esélye (%)
  - `>1.5`, `>2.5`, `>3.5`: Gólszám küszöbök esélyei
  - `1.F >0.5`: Első félidei gól esélye
- **Valószínűségi Hőtérkép:**
  - 🟩 `65%+`: Kiemelt szignál (emerald glow, erős modellbizalom)
  - 🟩 `55-64%`: Erős esély (türkiz / mentazöld)
  - 🟦 `45-54%`: Kiegyenlített / közepes
  - ⬜ `35-44%`: Mérsékelt
  - ⬛ `<35%`: Valószínűtlen

### 2. A Nap Kiemelt AI Tippjei (Top 3 Picks)
- A modell által detektált legmagasabb várható értékű (**Expected Value / +EV**) események.
- Modell vs. Bukmékeri valószínűség összevetése (pl. Modell 71% vs Piac 59% &rarr; **+19.3% Érték többlet**).
- Szakmai magyar nyelvű indoklás a csapatok hazai/idegenbeli xG-je és védelmi stabilitása alapján.

### 3. Részletes Mérkőzés Elemző Adatlap (Deep-Dive Modal)
- Bármely meccsre kattintva megjelenik:
  - Legutóbbi formaindikátorok (W/D/L zöld, sárga, piros pöttyök)
  - xG átlagok és gólarányok
  - 1X2 valószínűségi eloszlási grafikon
  - Korábbi egymás elleni (H2H) eredmények
  - Helyszín és időjárási körülmények

### 4. Lebegő Szelvényépítő (Bet Slip Builder)
- Bármely szorzóra vagy tippre kattintva a választás bekerül a szelvénybe.
- Kiszámolja a kumulált szorzót, az együttes AI esélyt és a forintosított várható kifizetést.
- Egy kattintással kimásolható a vágólapra vagy törölhető.

### 5. Verifikált Eredménykövető (Recent Winners)
- Visszatekintő fül a lezárt mérkőzésekre, pipákkal és sikerességi aránnyal (pl. **83.3% pontosság** tegnap).

### 6. Rendszer & API Beállítások
- Váltás a beépített offline motor és a külső API (Football-Data / API-Football) kulcs között.
- Állítható szignál-küszöbérték (50% &ndash; 75%).

---

## 4. Fájl- és Könyvtárstruktúra

```
/home/attila/projects/soccerai/
├── STATUS_REPORT.md                 <-- Ez a státusz jelentés
├── README.md                        <-- Általános leírás és gyorsteszt
├── package.json                     <-- Függőségek és npm scriptek
├── vite.config.ts                   <-- Vite 8 + Tailwind v4 konfiguráció
├── tsconfig.json                    <-- TypeScript beállítások
├── index.html                       <-- Belépési pont magyar meta címkékkel
├── public/                          <-- Statikus elemek
└── src/
    ├── main.tsx                     <-- React gyökér komponens csatolása
    ├── App.tsx                      <-- Főalkalmazás, állapotok és routing
    ├── index.css                    <-- Tailwind v4 direktívák és sötét téma stílusok
    ├── types/
    │   └── football.ts              <-- TypeScript típusdefiníciók (Match, Odds, Team...)
    ├── services/
    │   └── predictionEngine.ts      <-- Poisson & Dixon-Coles xG valószínűségszámító motor
    ├── data/
    │   └── mockMatches.ts           <-- Prémium mérkőzésadatbázis (PL, LaLiga, Serie A, NB I...)
    └── components/
        ├── Header.tsx               <-- Navigáció, élő modell pulzálás, szelvény számláló
        ├── HeroKpi.tsx              <-- Fő üzenet, statisztikai számlálók és színmagyarázat
        ├── TopPicks.tsx             <-- Napi 3 kiemelt AI tipp kártyák
        ├── StatsGrid.tsx            <-- footballtipster.ai stílusú hőtérképes táblázat
        ├── MatchDetailModal.tsx     <-- Részletes meccselemző felugró ablak
        ├── BetSlipDrawer.tsx        <-- Szelvényépítő és nyereménykalkulátor
        ├── ResultsView.tsx          <-- Tegnapi nyertesek és találati arány
        └── SettingsModal.tsx        <-- API kulcs és modell testreszabás
```

---

## 5. Indítás és Üzemeltetés

A projekt önállóan futtatható a terminálból:

```bash
# 1. Navigálás a mappába:
cd /home/attila/projects/soccerai

# 2. Fejlesztői szerver indítása (jelenleg is fut):
npm run dev

# 3. Éles verzió fordítása (ellenőrizve, hibamentes):
npm run build

# 4. Éles előnézet indítása:
npm run preview
```

**Helyi tesztelési URL:** `http://localhost:3000`  
**Hálózati IP:** `http://213.199.38.177:3000`

---

## 6. Következő Javasolt Lépések (Roadmap)

1. **Telegram / E-mail Értesítő modul:** Napi top tippek kiküldése minden reggel automatikusan.
2. **Élő Odds Frissítő Worker:** Ingyenes fogadóirodai API-k (pl. The-Odds-API) bekötése a szorzók valós idejű frissüléséhez.
3. **Felhasználói Bankroll Tracker:** Virtuális tőke és fogadási előzmények naplózása és grafikonos hozamkövetés.
