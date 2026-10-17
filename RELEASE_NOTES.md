# 🚀 SoccerAI PRO v1.0.0 - Hivatalos Éles Kiadás

Első stabil, produkciós kiadás (v1.0.0).

## 🌟 Főbb Újdonságok és Képességek

### 1. Kvantitatív Modellezés & Értékszűrők
- **Dixon–Coles (1997) Bivariáns Poisson korrekció** ($\rho = -0.13$) az alacsony gólszámú cellák pontosítására.
- **Shin (1992) De-vigging**: a bukmékeri árrés (margin %) és a kedvenc-esélytelen torzítás kiszűrése a tiszta valószínűségekért.
- **$\lambda$-rács Robusztussági Teszt**: szimulált paraméter-perturbációk (`ROBUSZTUS`, `valószínű`, `ELVETVE`).
- **$\lambda$-inverzió Gólpiac Ellenőrzés**: a piac által árazott gólvárható érték visszafejtése bisection keresővel.
- **Negyed-Kelly (Quarter-Kelly) Tétméretezés**: konzervatív bankroll-menedzsment ajánlások.

### 2. Valós Adatok & Védett API Integráció
- **Élő Football-Data.org API v4 integráció** éles kulccsal.
- **Kettős gyorsítótár (Rate-Limit védelem)**: 5 perces kliensoldali memória-cache (0 API hívás újratöltéskor) + 60 másodperces Vercel Edge cache.
- **Dinamikus Bajnokság-lefedettség**: 39 mai mérkőzés a Premier League, La Liga, Serie A, Bundesliga, Championship és Ligue 1 ligákból.
- **10 perces intelligens háttérfrissítés**: automatikus szinkronizáció aktív böngészőfül mellett.

### 3. Prémium Felhasználói Élmény & Mobilvédelem
- **Egyedi 3D Vektoros Focilabda Logó** (`Logo.tsx`) arany techno-gyűrűvel és AI orbitális ívekkel.
- **Mobilos Érintésvédelem**: `touch-pan-y` globális rögzítés és táblázat-szintű `touch-pan-x` + overscroll izoláció, megelőzve az oldal elcsúszását.
- **Reszponzív Alsó Gombsor**: a navigáció sosem lóg ki a képernyőből kis mobilokon sem.
- **Alkalmazáson belüli Névjegy & Verzióinformáció**: kattintható `v1.0.0` jelvény a fejlécben és a láblécben, közvetlen elérhetőséggel a release jegyzetekhez.

---

- 🌐 **Élő Vercel URL:** [https://soccerai-pink.vercel.app](https://soccerai-pink.vercel.app)
- 🐙 **GitHub Repository:** [https://github.com/banyaattila-crypto/soccerai](https://github.com/banyaattila-crypto/soccerai)
