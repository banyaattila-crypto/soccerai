# 📊 SOCCERAI PRO &bull; PROJEKT STÁTUSZ JELENTÉS (STATUS REPORT)

**Projekt azonosító:** `soccerai` (SoccerAI PRO)  
**Aktuális verzió:** 🏷️ **`v1.2.1`** (SemVer 2.0.0)  
**Dátum:** 2026. október 17.  
**Állapot:** ✅ **Hivatalos v1.2.1 Kiadás Élesítve (GitHub Release + Vercel)**  
**GitHub Release:** [https://github.com/banyaattila-crypto/soccerai/releases/tag/v1.2.1](https://github.com/banyaattila-crypto/soccerai/releases/tag/v1.2.1)  
**GitHub Repository:** [https://github.com/banyaattila-crypto/soccerai](https://github.com/banyaattila-crypto/soccerai)  
**Vercel Live URL:** [https://soccerai-pink.vercel.app](https://soccerai-pink.vercel.app)  
**Helyi szerver port:** `http://localhost:3000`  
**Projekt elérési útja:** `/home/attila/projects/soccerai` (és szimbolikus hivatkozással: `~/soccerai`)

---

## 1. Vezetői Összefoglaló (Executive Summary)

A **SoccerAI** egy független, professzionális, kompakt és prémium sötét témájú magyar nyelvű labdarúgó kvantitatív statisztikai és gépi tanulási predikciós platform.

A mai fejlesztési ciklusban kiadásra került a **`v1.2.1`** javító és reszponzivitási kiadás:
1. **Mobilos Kompakt Kártyanézet (`MatchCardsList` — `v1.2.1`):** Mobilon a széles táblázat helyett függőleges kártyák jelennek meg, megszüntetve a kötelező vízszintes görgetést.
2. **Nézetváltó gombpár (`StatsGrid.tsx` — `v1.2.1`):** `Táblázat 📊` vs `Kártyák 🃏` azonnali egygombos váltás.
3. **API-Sports (API-Football) integráció (`v1.2.0`):** Hivatalos szolgáltatói integráció éles API kulccsal és kvóta-védelemmel.
4. **5 új másodosztályú és hazai liga (`v1.2.0`):** 🇪🇸 LaLiga 2, 🇫🇷 Ligue 2, 🇮🇹 Serie B, 🇩🇪 2. Bundesliga és 🇭🇺 NB I (OTP Bank Liga) &ndash; ma összesen közel 60 valós mérkőzés érhető el!
5. **Vercel Serverless Proxy & Kettős Cache (`api/apisports.ts` — `v1.2.0`):** 30 perces Edge CDN és 45 perces memóriacache védi a napi 100 kéréses keretet.
6. **Valós eredménykiértékelés (`evaluatePickWon` — `v1.1.1`):** A tényleges gólokból számolt modellsikeresség.
7. **Diverzifikált piackiválasztó motor (`v1.1.1`):** BTTS, Over 2.5, BTTS & Over, 1X2 és Under 2.5 piacok versenyeztetése.
8. **Kompakt 4 füles Dashboard felépítés (`v1.1.0`):** Napi Top Tippek (alapértelmezett), Mérkőzés Rács, Eredmények és Módszertan.
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
