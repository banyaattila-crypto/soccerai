# 📊 SOCCERAI PRO &bull; PROJEKT STÁTUSZ JELENTÉS (STATUS REPORT)

**Projekt azonosító:** `soccerai` (SoccerAI PRO)  
**Aktuális verzió:** 🏷️ **`v1.1.0`** (SemVer 2.0.0)  
**Dátum:** 2026. október 17.  
**Állapot:** ✅ **Hivatalos v1.1.0 Kiadás Élesítve (GitHub Release + Vercel)**  
**GitHub Release:** [https://github.com/banyaattila-crypto/soccerai/releases/tag/v1.1.0](https://github.com/banyaattila-crypto/soccerai/releases/tag/v1.1.0)  
**GitHub Repository:** [https://github.com/banyaattila-crypto/soccerai](https://github.com/banyaattila-crypto/soccerai)  
**Vercel Live URL:** [https://soccerai-pink.vercel.app](https://soccerai-pink.vercel.app)  
**Helyi szerver port:** `http://localhost:3000`  
**Projekt elérési útja:** `/home/attila/projects/soccerai` (és szimbolikus hivatkozással: `~/soccerai`)

---

## 1. Vezetői Összefoglaló (Executive Summary)

A **SoccerAI** egy független, professzionális, kompakt és prémium sötét témájú magyar nyelvű labdarúgó kvantitatív statisztikai és gépi tanulási predikciós platform.

A mai fejlesztési ciklusban sikeresen kiadásra került a **`v1.1.0`** éles verzió (a `v1.0.0` alapkiadásra építve):
1. **Kompakt 4 füles Dashboard felépítés (`v1.1.0`):** A hosszú függőleges görgetést megszüntetve az alkalmazás 4 szigorúan szétválasztott fülre épül: `🔥 Napi Top Tippek` (alapértelmezett nyitó fül), `📊 Mérkőzés Rács`, `🏆 Eredmények` és `📐 Módszertan`.
2. **Keskeny 1 soros Állapotsáv (`HeroKpi.tsx` — `v1.1.0`):** A korábbi ~400px magas nyitó szekciót egyetlen keskeny napi összefoglaló sáv és hőtérkép jelmagyarázat váltotta fel.
3. **Alapértelmezett Premier League szűrő & Accordion ligák (`StatsGrid.tsx` — `v1.1.0`):** A Mérkőzés Rács a Premier League mérkőzéseivel nyit, a *Minden Bajnokság* nézetben pedig a ligák fejlécére kattintva harmonika-szerűen összecsukhatók/kinyithatók a táblázatok.
4. **Dedikált Módszertan & Segédlet fül (`MethodologyView.tsx` — `v1.1.0`):** Részletes referencia fül a hőtérkép színskála, a fókuszpiacok és a 4 pilléres kvantitatív modell bemutatásával.
5. **SemVer 2.0.0 Release Manager Skill & Alkalmazáson belüli Verziókijelzés (`AboutModal.tsx`):** A fejlécben a logó mellett lévő kattintható `v1.1.0` jelvény, az Info gomb (ℹ️), a Beállítások menü és a lábléc is mutatja az éppen futó verziót és az újdonságokat.
6. **Mobil menüsor & Touch Pan védelem:** A felső navigáció kis képernyőkön sem lóg ki, a vízszintes elcsúszást globális `touch-action: pan-y; overflow-x: hidden;` védi.
7. **Bajnokság szűrés (39 mérkőzés) & 10 perces háttérfrissítés:** Minden Football-Data.org bajnokság kanonikusan szűrhető, és aktív böngészőfül esetén 10 percenként automatikusan frissül.
8. **Egyedi 3D "WOW" Focilabda Vektor Logó (`Logo.tsx`):** Fémes aranygyűrűvel és AI orbitális energiapályákkal ellátott 3D futball-labda logó.

---

## 2. Technológiai Stack & Architektúra

| Komponens | Alkalmazott Technológia | Indoklás / Előny |
| :--- | :--- | :--- |
| **Frontend Keretrendszer** | React 19 (TypeScript) | Legmodernebb reaktív komponens-architektúra |
| **Build & Tooling** | Vite 8 + `@tailwindcss/vite` | Instant HMR, 1 másodperc alatti éles fordítás |
| **Dizájn & CSS** | Tailwind CSS v4 | Deep Dark téma (`#070B14`, `#0D1527`, `#F59E0B`, `#10B981`) |
| **Logó & Vizuál** | Egyedi SVG 3D Grafika | Szemkápráztató, egyedi vektoros 3D focilabda arany peremmel |
| **Ikonográfia** | Lucide React | Letisztult, éles vonalvezetésű SVG szimbólumok |
| **Élő API Integráció** | Football-Data.org v4 API | Hivatalos fixture-ök, élő eredmények és klubcímerek |
| **API Proxy** | Vercel Serverless Function (`/api/matches`) | Teljeskörű CORS áthidalás és Edge caching |
| **Kvantitatív Modellezés** | Dixon–Coles (1997) + Shin (1992) | Professzionális korrekciók és bukmékeri de-vigging |
| **Tétméretezés** | Negyed-Kelly (Quarter-Kelly) | Túlkapás és variancia elleni konzervatív allokáció |

---

## 3. Megvalósított Kvantitatív & Funkcionális Elemek

### 1. Statisztikai Esély Rács (Stats Grid & Fókuszpiacok)
- **Fókuszpiac választó (Profi Sportelemző módszertan):**
  - `[I] Mindent elemezz` (alapértelmezett)
  - `[A] Over/Under 2.5`
  - `[B] BTTS (Mindkét csapat szerez gólt)`
  - `[G] 1X2 (Végeredmény)`
  - `[D] 1. félidő Over 0.5`
  - `[C] Over 1.5`
- **Valószínűségi Hőtérkép (8 piac):**
  - 🟩 `65%+`: Kiemelt szignál (emerald glow, erős modellbizalom)
  - 🟩 `55-64%`: Erős esély (türkiz / mentazöld)
  - 🟦 `45-54%`: Kiegyenlített / közepes
  - ⬜ `35-44%`: Mérsékelt
  - ⬛ `<35%`: Valószínűtlen
- **Dinamikus Bajnokság Szűrő:** Automatikusan kilistázza a meccseket játszó összes ligát meccsszámlálóval (pl. Premier League (7), La Liga (5), Serie A (5), Bundesliga (6), Championship (10), stb.).

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
- **Negyed-Kelly Tétméret:** $f^* = \frac{b \cdot p - (1-p)}{b} \times 0.25$ alapján.

### 4. Élő API Szinkronizáció & Kettős Gyorsítótár
- **Football-Data.org API:** Éles token integrálva (`0a2ff5ef40ed4113a0ca28d6b9b122d8`).
- **Kliensoldali Memóriacache (localStorage):** 5 perces TTL &ndash; oldalnyitáskor **0 API hívást indít**, védve a 10 kérés/perces ingyenes limitet.
- **Kényszerített frissítés:** A fejlécben elhelyezett 🔄 **"Frissítés"** gombbal kérésre azonnal frissíthetők az élő eredmények.
- **Automatikus 10 perces háttérszinkronizáció:** Csak aktív böngészőfül esetén, minimalizálva az API fogyasztást.
- **Vercel Serverless Proxy (`/api/matches`):** 60 másodperces CDN Edge cache-sel látja el a kéréseket és megszünteti a böngészős CORS korlátokat.

---

## 4. Fájl- és Könyvtárstruktúra

```
/home/attila/projects/soccerai/
├── STATUS_REPORT.md                 <-- Részletes státusz jelentés
├── README.md                        <-- Fő dokumentáció
├── package.json                     <-- Függőségek és build scriptek
├── vite.config.ts                   <-- Vite 8 + Tailwind v4 + Dev Proxy
├── tsconfig.json                    <-- TypeScript beállítások
├── index.html                       <-- Belépési pont magyar címkékkel és fontokkal
├── api/
│   └── matches.ts                   <-- Vercel Serverless CORS proxy & Edge cache
└── src/
    ├── main.tsx                     <-- React belépési pont
    ├── App.tsx                      <-- Állapotkezelés, 10 perces háttérfrissítés és nézetek
    ├── index.css                    <-- Tailwind v4, touch-pan-y, overflow-x: hidden
    ├── types/
    │   └── football.ts              <-- QuantAnalysis, FocusMarket, Match és Odds típusok
    ├── services/
    │   ├── predictionEngine.ts      <-- Dixon-Coles, Shin de-vig, λ-rács, λ-inverzió, Kelly
    │   └── footballDataApi.ts       <-- Football-Data.org kliens kanonikus ligákkal és okos cache-sel
    ├── data/
    │   └── mockMatches.ts           <-- Prémium mintaadatbázis offline módhoz (NB I-gyel)
    └── components/
        ├── Logo.tsx                 <-- Egyedi 3D WOW vektoros focilabda logó arany kerettel
        ├── Header.tsx               <-- Navigáció, 3D logó, mobil overflow védelem
        ├── HeroKpi.tsx              <-- Statisztikai számlálók és valószínűségi hőtérkép skála
        ├── TopPicks.tsx             <-- Napi 3 kiemelt tipp kvantitatív robusztussági pecséttel
        ├── StatsGrid.tsx            <-- Dinamikus ligaszűrő, dátumok, touch-pan-x táblázat
        ├── MatchDetailModal.tsx     <-- Kvantitatív elemző panel és formák
        ├── BetSlipDrawer.tsx        <-- Szelvényépítő és nyereménykalkulátor (HUF)
        ├── ResultsView.tsx          <-- Verifikált korábbi eredmények és sikerességi ráta
        └── SettingsModal.tsx        <-- API kulcs és modell testreszabás
```

---

## 5. Elérési Útvonalak

* 🌐 **Élő Vercel Weboldal:** [https://soccerai-pink.vercel.app](https://soccerai-pink.vercel.app)
* 🐙 **GitHub Repository:** [https://github.com/banyaattila-crypto/soccerai](https://github.com/banyaattila-crypto/soccerai)
* 💻 **Helyi Fejlesztői Szerver:** `http://localhost:3000`
