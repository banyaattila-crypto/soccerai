# ⚽ SoccerAI PRO &bull; Magyar Nyelvű Futball Analitikai & Esély Platform

> Prémium sötét témájú, kompakt és adatvezérelt magyar nyelvű kvantitatív labdarúgó statisztikai és prediktív hőtérképes rendszer.

- 🌐 **Élő Vercel URL:** [https://soccerai-pro.vercel.app](https://soccerai-pro.vercel.app)
- 🐙 **GitHub Repository:** [https://github.com/banyaattila-crypto/soccerai](https://github.com/banyaattila-crypto/soccerai)
- 💻 **Helyi Fejlesztői Szerver:** `http://localhost:3000`

---

## 🌟 Főbb Jellemzők

1. **Színkódolt Valószínűségi Rács (Stats Grid & Fókuszpiacok)**:
   - Valószínűségi hőtérkép a mérkőzések kulcspiacaira: **1X2 (Hazai / Döntetlen / Vendég)**, **Mindkét csapat szerez gólt (BTTS)**, **>1.5, >2.5, >3.5 gólok**, és **1. félidő >0.5 gól**.
   - Fókuszpiac választó: `[I] Mindent elemezz`, `[A] Over/Under 2.5`, `[B] BTTS`, `[G] 1X2`, `[D] 1.F Over 0.5`, `[C] Over 1.5`.
   - Minél zöldebb egy cella, annál magasabb a matematikai valószínűsége (65%+ kiemelt szignál glow-val, 55-64% erős esély, 45-54% közepes, stb.).
   - Dinamikus dátumválasztó tabok: **Tegnap (Lezárt)** &bull; **Ma (Élő / Közelgő)** &bull; **Holnap**.
   - Dinamikus bajnokság szűrés, szabadszavas csapatkeresés és "Csak 60%+ kiemelt jelek".
   - Mobilbarát érintésvezérlés (`touch-pan-x` és overscroll elszigetelés), stabil és nem csúszik ki a képernyőből.

2. **Kvantitatív Elemző & Értékszűrő Motor**:
   - **Dixon–Coles (1997)** korrigált bivariáns Poisson modell ($\rho = -0.13$).
   - **Shin (1992)** de-vigging: bukmékeri árrés (margin %) kiszámítása és a valódi fair oddsok meghatározása.
   - **$\lambda$-rács robusztussági szűrés**: a kimenetelek stabilitásának tesztelése ($\min(e) > +2\%$).
   - **$\lambda$-inverzió**: a piac által implicit árazott gólvárakozás visszafejtése bisection algoritmussal.
   - **Negyed-Kelly (Quarter-Kelly)** tétméretezés a konzervatív bankroll-menedzsmenthez.

3. **A Nap Kiemelt AI Tippjei (Top 3 Picks)**:
   - A napi mérkőzéskínálatból automatikusan kiválasztott, robusztus várható értékű (**+EV / Value Bet**) ajánlások.
   - Modell valószínűség vs Piaci odds összehasonlítás, részletes magyar nyelvű szakmai indoklás és megbízhatósági pontszám.

4. **Részletes Meccselemző Adatlap (Match Deep-Dive Modal)**:
   - A mérkőzések sorára kattintva felugró részletes elemzés:
     - Adatminőség besorolás (A/B/C szint)
     - Csapatok legutóbbi formája (W/D/L indikátorok)
     - xG (várható gólok) átlagok és gólstatisztikák
     - Helyszín és korábbi egymás elleni (H2H) eredmények
     - Teljes kvantitatív kimutatás (Shin margin, robusztussági ítélet, Kelly tét)

5. **Interaktív Szelvényépítő (Bet Slip Builder)**:
   - A táblázat celláira vagy a kiemelt tippekre kattintva a tippek azonnal a szelvényhez adódnak.
   - Automatikusan kalkulálja a kumulált eredő oddsot, az együttes AI valószínűséget és a várható nyereményt (HUF).

6. **Élő API Szinkronizáció & Kettős Gyorsítótár (Rate-Limit Védelem)**:
   - **Football-Data.org API**: Éles token integrációval az összes európai bajnokság rangadóira.
   - **Kliensoldali 5 perces gyorsítótár (localStorage)**: Az oldal újratöltésekor 0 API hívás, garantált védelem a percenkénti limit ellen.
   - **Vercel Serverless Function proxy (`/api/matches`)**: 60 másodperces CDN Edge cache-sel és CORS feloldással.
   - **10 perces intelligens háttérfrissítés**: Csak aktív/látható böngészőfül mellett frissít automatikusan.

---

## 🚀 Futtatás és Használat

A projekt a `/home/attila/projects/soccerai` könyvtárban található.

```bash
cd /home/attila/projects/soccerai

# Fejlesztői szerver indítása (a háttérben fut a 3000-es porton):
npm run dev

# Éles build készítése:
npm run build

# Éles build előnézete:
npm run preview
```

Elérési címek:
- **Helyi böngészőből**: `http://localhost:3000`
- **Éles Vercel telepítés**: `https://soccerai-pro.vercel.app`

---

## 🛠 Technológiai Stack

- **Frontend**: React 19 + TypeScript + Vite 8
- **Stílus & Téma**: Tailwind CSS v4 (Deep Dark Obsidian `#070B14`, Arany `#F59E0B`, Smaragd `#10B981`)
- **Ikonkészlet**: Lucide React + Egyedi 3D Vektor Labda Logó (`Logo.tsx`)
- **Modellezés**: Dixon–Coles korrigált Poisson, Shin de-vigging, λ-inverzió, Negyed-Kelly
