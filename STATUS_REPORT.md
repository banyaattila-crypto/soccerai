# SoccerAI PRO: Projekt státusz jelentés

**Projekt:** `soccerai` (SoccerAI PRO)
**Aktuális verzió:** `v1.26.0` (SemVer 2.0.0)
**Kiadás neve:** Szezon-alapú Modell: Pontosabb Esélyek
**Dátum:** 2026. október 22.
**Állapot:** `tsc -b` 0 hiba, `oxlint --deny-warnings` 0 hiba, 234/234 teszt zöld (25 tesztfájl), production build hibátlan
**GitHub:** https://github.com/banyaattila-crypto/soccerai
**Élő URL:** https://soccerai-pro.vercel.app
**Helyi szerver:** `http://localhost:3000` (`npm run dev`)

---

## 1. Vezetői összefoglaló

A SoccerAI PRO magyar nyelvű kvantitatív futball-elemző: Dixon–Coles-alapú esélyszámítás, λ-rács robusztussági szűrő, Shin de-vig, negyed-Kelly, pre-match predikciónapló és saját bankroll-követő.

A 2026-10-22-i külső kódaudit megállapította, hogy a számítási gép helyes, de a modell bemeneti adata vékony volt. Két lépésben reagáltunk:

- **v1.25.0 (Design csomag):** a felület nem állít többet, mint amit az adat megenged: érzékenységi sáv, őszinte adatminőség-felirat, szimulált ár jelölése, döntés-központú állapotsor, megbízhatósági diagram, tőkegörbe, akadálymentesség.
- **v1.26.0 (Adat- és modell csomag):** a modell a teljes szezon-előzményből tanul, egységes a skála, az EV kerekítetlen valószínűséggel számol, a gólmátrix 12x12, és egynapos mintából többé nem készül "illesztett" modell.

**Nyitott feltétel:** a v1.26.0 szezon-lekérését és a `regularTime` mező meglétét az élő API-n még nem ellenőriztük (a változat deploy-a előtt). Az első telepítés után ellenőrizendő: a modellek létrejönnek-e ligánként, és hány kérés fogy a 10/perc keretből.

---

## 2. Audit eredmények (2026-10-22): modell pontosság

Szintetikus 20 csapatos ligán, 40 ismétléssel mérve, az app saját illesztő és xG függvényeivel. A szimulációs szkript nem része a repónak; a `dixonColesAccuracy.test.ts` kisebb, determinisztikus változata része a tesztcsomagnak.

| Változat | 1X2 log-loss (kisebb a jobb) |
| :--- | :--- |
| Naiv ligaátlag | 1,0751 |
| Illesztés 30 meccsből | 1,0800 (rosszabb a ligaátlagnál) |
| Illesztés 60 meccsből | 1,0692 |
| Illesztés 190 meccsből | 1,0466 |
| **Illesztés 380 meccsből (v1.26.0)** | **1,0382** |
| Orákulum (igaz λ) | 1,0217 |

A v1.25.0-ig a modell 3 napos ablakból illeszkedett (a szimulációban rosszabb a ligaátlagnál) és +21% / +10%-kal túlbecsülte a gólszámot. A v1.26.0 az átlagos várható gólt az igaz érték 1%-án belülre hozta.

**Fontos, és nem változott:** hatékony piacon (5% árrés) a valós ROI minden változatnál kb. −5%, miközben a modell átlagosan +18% … +47% EV-t állít. A pontosabb illesztés a valószínűségeket javítja, de az "élt" nem teremti meg. Az "igazolt piaci előny" állítás ezért tiltva marad.

**Korrekció:** az audit első szimulációjában a szimulált "piac" más ρ-val készült, mint a szimulált világ, ezért az ott közölt ROI-számok (−0,4% … −4,2%) torzítottak voltak. A fenti következtetés a javított szimulációból származik.

**Korlátok:** a szimuláció szintetikus és független Poisson-világot feltételez; valós záró oddsokkal végzett backtest nem készült. A ~100 nagy klub kézi priorja (`EUROPEAN_CLUB_PRIORS`) a szimulációban nem szerepelt.

### Leletek állapota

| ID | Súly | Probléma | Állapot |
| :--- | :--- | :--- | :--- |
| F-01 | Kritikus | A modellt 3 napos ablakból illesztették | Javítva (v1.26.0); élő ellenőrzés hátra |
| F-02 | Magas | Skála-inkonzisztencia (+21% / +10% gólszám) | Javítva (v1.26.0) |
| F-03 | Magas | Az EV és a Kelly egész %-ból számolt | Javítva (v1.26.0) |
| F-04 | Magas | A kalibrációs kapu mintaadatra és szintetikus oddsra épül; kitalált ×1,15 Kelly-ROI | Nyitva (a UI jelzi, hogy illusztratív) |
| F-05 | Magas | Proxy rate limit memóriában, `Origin` nélküli kérés engedett | Nyitva |
| F-06 | Közepes | A "tamper-evident" hash 53 bites, kulcs nélküli, kliensoldali | Nyitva |
| F-07 | Közepes | A "Hitelesített ROI" szimulált oddsra számol | Nyitva |
| F-08 | Közepes | `isFitted` már a kézi priorra is igaz volt | Javítva (v1.26.0) |
| F-09 | Közepes | `\|\|` felülírta a 0 értékű ρ-t és hazai előnyt | Javítva (v1.26.0) |
| F-10 | Közepes | `MAXG=8`: nagy λ-nál a mátrix tömege vész | Javítva (v1.26.0, 12x12) |
| F-11 | Közepes | A proxy `competition=` végpontját a kliens nem használta | Javítva (v1.26.0) |
| F-12 | Közepes | A `fullTime` ET/tizenegyes esetén nem 90 perces | Javítva a kódban (`regularTime`); élő ellenőrzés hátra |
| F-13 | Közepes | A PIN kliensoldali képernyőzár, nem védelem | Nyitva |
| F-14 | Alacsony | `MOCK_MATCHES` a fő bundle-ben; forced auto-refresh | Nyitva |
| F-15 | Alacsony | 26 üres `catch {}`, nagy komponensek, CSP hiánya | Nyitva |

Pontszámok (0–10): architektúra 6,5; kódminőség 6,5; funkcionális készültség 7; biztonság 5; tesztelhetőség 8; karbantarthatóság 5,5; dokumentáció 6; telepíthetőség 8. **Döntés: B, feltételesen érdemes folytatni.**

---

## 3. Technológiai stack

| Komponens | Technológia |
| :--- | :--- |
| Frontend | React 19, TypeScript ~6.0 (strict), Vite 8 |
| Stílus | Tailwind CSS v4, sötét téma |
| Tesztek | Vitest 5.0.5: 234 teszt, 25 fájl |
| Lint | Oxlint (`--deny-warnings`) |
| PWA | Web App Manifest + Service Worker (network-first navigáció) |
| Adat | Football-Data.org v4 (ingyenes csomag, 10 kérés/perc), API-Sports v3, Vercel serverless proxy |
| Tárolás | `localStorage` (bankroll, audit napló, archívum, modellek) |
| Modell | Dixon–Coles bivariáns Poisson (μ, γ, α, β, ρ), Shin de-vig, negyed-Kelly |

### Modell röviden (v1.26.0)

- λ_hazai = μ · γ · α_i · β_j; λ_vendég = μ · α_j · β_i. α és β átlaga 1,0; μ a liga gólszintje, γ a hazai előny (1,05–1,7).
- Bayes-i regularizáció (K=14) az 1,0 felé; ρ kis mintán a −0,10 felé húz.
- Időlecsengés: ξ = 0,0025/nap. Illesztés legalább 60 meccsből, szükség esetén az előző szezon bevonásával.
- Modell-cache 24 óra (`soccerai_dc_model_v2_*`), hibacache 6 óra, 15 mp időkeret az első betöltésnél.

---

## 4. Fő modulok

1. **Napi Top Tippek (`TopPicks`):** λ-rács szűrőn átment jelöltek, érzékenységi sávval, adatminőség-felirattal, döntés-központú állapotsorral.
2. **Mérkőzésrács (`StatsGrid`):** UCL, UEL, UECL és 15+ bajnokság, "Csak Élő" gyorsszűrő.
3. **Meccs-részletező (`MatchDetailModal`):** szakértői magyarázat, ScoreLab H2H, Poisson-mátrix, őszinte adatminőség.
4. **Scanner (`ScannerView`):** +EV csak valós, érvényes áron (kerekítetlen valószínűséggel); 8 preset; liga-radar.
5. **Eredmények és audit (`ResultsView`):** pre-match, write-once napló, piaconkénti bontás.
6. **Tétnapló (`BankrollView`):** szelvények, auto-kiértékelés, tőkegörbe és drawdown.
7. **Módszertan (`MethodologyView`):** modell leírás, időrendhelyes kalibráció, megbízhatósági diagram.
8. **PWA:** offline védelem, frissítés-értesítő.

---

## 5. Fájlstruktúra (főbb elemek)

```
soccerai/
├── STATUS_REPORT.md, CHANGELOG.md, README.md, RELEASE_NOTES.md
├── package.json, vite.config.ts, tsconfig*.json, index.html
├── scripts/verifyBrowser.mjs         Headless Chromium CDP ellenőrzés
├── public/                           manifest, sw.js, ikonok, labda-textúrák
├── api/
│   ├── matches.ts                    Football-Data proxy (`competition`, `season`, `status`)
│   └── apisports.ts                  API-Sports proxy
└── src/
    ├── App.tsx, main.tsx, version.ts
    ├── types/football.ts
    ├── utils/                        teamUtils, dateUtils, eventBus, modelConfidence
    ├── services/
    │   ├── predictionEngine.ts       Dixon–Coles mátrix (MAXG=12), Shin, λ-rács, Kelly
    │   ├── dixonColesFitting.ts      μ/γ/α/β/ρ illesztés + klub-priorok
    │   ├── seasonHistory.ts          szezon-előzmény, modell-előkészítés, 90 perces eredmény
    │   ├── calibrationService.ts     Brier, ECE, edge-kapu
    │   ├── predictionAuditService.ts pre-match napló
    │   ├── bankrollService.ts, equityCurve.ts
    │   ├── footballDataApi.ts, apiSportsClient.ts, quotaService.ts
    │   ├── scannerService.ts, scoreLabService.ts, betEvaluation.ts
    │   ├── historyService.ts, pinService.ts, matchExplanationService.ts
    │   └── __tests__/                tesztcsomagok (köztük dixonColesAccuracy, seasonHistory)
    ├── components/                   TopPicks, StatsGrid, MatchDetailModal, ScannerView, ResultsView,
    │                                 BankrollView, MethodologyView, OddsSourceBadge, ReliabilityChart,
    │                                 EquityCurve, ...
    ├── hooks/useSoccerBallCanvas.ts
    └── data/mockMatches.ts
```

---

## 6. Javasolt következő csomagok

1. **Élő ellenőrzés és finomhangolás (azonnal a v1.26.0 deploy után):** a szezon-lekérés működése ligánként, a kérésszám a 10/perc kereten belül, a `regularTime` mező megléte kupameccseknél, az első betöltés ideje.
2. **Piaccal súlyozás és valós backtest (F-04, F-07):**
   - Valós oddsnál a modell és a de-vigelt piaci valószínűség keverése, a Kelly shrinkelt valószínűségből.
   - Walk-forward backtest múltbeli szezonokon, záró oddsokkal (RPS, log-loss, valós CLV); a mintaadat kivezetése.
   - Ez teszi lehetővé, hogy az "él" állítás egyáltalán értelmezhető legyen.
3. **Proxy- és audit-keményítés (F-05, F-06, F-13):** tartós rate limit, `Origin`/fixture ellenőrzés, HMAC-alapú szerveroldali napló, PIN-felirat pontosítása.
4. **Higiénia (F-14, F-15):** mock lusta betöltése, üres `catch`-ek, nagy komponensek szétvágása, CSP.

---

## 7. Elérhetőségek és parancsok

```bash
npm ci          # reprodukálható telepítés
npm run dev     # fejlesztői szerver (3000)
npm test        # 234 teszt
npx tsc -b      # típusellenőrzés
npx oxlint --deny-warnings
npm run build   # production build
```

---

## 8. Korábbi főbb kiadások (rövid)

* **v1.25.0:** Őszinte felület (Design csomag).
* **v1.24.x:** Szakértői meccsmagyarázat; Scanner okos alapértelmezések; összecsukható szűrők; kompakt kártyák; 300 meccses előzmény; PIN-zár.
* **v1.23.0:** StatsGrid szétbontás, TypedEventBus, biztonságos serverless proxyk.
* **v1.22.x:** Hazai előny kalibráció, időlecsengéses (xi) illesztés, első félidő modell.
* **v1.20.0:** Kvótavédelem (csúszóablak, 429 backoff), státuszkezelés, audit napló import.
* **v1.19.0:** Valós Pinnacle/Bet365 oddsok, TTL, szimulált ár esetén Value/Kelly tiltása.
* **v1.18.0:** Kanonikus xG képlet, Hare-Niemeyer 100% normalizáció, numerikus invariáns tesztek.
* **v1.17.0:** Pre-match, write-once predikciónapló.
* **v1.13–1.16:** ScoreLab, Scanner, nemzetközi kupák, 3D labda.
