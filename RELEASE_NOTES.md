# SoccerAI PRO v1.2.0 - API-Sports Integráció: LaLiga 2, Ligue 2, Serie B, 2. Bundesliga & NB I

A **SoccerAI PRO `v1.2.0`** kiadás egy jelentős funkcionális mérföldkő: a platform a Football-Data.org meglévő bajnokságai mellé hivatalosan bevezeti az **API-Sports (API-Football)** szolgáltató integrációját, elérhetővé téve a legnépszerűbb európai másodosztályokat és a magyar bajnokságot!

## ✨ Újdonságok (Added)
- **API-Sports (API-Football) integráció (`apiSportsClient.ts`):** Valós mérkőzésadatok lekérése hivatalos API kulccsal, Dixon–Coles és Poisson statisztikai modellezéssel.
- **5 új támogatott bajnokság:**
  - 🇪🇸 **LaLiga 2** (*Segunda División / Hypermotion*)
  - 🇫🇷 **Ligue 2** (*Francia másodosztály*)
  - 🇮🇹 **Serie B** (*Olasz másodosztály*)
  - 🇩🇪 **2. Bundesliga** (*Német másodosztály*)
  - 🇭🇺 **NB I** (*OTP Bank Liga*)
- **Vercel Serverless Proxy (`api/apisports.ts`):** 30 perces felhő oldali Edge CDN gyorsítótár a napi 100 kéréses ingyenes keret hatékony védelmére és a böngészős CORS áthidalására.
- **Kettős Gyorsítótár (Cache Guard):** A kliensoldali 45 perces memóriacache révén a napi 100 kérésből naponta legfeljebb 5-10 kérés használódik el.
- **Beállítások Másodosztály-kezelő (`SettingsModal.tsx`):** API-Sports fiókállapot (Attila Banya &bull; 100 req/day), szerkeszthető kulcsmező és egygombos ki/bekapcsoló a másodosztályú mérkőzésekhez.
- **Kombinált Mérkőzés Rács:** A felületen a főbajnokságok és másodosztályok zökkenőmentesen, egyetlen egységes táblázatban jelennek meg ligachipekkel.
