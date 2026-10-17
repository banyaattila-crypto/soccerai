# 📊 SOCCERAI &bull; PROJEKT STÁTUSZ JELENTÉS (STATUS REPORT)

**Projekt azonosító:** `soccerai` (TippMester.ai)  
**Hivatkozási minta:** [footballtipster.ai](https://footballtipster.ai)  
**Dátum:** 2026. október 17.  
**Állapot:** ✅ **Élesítve & Működik (Live API + Kvantitatív Dixon-Coles & Shin Modell)**  
**GitHub Repository:** [https://github.com/banyaattila-crypto/soccerai](https://github.com/banyaattila-crypto/soccerai)  
**Vercel Live URL:** [https://soccerai-pink.vercel.app](https://soccerai-pink.vercel.app)  
**Helyi szerver port:** `http://localhost:3000`  
**Projekt elérési útja:** `/home/attila/projects/soccerai` (és szimbolikus hivatkozással: `~/soccerai`)

---

## 1. Vezetői Összefoglaló (Executive Summary)

A **SoccerAI** a [footballtipster.ai](https://footballtipster.ai) modern, adatvezérelt dizájnjára és hőtérképes koncepciójára épülő, kompakt és elegáns magyar nyelvű futball analitikai platform.

A legutóbbi mérföldkő során a rendszert sikeresen kiegészítettük:
1. **Valós, élő meccsadatokkal (Football-Data.org API):** Nem csupán demó adatokkal működik, hanem a felhasználó éles API kulcsával közvetlenül szinkronizálja a napi rangadókat (pl. 39 valós meccs a Premier League, La Liga, Serie A, Bundesliga ligákból).
2. **Profi Kvantitatív Elemző Módszertannal:** A rendszerbe integráltuk a professzionális Dixon–Coles korrekciót, a Shin (1992) de-vigginget, a $\lambda$-rács robusztussági szűrőt, a $\lambda$-inverziót és a negyed-Kelly tétméretezést a fals value betek kizárása érdekében.
3. **Kettős Okos Gyorsítótárral (Smart Caching):** 5 perces kliensoldali memóriacache és 60 másodperces Vercel Edge cache védi a felhasználó API kvótáját a 10 kérés/perces limit ellen.

---

## 2. Technológiai Stack & Architektúra

| Komponens | Alkalmazott Technológia | Indoklás / Előny |
| :--- | :--- | :--- |
| **Frontend Keretrendszer** | React 19 (TypeScript) | Legmodernebb reaktív webkeretrendszer |
| **Build & Tooling** | Vite 8 + `@tailwindcss/vite` | Instant HMR, 1 másodperc alatti éles fordítás |
| **Dizájn & CSS** | Tailwind CSS v4 | Deep Dark téma (`#070B14`, `#0D1527`, `#F59E0B`, `#10B981`) |
| **Ikonográfia** | Lucide React | Letisztult, nagyfelbontású SVG szimbólumok |
| **Élő API Integráció** | Football-Data.org v4 API | Hivatalos fixture-ök, élő eredmények és klubcímerek |
| **API Proxy** | Vercel Serverless Function (`/api/matches`) | Teljeskörű CORS áthidalás és Edge caching |
| **Kvantitatív Modellezés** | Dixon–Coles (1997) + Shin (1992) | Professzionális matematikai korrekciók és de-vigging |
| **Tétméretezés** | Negyed-Kelly (Quarter-Kelly) | Túlkapás és variancia elleni konzervatív allokáció |

---

## 3. Megvalósított Kvantitatív & Funkcionális Elemek

### 1. Statisztikai Esély Rács (Stats Grid & Fókuszpiacok)
- **0. Lépés &ndash; Fókuszpiac választó (Profi Prompt módszertan):**
  - `[I] Mindent elemezz` (alapértelmezett)
  - `[A] Over/Under 2.5`
  - `[B] BTTS (Mindkét csapat szerez gólt)`
  - `[G] 1X2 (Végeredmény)`
  - `[D] 1. félidő Over 0.5`
  - `[C] Over 1.5`
  - *Kiválasztáskor a táblázat fejlécében és celláiban automatikusan aranyszínű fókuszkiemelés jelenik meg.*
- **Valószínűségi Hőtérkép (8 piac):**
  - 🟩 `65%+`: Kiemelt szignál (emerald glow, erős modellbizalom)
  - 🟩 `55-64%`: Erős esély (türkiz / mentazöld)
  - 🟦 `45-54%`: Kiegyenlített / közepes
  - ⬜ `35-44%`: Mérsékelt
  - ⬛ `<35%`: Valószínűtlen
- **Dátumváltás:** Tegnap (lezárt) &bull; Ma (élő/közelgő) &bull; Holnap.

### 2. A Nap Kiemelt AI Tippjei (Robusztus Top 3 Picks)
- **Kvantitatív szűrőn átment tippek:** Csak olyan események kerülhetnek a kiemelt válogatásba, amelyek a $\lambda$-rácson bizonyították stabilitásukat (`ROBUSZTUS` vagy `valószínű`).
- **Kártyánkénti kvantitatív sáv:**
  - `ROBUSZTUS ÉL` állapotjelző
  - `Adatminőség: A-szint / B-szint`
  - `Kelly: X.X% ajánlott bankroll tét`
- Szakmai magyar indoklás az xG mutatók és védelmi stabilitás alapján.

### 3. Részletes Kvantitatív Meccselemzés (Match Deep-Dive Modal)
- **Adatminőség szint:** `A-szint` (Top 5 liga), `B-szint` (másodosztályok), `C-szint` (gyengébb lefedettség).
- **Dixon–Coles (1997) gólmátrix:** Bivariáns korrekció alacsony gólszámú cellákra ($\rho = -0.13$).
- **Shin (1992) De-vigging:** Bukmékeri árrés (margin %) kimutatása és kedvenc-esélytelen torzítás szűrése.
- **$\lambda$-rács Robusztussági Teszt:**
  - $e = p \cdot \text{odds} - 1$ vizsgálata $\lambda_H, \lambda_A$ és $\rho$ variációk mentén.
  - Ítélet: `ROBUSZTUS` (ha $\min(e) > +2\%$) &bull; `valószínű` (ha $\ge 80\%$ pozitív él) &bull; `ELVETVE` (ha $< 50\%$).
- **$\lambda$-inverzió Gólpiac Ellenőrzés:**
  - Piac által árazott $\lambda_{\text{mkt}}$ visszaszámolása az Over/Under szorzókból bisection keresővel.
  - Nullszaldós küszöb ($\text{BE } \lambda$) összevetése a liga strukturális gólátlag sávjával.
- **Negyed-Kelly Tétméret:** $f^* = \frac{b \cdot p - (1-p)}{b} \times 0.25$ alapján.

### 4. Élő API Szinkronizáció & Kettős Gyorsítótár
- **Football-Data.org API:** Éles token integrálva (`0a2ff5ef40ed4113a0ca28d6b9b122d8`).
- **Kliensoldali Memóriacache (localStorage):** 5 perces TTL &ndash; az oldal megnyitásakor vagy újratöltésekor **0 API hívást indít**, védve a 10 kérés/perces ingyenes limitet.
- **Kényszerített frissítés:** A fejlécben elhelyezett 🔄 **"Frissítés"** gombbal kérésre azonnal frissíthetők az élő eredmények.
- **Vercel Serverless Proxy (`/api/matches`):** 60 másodperces CDN Edge cache-sel látja el a kéréseket és megszünteti a böngészős CORS korlátokat.
- **Offline / Demó Mód:** A Beállítások (⚙️) menüben bármikor egy kattintással vissza lehet váltani a beépített offline szimulációra (pl. az OTP Bank Liga / NB I meccsek teszteléséhez).

### 5. Lebegő Szelvényépítő & Eredménykövető
- Kumulált szorzó, együttes AI esély és forintosított kifizetési kalkulátor.
- Verifikált tegnapi eredmények zöld pipákkal és sikerességi aránnyal.

---

## 4. Fájl- és Könyvtárstruktúra

```
/home/attila/projects/soccerai/
├── STATUS_REPORT.md                 <-- Ez a részletes státusz jelentés
├── README.md                        <-- Fő dokumentáció élő linkekkel
├── package.json                     <-- Függőségek és build scriptek
├── vite.config.ts                   <-- Vite 8 + Tailwind v4 + Dev Proxy
├── tsconfig.json                    <-- TypeScript beállítások
├── index.html                       <-- Belépési pont magyar címkékkel és fontokkal
├── api/
│   └── matches.ts                   <-- Vercel Serverless CORS proxy & Edge cache
└── src/
    ├── main.tsx                     <-- React belépési pont
    ├── App.tsx                      <-- Állapotkezelés, API szinkronizáció és nézetek
    ├── index.css                    <-- Tailwind v4 sötét stílusok és scrollbar
    ├── types/
    │   └── football.ts              <-- QuantAnalysis, FocusMarket, Match és Odds típusok
    ├── services/
    │   ├── predictionEngine.ts      <-- Dixon-Coles, Shin de-vig, λ-rács, λ-inverzió, Kelly
    │   └── footballDataApi.ts       <-- Football-Data.org kliens okos gyorsítótárral
    ├── data/
    │   └── mockMatches.ts           <-- Prémium mintaadatbázis offline módhoz (NB I-gyel)
    └── components/
        ├── Header.tsx               <-- Navigáció, élő API státusz és azonnali Frissítés gomb
        ├── HeroKpi.tsx              <-- Statisztikai számlálók és valószínűségi hőtérkép skála
        ├── TopPicks.tsx             <-- Napi 3 kiemelt tipp kvantitatív robusztussági pecséttel
        ├── StatsGrid.tsx            <-- Hőtérképes táblázat + Fókuszpiac chipek
        ├── MatchDetailModal.tsx     <-- Kvantitatív elemző panel és formák
        ├── BetSlipDrawer.tsx        <-- Szelvényépítő és nyereménykalkulátor (HUF)
        ├── ResultsView.tsx          <-- Verifikált korábbi eredmények és sikerességi ráta
        └── SettingsModal.tsx        <-- API kulcs és modell testreszabás
```

---

## 5. Elérési Útvonalak és Parancsok

* 🌐 **Élő Vercel Weboldal:** [https://soccerai-pink.vercel.app](https://soccerai-pink.vercel.app)
* 🐙 **GitHub Repository:** [https://github.com/banyaattila-crypto/soccerai](https://github.com/banyaattila-crypto/soccerai)
* 💻 **Helyi Fejlesztői Szerver:** `http://localhost:3000`

```bash
# Projekt könyvtár:
cd /home/attila/projects/soccerai

# Fejlesztői szerver futtatása (a háttérben aktív):
npm run dev

# Éles build fordítása:
npm run build

# Éles előnézet indítása:
npm run preview
```

---

## 6. Következő Mérföldkövek (Roadmap)

1. **Játékvezető & Lapok Elemző Modul (`[K]` piac):** Játékvezetői foul/lap statisztikák integrálása rangadókra.
2. **Szöglet Analitika (`[L]` piac):** Szerzett és engedett szögletek modellezése mély blokkos és pressing csapatoknál.
3. **Automata Telegram Értesítő Bot:** Reggel 08:30-kor a robusztussági szűrőn átment Top 3 tipp kiküldése.
