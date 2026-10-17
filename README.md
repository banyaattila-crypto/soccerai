# ⚽ TippMester.ai - Magyar Nyelvű Futball Analitikai & Esély Platform

> A **[footballtipster.ai](https://footballtipster.ai)** mintájára készült kompakt, prémium sötét témájú magyar nyelvű labdarúgó statisztikai és prediktív hőtérképes rendszer.

- 🌐 **Élő Vercel URL:** [https://soccerai-pink.vercel.app](https://soccerai-pink.vercel.app)
- 🐙 **GitHub Repository:** [https://github.com/banyaattila-crypto/soccerai](https://github.com/banyaattila-crypto/soccerai)

---

## 🌟 Főbb Jellemzők

1. **Színkódolt Valószínűségi Rács (Stats Grid)**:
   - Valószínűségi hőtérkép a mérkőzések legfontosabb piacaira: **1X2 (Hazai / Döntetlen / Vendég)**, **Mindkét csapat szerez gólt (BTTS)**, **>1.5, >2.5, >3.5 gólok**, és **1. félidő >0.5 gól**.
   - Minél zöldebb egy cella, annál magasabb a matematikai valószínűsége (65%+ kiemelt szignál glow-val, 55-64% erős esély, 45-54% közepes, stb.).
   - Dátumválasztó tabok: **Tegnap (Lezárt)** &bull; **Ma (Élő / Közelgő)** &bull; **Holnap**.
   - Szűrés bajnokság szerint, szabadszavas csapatkeresés, vagy "Csak 60%+ erős jelek".

2. **A Nap Kiemelt AI Tippjei (Top 3 Picks)**:
   - A napi mérkőzéskínálatból automatikusan kiválasztott, legmagasabb várható értékű (**+EV / Value Bet**) ajánlások.
   - Modell valószínűség vs Piaci odds összehasonlítás, részletes magyar nyelvű szakmai indoklás és megbízhatósági pontszám.

3. **Részletes Meccselemző Adatlap (Match Deep-Dive Modal)**:
   - A mérkőzések sorára kattintva felugró részletes elemzés:
     - Csapatok legutóbbi formája (W/D/L indikátorok)
     - xG (várható gólok) átlagok és gólstatisztikák
     - Helyszín és időjárási viszonyok
     - Korábbi egymás elleni (H2H) eredmények

4. **Interaktív Szelvényépítő (Bet Slip Builder)**:
   - A táblázat celláira vagy a kiemelt tippekre kattintva a tippek azonnal a szelvényhez adódnak.
   - Automatikusan kalkulálja a kumulált eredő oddsot, az együttes AI valószínűséget és a várható nyereményt (HUF).
   - Egy kattintással kimásolható a vágólapra.

5. **Verifikált Múltbeli Eredmények (Recent Winners)**:
   - Visszatekintés a lezárt mérkőzésekre pipákkal és sikerességi rátával (pl. 83% pontosság).

6. **Kettős Adatforrás (Offline Szimuláció & Élő API)**:
   - **Beépített predikciós motor**: Valósághű csapatadatokkal és Poisson-eloszlású matematikai xG modellezéssel azonnal működik és tesztelhető.
   - **Külső API támogatás**: A Beállítások menüben megadható saját Football-Data.org / API-Football kulcs közvetlen élő adatokhoz.

---

## 🚀 Futtatás és Használat

A projekt a `/home/attila/projects/focitipp-ai` könyvtárban található.

```bash
cd /home/attila/projects/focitipp-ai

# Fejlesztői szerver indítása (jelenleg is fut a 3000-es porton):
npm run dev

# Éles build készítése:
npm run build

# Éles build előnézete:
npm run preview
```

Elérési címek:
- **Helyi böngészőből**: `http://localhost:3000`
- **Hálózati IP-ről**: `http://<szerver-ip>:3000`

---

## 🛠 Technológiai Stack

- **Frontend**: React 19 + TypeScript + Vite 8
- **Stílus & Téma**: Tailwind CSS v4 (Deep Dark Obsidian `#070B14`, Borostyán arany `#F59E0B`, Smaragd zöld `#10B981`)
- **Ikonkészlet**: Lucide React
- **Modellezés**: Poisson-eloszlás & Dixon-Coles xG szimulációs valószínűségszámítás
