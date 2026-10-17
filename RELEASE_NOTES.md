# SoccerAI PRO v1.1.0 - Kompakt 4 Füles Dashboard, Premier League Szűrő és Módszertan Nézet

A **SoccerAI PRO `v1.1.0`** kiadás egy jelentős felhasználói élmény (UX) és elrendezésbeli fejlesztést hoz: a korábbi hosszú, egymás alá fűzött főoldalt egy **villámgyorsan áttekinthető, 4 füles kompakt Dashboard** váltotta fel, amely több mint 70%-kal csökkenti a függőleges görgetést.

## ✨ Újdonságok (Added)
- **4 önálló, szigorúan szétválasztott fül (`Header.tsx`, `App.tsx`):**
  1. **🔥 Napi Top Tippek (alapértelmezett nyitó fül):** Csak a Top 3 Robusztus AI Főtippet jeleníti meg egy sorban, alatta pedig legfeljebb 6 db kompakt kártyán a további erős (60%+) szignálokat — a teljes táblázat duplikálása nélkül.
  2. **📊 Mérkőzés Rács:** Azonnal a szűrősávval és a hőtérkép táblázattal indul.
  3. **🏆 Eredmények:** Verifikált múltbeli tippek és találati arány statisztika.
  4. **📐 Módszertan & Segédlet (`MethodologyView.tsx`):** Dedikált referencia fül a hőtérkép színskála, a fókuszpiacok és a 4 pilléres kvantitatív modell (Dixon–Coles, Shin de-vigging, $\lambda$-rács robusztusság, Negyed-Kelly) magyarázatával.
- **Összecsukható (Accordion) bajnokság-panelek (`StatsGrid.tsx`):** A *Minden Bajnokság* nézetben a ligák fejlécére kattintva egyenként összecsukhatók és kinyithatók a táblázatok, ligánkénti erős szignál-számlálóval.

## 🔄 Változások (Changed)
- **Keskeny, 1 soros Állapotsáv & Hőtérkép Jelmagyarázat (`HeroKpi.tsx`):** A korábbi magas nyitóblokk helyett egyetlen keskeny sáv mutatja a napi összefoglalót (`Ma: X meccs • Y bajnokság • Z kiemelt jel`) és a hőtérkép színkódjait.
- **Alapértelmezett Premier League szűrő (`StatsGrid.tsx`):** A *Mérkőzés Rács* fül alapértelmezés szerint a **🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League** meccseivel nyit (ha az adott napon nincs PL-mérkőzés, automatikusan átvált az összes ligára).
