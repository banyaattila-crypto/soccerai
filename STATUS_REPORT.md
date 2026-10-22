# SoccerAI PRO: Projekt státusz jelentés

**Projekt:** `soccerai` (SoccerAI PRO)
**Aktuális verzió:** `v1.27.1` (SemVer 2.0.0)
**Kiadás neve:** Backtesten Hangolt Modell-paraméterek
**Dátum:** 2026. október 22.
**Állapot:** `tsc -b` 0 hiba, `oxlint --deny-warnings` 0 hiba, 259/259 teszt zöld (27 tesztfájl), production build hibátlan
**GitHub:** https://github.com/banyaattila-crypto/soccerai
**Élő URL:** https://soccerai-pro.vercel.app
**Helyi szerver:** `http://localhost:3000` (`npm run dev`)

---

## 1. Vezetői összefoglaló

A SoccerAI PRO magyar nyelvű kvantitatív futball-elemző: Dixon–Coles-alapú esélyszámítás, λ-rács robusztussági szűrő, Shin de-vig, negyed-Kelly, pre-match predikciónapló és saját bankroll-követő.

A 2026-10-22-i külső kódaudit megállapította, hogy a számítási gép helyes, de a modell bemeneti adata vékony volt. Négy lépésben reagáltunk (időrendben):

- **v1.25.0 (Design csomag):** a felület nem állít többet, mint amit az adat megenged: érzékenységi sáv, őszinte adatminőség-felirat, szimulált ár jelölése, döntés-központú állapotsor, megbízhatósági diagram, tőkegörbe, akadálymentesség.
- **v1.26.0 (Adat- és modell csomag):** a modell a teljes szezon-előzményből tanul, egységes a skála, az EV kerekítetlen valószínűséggel számol, a gólmátrix 12x12, és egynapos mintából többé nem készül "illesztett" modell.
- **v1.27.0 (Piaccal súlyozás és valós backtest):** a pontosságot először valós piaci adaton mértük (lásd 2/B). A modell jobb a naiv gyakoriságnál, de rosszabb a záró piacnál, a nyers "+EV" jelek hozama negatív. Ezért valós szorzónál az EV és a Kelly a piaci referenciához mér, a Módszertan a valós backtestet mutatja.
- **v1.27.1 (Hangolt paraméterek):** az időlecsengés (ξ = 0,0015) és a regularizáció (K = 5) a valós backtesten hangolva; holdout log-loss 1,0004 → 0,9982. A rés a piachoz kb. 0,02 maradt.

**Élő ellenőrzések (2026-10-22):**
- **v1.26.0:** a szezon-lekérés és a `regularTime` mező működik (PL 70 + 380, CL 189 meccs; hosszabbításos kupameccseknél a `fullTime` tartalmazza a hosszabbítást, a `regularTime` a 90 percet). Az ellenőrzés hibákat talált, ezeket külön javítások zárták: részleges modell tartósulása és átmeneti hiba hibacache-be kerülése (v1.26.1); új deploy után a 10 kérés/perces keret miatt csak az első liga modellje készült el (v1.26.2: automatikus újrapróbálás); a sikertelen főliga-lekérés nem próbálkozott újra (v1.26.3).
- **v1.27.1 (jelenlegi):** az élő oldalon 9 ligamodell készült el 3–4 percen belül (PL 450, SA 450, PD 469, ELC 689, FL1 368, BL1 360, DED 387, BSA 309, CL 243 meccs), hibacache-be nem került liga; a 21 megjelenített meccsből 18-on teljes szezon-illesztés alapján számol a modell. A Primeira Liga az automatikus újrapróbálásra várt. Új deploy után az üres edge-cache miatt a modellek felépítése 1–4 percig tart.

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

**Korlátok:** a szimuláció szintetikus és független Poisson-világot feltételez; a valós piaci backtest a 2/B pontban van. A ~100 nagy klub kézi priorja (`EUROPEAN_CLUB_PRIORS`) a szimulációban nem szerepelt.

## 2/B. Valós walk-forward backtest (v1.27.0)

5 liga (PL, La Liga, Serie A, Bundesliga, Ligue 1), football-data.co.uk, Pinnacle záró és nyitó szorzók. Bemelegítés 2023/24, hangolás 2024/25, **holdout 2025/26 (N = 1752)**. Egy meccset csak a nála korábbi meccsekből illesztett modell jósol, kézi klub-priorok nélkül, hetente újraillesztve. Újrafuttatás: `node scripts/backtest-download.mjs`, majd `npx tsx scripts/backtest.ts` (kimenet: `docs/backtest-report.md`, `src/data/backtestReport.json`).

| Forrás (holdout, 1X2) | Log-loss | Brier | RPS |
| :--- | ---: | ---: | ---: |
| Naiv (gyakoriság) | 1,0718 | 0,6483 | 0,2293 |
| Modell (Dixon–Coles, hangolt: ξ = 0,0015, K = 5) | 0,9982 | 0,5951 | 0,2037 |
| **Piac (Pinnacle záró, Shin)** | **0,9776** | **0,5822** | **0,1976** |

- A modell valódi információt hordoz (jobb a naivnál), de **a záró piacnál rosszabb**, mind az öt ligában.
- A keverési súly hangolásakor a log-loss a modell súlyával monoton nő: az optimum 0, a modell a piachoz képest nem ad pluszinformációt.
- A nyers modell "+EV" fogadásai a nyitó Pinnacle szorzón: állított EV +18,1%, valós ROI **−12,5%** (1805 fogadás, z = −3,07, CLV −5,9%; a v1.27.0-ban, hangolás előtt: −16,0%). Minden kimenetelre fogadva −6,1% (az árrés).
- A v1.27.1 hangolása (ξ, K) a modell log-loss-át 1,0004-ről 0,9982-re javította; a rés a piachoz (0,9776) kb. 0,02 maradt. Utólagos kalibráció (döntetlen-korrekció, hőmérséklet) nem javít.
- Következmény: valós szorzónál az EV és a Kelly a piaci referenciához (Pinnacle, ennek híján az átlag) mér; az "él" így ár-előny a bukmékerek között, nem modell-előny. Piaci referencia nélküli piacra (BTTS, kombinált, félidő) nincs EV.

- Kísérletek (v1.27.1 után): a hazai/idegenbeli erősség szétválasztása rontja, a feljutó-prior nem javítja a holdout log-loss-t; részletek: `docs/backtest-experiments.md`.

**Korlátok:** egy szezon holdout (N = 1752), Pinnacle árak; az élő oddsok API-Sports bukmékerekből jönnek. BTTS-re nincs piaci adat a CSV-kben.

### Leletek állapota

| ID | Súly | Probléma | Állapot |
| :--- | :--- | :--- | :--- |
| F-01 | Kritikus | A modellt 3 napos ablakból illesztették | Javítva (v1.26.0), élőben ellenőrizve |
| F-02 | Magas | Skála-inkonzisztencia (+21% / +10% gólszám) | Javítva (v1.26.0) |
| F-03 | Magas | Az EV és a Kelly egész %-ból számolt | Javítva (v1.26.0) |
| F-04 | Magas | A kalibrációs kapu mintaadatra és szintetikus oddsra épül | Javítva (v1.27.0): a Módszertan a valós backtestet mutatja; a régi `calibrationService` függvények megmaradnak, de a nézet nem használja |
| F-05 | Magas | Proxy rate limit memóriában, `Origin` nélküli kérés engedett | Nyitva |
| F-06 | Közepes | A "tamper-evident" hash 53 bites, kulcs nélküli, kliensoldali | Nyitva |
| F-07 | Közepes | A "Hitelesített ROI" szimulált oddsra számol | Részben (v1.27.0): a felirat jelzi, hogy kalibrációs mutató, nem piaci hozam |
| F-08 | Közepes | `isFitted` már a kézi priorra is igaz volt | Javítva (v1.26.0) |
| F-09 | Közepes | `\|\|` felülírta a 0 értékű ρ-t és hazai előnyt | Javítva (v1.26.0) |
| F-10 | Közepes | `MAXG=8`: nagy λ-nál a mátrix tömege vész | Javítva (v1.26.0, 12x12) |
| F-11 | Közepes | A proxy `competition=` végpontját a kliens nem használta | Javítva (v1.26.0) |
| F-12 | Közepes | A `fullTime` ET/tizenegyes esetén nem 90 perces | Javítva (`regularTime`), élőben ellenőrizve: a mező létezik, a `fullTime` tartalmazza a hosszabbítást |
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
| Tesztek | Vitest 5.0.5: 259 teszt, 27 fájl |
| Lint | Oxlint (`--deny-warnings`) |
| Szkriptek | `tsx` (backtest és hangolás: `scripts/backtest.ts`, `scripts/backtest-tune.ts`) |
| PWA | Web App Manifest + Service Worker (network-first navigáció) |
| Adat | Football-Data.org v4 (ingyenes csomag, 10 kérés/perc), API-Sports v3, Vercel serverless proxy |
| Tárolás | `localStorage` (bankroll, audit napló, archívum, modellek) |
| Modell | Dixon–Coles bivariáns Poisson (μ, γ, α, β, ρ), Shin de-vig, negyed-Kelly |

### Modell röviden (v1.27.1)

- λ_hazai = μ · γ · α_i · β_j; λ_vendég = μ · α_j · β_i. α és β átlaga 1,0; μ a liga gólszintje, γ a hazai előny (1,05–1,7).
- Bayes-i regularizáció (K = 5, a valós backtesten hangolva) az 1,0 felé; ρ kis mintán a −0,10 felé húz.
- Időlecsengés: ξ = 0,0015/nap. Illesztés legalább 60 meccsből, szükség esetén az előző szezon bevonásával.
- Valós szorzónál az EV/Kelly a piaci referenciához (Pinnacle fair, ennek híján az átlag) mér; a modell súlya a keverékben 0 (backtest). BTTS-re, kombinált és félidős piacra nincs EV.
- Modell-cache 24 óra (`soccerai_dc_model_v2_*`), hibacache 6 óra, 15 mp időkeret az első betöltésnél.

---

## 4. Fő modulok

1. **Napi Top Tippek (`TopPicks`):** λ-rács szűrőn átment jelöltek, érzékenységi sávval, adatminőség-felirattal, döntés-központú állapotsorral.
2. **Mérkőzésrács (`StatsGrid`):** UCL, UEL, UECL és 15+ bajnokság, "Csak Élő" gyorsszűrő.
3. **Meccs-részletező (`MatchDetailModal`):** szakértői magyarázat, ScoreLab H2H, Poisson-mátrix, őszinte adatminőség.
4. **Scanner (`ScannerView`):** "+EV" csak valós, érvényes áron, a piaci referenciához mérve (ár-előny); 8 preset; liga-radar.
5. **Eredmények és audit (`ResultsView`):** pre-match, write-once napló, piaconkénti bontás.
6. **Tétnapló (`BankrollView`):** szelvények, auto-kiértékelés, tőkegörbe és drawdown.
7. **Módszertan (`MethodologyView`, `BacktestSection`):** modell leírás, valós walk-forward backtest (pontosság-táblázat, fogadási szimuláció, megbízhatósági diagram, hangolási görbe).
8. **PWA:** offline védelem, frissítés-értesítő.

---

## 5. Fájlstruktúra (főbb elemek)

```
soccerai/
├── STATUS_REPORT.md, CHANGELOG.md, README.md, RELEASE_NOTES.md
├── package.json, vite.config.ts, tsconfig*.json, index.html
├── scripts/                          verifyBrowser.mjs (CDP ellenőrzés), backtest-download.mjs, backtest.ts (walk-forward), backtest-tune.ts (ξ/K hangolás)
├── docs/backtest-report.md           a legutóbbi valós backtest jelentése
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
    │   ├── marketBlend.ts            piaccal súlyozás, piaci referencia (Pinnacle fair)
    │   ├── backtestEngine.ts         walk-forward backtest, RPS/log-loss, fogadási szimuláció
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

1. **Élő finomhangolás:** a modell-építés idejének mérése új deploy után (automatikus újrapróbálás 65 másodpercenként, legfeljebb 8 alkalommal); megfontolandó szerveroldali előmelegítés (cron).
2. **Modell-javítás a piac ellen (a backtest a mérce):** a ξ/K hangolás megvolt (v1.27.1), a hazai/idegenbeli szétválasztás és a feljutó-prior kipróbálva és elutasítva (`docs/backtest-experiments.md`). A rés a piachoz kb. 0,02 log-loss maradt, szerkezeti változtatással nem záródik. További javulás csak új információs forrástól várható (xG, felállás/sérülés); ez adatforrás-vizsgálatot igényel (elérhetőség, jogi feltételek, költség).
2/b. **Piaci valószínűség megjelenítése, ha van valós szorzó:** a legpontosabb elérhető valószínűség a de-vigelt piaci ár (modell súlya 0). Jelenleg a rács és a kártyák a modell valószínűségét mutatják akkor is, ha ismert valós szorzó; érdemes ilyenkor a piaci (konszenzus) valószínűséget megjeleníteni, "piaci ár alapján" jelöléssel. A modell ott ad hozzáadott értéket, ahol nincs piaci ár.
3. **Proxy- és audit-keményítés (F-05, F-06, F-13):** tartós rate limit, `Origin`/fixture ellenőrzés, HMAC-alapú szerveroldali napló, PIN-felirat pontosítása.
4. **Higiénia (F-14, F-15):** mock lusta betöltése, üres `catch`-ek, nagy komponensek szétvágása, CSP.

---

## 7. Elérhetőségek és parancsok

```bash
npm ci          # reprodukálható telepítés
npm run dev     # fejlesztői szerver (3000)
npm test        # 259 teszt
npx tsc -b      # típusellenőrzés
npx oxlint --deny-warnings
npm run build   # production build
```

---

## 8. Korábbi főbb kiadások (rövid)

* **v1.27.x:** Piaccal súlyozás, valós backtest, hangolt paraméterek.
* **v1.26.x:** Szezon-alapú modell, egységes skála, automatikus újrapróbálás.
* **v1.25.0:** Őszinte felület (Design csomag).
* **v1.24.x:** Szakértői meccsmagyarázat; Scanner okos alapértelmezések; összecsukható szűrők; kompakt kártyák; 300 meccses előzmény; PIN-zár.
* **v1.23.0:** StatsGrid szétbontás, TypedEventBus, biztonságos serverless proxyk.
* **v1.22.x:** Hazai előny kalibráció, időlecsengéses (xi) illesztés, első félidő modell.
* **v1.20.0:** Kvótavédelem (csúszóablak, 429 backoff), státuszkezelés, audit napló import.
* **v1.19.0:** Valós Pinnacle/Bet365 oddsok, TTL, szimulált ár esetén Value/Kelly tiltása.
* **v1.18.0:** Kanonikus xG képlet, Hare-Niemeyer 100% normalizáció, numerikus invariáns tesztek.
* **v1.17.0:** Pre-match, write-once predikciónapló.
* **v1.13–1.16:** ScoreLab, Scanner, nemzetközi kupák, 3D labda.
