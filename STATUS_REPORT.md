# SoccerAI PRO: Projekt státusz jelentés

**Projekt:** `soccerai` (SoccerAI PRO)
**Aktuális verzió:** `v1.25.0` (SemVer 2.0.0)
**Kiadás neve:** Őszinte Felület: Bizonytalanság, Szimulált Ár Jelölés, Kalibrációs Diagram és Tőkegörbe
**Dátum:** 2026. október 22.
**Állapot:** `tsc -b` 0 hiba, `oxlint --deny-warnings` 0 hiba, 219/219 teszt zöld (23 tesztfájl), production build hibátlan
**GitHub:** https://github.com/banyaattila-crypto/soccerai
**Élő URL:** https://soccerai-pro.vercel.app
**Helyi szerver:** `http://localhost:3000` (`npm run dev`)

---

## 1. Vezetői összefoglaló

A SoccerAI PRO magyar nyelvű kvantitatív futball-elemző: Dixon–Coles-alapú esélyszámítás, λ-rács robusztussági szűrő, Shin de-vig, negyed-Kelly, pre-match predikciónapló és saját bankroll-követő.

A 2026-10-22-i külső kódaudit és szimuláció megállapította, hogy a számítási gép (Poisson-mátrix, τ-korrekció, Shin, invariánsok) helyes, de **a modell bemeneti adata vékony**, ezért a jelenlegi esélyek pontossága korlátozott. A v1.25.0 a felületet igazította ehhez: a kijelzés nem állít többet, mint amit az adat megenged. A modell-javítás a következő csomag (lásd 6. fejezet).

### v1.25.0: mi változott (Design csomag)

1. **Érzékenységi sáv** a tipp-kártyákon (forgatókönyv-sáv a λ becsült hibájából, nem konfidencia-intervallum).
2. **Őszinte adatminőség-felirat:** Szezon-illesztés / Részleges illesztés / Vékony minta / Ligaátlag + prior, a meccsszámmal.
3. **Szimulált és lejárt ár jelölése:** csíkozott sáv, szaggatott/pontozott keret, egységes jelvény.
4. **Döntés-központú állapotsor és üres állapot:** ha nincs valós ár, a lista nem fogadási ajánlás; ha nincs jelölt, nincs kényszerített tipp.
5. **Megbízhatósági diagram** a Módszertanban (illusztratív mintaadat jelöléssel).
6. **Tőkegörbe és maximális drawdown** a Tétnaplóban.
7. **Akadálymentesség:** AA-közeli kontraszt a szürke szövegekre, `prefers-reduced-motion`, diagramok szöveges alternatívával.

---

## 2. Audit eredmények (2026-10-22): modell pontosság

Szintetikus 20 csapatos ligán, 20 ismétléssel mérve, az app saját illesztő és xG függvényeivel (a szimuláció nem része a repónak).

| Változat | 1X2 log-loss (kisebb a jobb) |
| :--- | :--- |
| Naiv ligaátlag | 1,0744 |
| **Az app jelenlegi adatfeltételei (3 napos ablak)** | **1,1680** |
| 380 meccs, az app jelenlegi képletével | 1,0515 |
| 380 meccs, javított skálával | 1,0464 |
| Orákulum (igaz λ) | 1,0253 |

Hatékony piacon (5% árrés) a modell által állított átlagos EV +24% és +61% között volt, a valós ROI viszont −0,4% és −4,2%.

**Korlátok:** a szimuláció szintetikus és független Poisson-világot feltételez; valós záró oddsokkal végzett backtest nem készült. A ~100 nagy klub kézi priorja (`EUROPEAN_CLUB_PRIORS`) a szimulációban nem szerepelt.

### Nyitott leletek

| ID | Súly | Probléma | Állapot |
| :--- | :--- | :--- | :--- |
| F-01 | Kritikus | A modellt a "tegnap–+2 nap" (football-data) vagy egyetlen nap (API-Sports) meccseiből illesztik | Nyitva (Adat- és modell csomag) |
| F-02 | Magas | Skála-inkonzisztencia: a fit α·β·γ-t becsül, a predikció még `avgA/avgH`-val szoroz (+21% hazai, +10% vendég gólszám) | Nyitva |
| F-03 | Magas | Az EV és a Kelly egész százalékra kerekített valószínűségből, 0,1-re kerekített xG-ből számol | Nyitva |
| F-04 | Magas | A kalibrációs "kapu" mintaadatra és szintetikus oddsra épül; a `quarterKellyRoiPct` kitalált ×1,15 | Nyitva (a UI már jelzi, hogy illusztratív) |
| F-05 | Magas | Az API-proxyk rate limitje memóriában él, `Origin` nélküli kérés engedett | Nyitva |
| F-06 | Közepes | A "tamper-evident" hash 53 bites, kulcs nélküli, kliensoldali | Nyitva |
| F-07 | Közepes | A "Hitelesített ROI" szimulált oddsra számol | Nyitva |
| F-08 | Közepes | `isFitted` már egy csapat priorjára is igaz, az adatminőség "A" lehet | Részben enyhítve (a felirat őszinte) |
| F-09 | Közepes | `rho \|\| -0.13` és `homeAdvantage \|\| 1.2` felülírja a 0 értéket | Nyitva |
| F-10 | Közepes | `MAXG=8`: nagy λ-nál a mátrix tömege vész | Nyitva |
| F-11 | Közepes | A proxy `competition=` végpontja kész, a kliens nem használja | Nyitva |
| F-12 | Közepes | A `fullTime` eredmény ET/tizenegyes esetén nem biztos, hogy 90 perces [ellenőrizendő] | Nyitva |
| F-13 | Közepes | A PIN kliensoldali képernyőzár, nem védelem | Nyitva |
| F-14 | Alacsony | `MOCK_MATCHES` a fő bundle-ben; forced auto-refresh | Nyitva |
| F-15 | Alacsony | 26 üres `catch {}`, nagy komponensek, CSP hiánya | Nyitva (a dokumentáció frissítve) |

Pontszámok (0–10): architektúra 6,5; kódminőség 6,5; funkcionális készültség 7; biztonság 5; tesztelhetőség 7,5; karbantarthatóság 5,5; dokumentáció 6 (frissítve); telepíthetőség 8. **Döntés: B, feltételesen érdemes folytatni.**

---

## 3. Technológiai stack

| Komponens | Technológia |
| :--- | :--- |
| Frontend | React 19, TypeScript ~6.0 (strict), Vite 8 |
| Stílus | Tailwind CSS v4, sötét téma |
| Tesztek | Vitest 5.0.5: 219 teszt, 23 fájl |
| Lint | Oxlint (`--deny-warnings`) |
| PWA | Web App Manifest + Service Worker (network-first navigáció) |
| Adat | Football-Data.org v4, API-Sports v3 (Vercel serverless proxyn át) |
| Tárolás | `localStorage` (bankroll, audit napló, archívum, modellek) |
| Modell | Dixon–Coles bivariáns Poisson, Shin de-vig, negyed-Kelly |

---

## 4. Fő modulok

1. **Napi Top Tippek (`TopPicks`):** λ-rács szűrőn átment jelöltek, érzékenységi sávval, adatminőség-felirattal, döntés-központú állapotsorral.
2. **Mérkőzésrács (`StatsGrid`):** UCL, UEL, UECL és 15+ bajnokság, "Csak Élő" gyorsszűrő.
3. **Meccs-részletező (`MatchDetailModal`):** szakértői magyarázat, ScoreLab H2H, 5x5 Poisson-mátrix, őszinte adatminőség.
4. **Scanner (`ScannerView`):** +EV csak valós, érvényes áron; 8 preset; liga-radar.
5. **Eredmények és audit (`ResultsView`):** pre-match, write-once napló, piaconkénti bontás.
6. **Tétnapló (`BankrollView`):** szelvények, auto-kiértékelés, **tőkegörbe és drawdown**.
7. **Módszertan (`MethodologyView`):** modell leírás, időrendhelyes kalibráció, **megbízhatósági diagram**.
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
│   ├── matches.ts                    Football-Data proxy (van `competition=` végpont is)
│   └── apisports.ts                  API-Sports proxy
└── src/
    ├── App.tsx, main.tsx, version.ts
    ├── types/football.ts
    ├── utils/                        teamUtils, dateUtils, eventBus, modelConfidence (új)
    ├── services/
    │   ├── predictionEngine.ts       Dixon–Coles mátrix, Shin, λ-rács, Kelly
    │   ├── dixonColesFitting.ts      illesztés + klub-priorok
    │   ├── calibrationService.ts     Brier, ECE, edge-kapu
    │   ├── predictionAuditService.ts pre-match napló
    │   ├── bankrollService.ts, equityCurve.ts (új)
    │   ├── footballDataApi.ts, apiSportsClient.ts, quotaService.ts
    │   ├── scannerService.ts, scoreLabService.ts, betEvaluation.ts
    │   ├── historyService.ts, pinService.ts, matchExplanationService.ts
    │   └── __tests__/                tesztcsomagok
    ├── components/
    │   ├── TopPicks, StatsGrid, MatchDetailModal, ScannerView, ResultsView
    │   ├── BankrollView, MethodologyView, SettingsModal, AboutModal
    │   ├── OddsSourceBadge, ReliabilityChart, EquityCurve   (új)
    │   └── grid/, __tests__/
    ├── hooks/useSoccerBallCanvas.ts
    └── data/mockMatches.ts
```

---

## 6. Javasolt következő csomagok

1. **Adat- és modell csomag (legnagyobb pontosság-nyereség):**
   - Teljes szezon-előzmény a meglévő `/api/matches?competition=XX&status=FINISHED` végpontról, ligánként cache-elve (F-01, F-11).
   - Egységes skála-konvenció a fitben, a predikcióban és a priorokban (F-02).
   - Lebegőpontos pipeline, kerekítés csak kijelzéskor; `MAXG` növelése; `||` helyett `??` (F-03, F-09, F-10).
   - Ellenőrzés: a szimuláció szkriptje mérjen javulást (cél: az átlag-λ az igaz ±2%-án belül; a log-loss a naiv bázis alatt).
2. **Valós backtest és kalibráció (F-04, F-07):** walk-forward backtest múltbeli szezonokon, záró oddsokkal; RPS és log-loss; a mintaadat kivezetése.
3. **Proxy- és audit-keményítés (F-05, F-06, F-13):** tartós rate limit, `Origin`/fixture ellenőrzés, HMAC-alapú szerveroldali napló, PIN-felirat pontosítása.
4. **Higiénia (F-12, F-14, F-15):** ET/tizenegyes eredménykezelés, mock lusta betöltése, üres `catch`-ek, nagy komponensek szétvágása, CSP.

---

## 7. Elérhetőségek és parancsok

```bash
npm ci          # reprodukálható telepítés
npm run dev     # fejlesztői szerver (3000)
npm test        # 219 teszt
npx tsc -b      # típusellenőrzés
npx oxlint --deny-warnings
npm run build   # production build
```

---

## 8. Korábbi főbb kiadások (rövid)

* **v1.24.x:** Szakértői meccsmagyarázat; Scanner okos alapértelmezések; összecsukható szűrők; kompakt kártyák; 300 meccses előzmény; PIN-zár.
* **v1.23.0:** StatsGrid szétbontás, TypedEventBus, biztonságos serverless proxyk.
* **v1.22.x:** Hazai előny kalibráció, időlecsengéses (xi) illesztés, első félidő modell.
* **v1.20.0:** Kvótavédelem (csúszóablak, 429 backoff), státuszkezelés, audit napló import.
* **v1.19.0:** Valós Pinnacle/Bet365 oddsok, TTL, szimulált ár esetén Value/Kelly tiltása.
* **v1.18.0:** Kanonikus xG képlet, Hare-Niemeyer 100% normalizáció, numerikus invariáns tesztek.
* **v1.17.0:** Pre-match, write-once predikciónapló.
* **v1.13–1.16:** ScoreLab, Scanner, nemzetközi kupák, 3D labda.
