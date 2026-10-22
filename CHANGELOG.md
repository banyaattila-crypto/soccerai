# Changelog

Minden fontosabb változás ebben a fájlban kerül rögzítésre a [Keep a Changelog](https://keepachangelog.com/hu/1.0.0/) szabvány szerint.
A projekt a [Semantic Versioning (SemVer 2.0.0)](https://semver.org/lang/hu/) verziózási szabályait követi.

## [1.27.0] - 2026-10-22

### Hozzáadva & Javítva (Added & Fixed) - Piaccal súlyozás és valós backtest (F-04, F-07)
A modell pontosságát és a "value" jelzések értékét először valós piaci adaton mértük. Eredmény (5 liga: PL, La Liga, Serie A, Bundesliga, Ligue 1; walk-forward; bemelegítés 2023/24, hangolás 2024/25, **holdout 2025/26, N = 1752**; forrás: football-data.co.uk, Pinnacle záró és nyitó szorzók):
- **A modell valódi információt hordoz, de a piacnál rosszabb:** 1X2 log-loss: naiv 1,0718, modell 1,0004, Pinnacle záró 0,9776. RPS: 0,2293 / 0,2042 / 0,1976. Over/Under 2.5 log-loss: modell 0,6855, piac 0,6733.
- **A keverési súly hangolása:** a log-loss a modell súlyával monoton nő (w=0: 0,9602 ... w=1: 0,9934 a hangolási szezonon), ezért az optimális modell-súly 0: a modell a záró piachoz képest nem ad pluszinformációt.
- **A nyers modell "+EV" jelei ártalmasak:** a nyitó Pinnacle szorzón az átlagosan állított +21,5% EV mellett a valós hozam −16,0% (1950 fogadás, z = −3,97, CLV −6,3%). Minden kimenetelre fogadva a hozam −6,1% (a piac árrése).
- **Ligánként (holdout) mindenhol ugyanaz a sorrend:** piac < modell < naiv (log-loss).

Változások:
- **Piaccal súlyozás (`marketBlend.ts`):** logaritmikus keverés a modell és a de-vigelt (Shin) piac között; `MARKET_BLEND_MODEL_WEIGHT_1X2/TOTALS` = 0 (a backtest hangolta). Valós szorzónál az EV és a Kelly a piaci referenciához mér: Pinnacle (ennek híján a bukmékerek de-vigelt átlaga) fair valószínűségéhez. Így az "ár-előny" a legjobb elérhető szorzó és a konszenzus különbsége, nem modell-előny.
- **Piaci referencia nélküli piac (BTTS, kombinált, félidő):** az EV és a Kelly 0. A `buildMatchQuantAndPick` új `realMarketProbPct` paramétert kap; callback nélkül valós szorzónál sem számol EV-t.
- **Scanner (`scannerService.ts`) és tipp-kiválasztás (`apiSportsClient.ts`):** ugyanazt a piaccal súlyozott valószínűséget használják; a kártyákon "Ár-előny a piaci konszenzushoz (+EV)" felirat.
- **Backtest-motor (`backtestEngine.ts`):** CSV-értelmezés, walk-forward (nincs előretekintés: csak a nála korábbi meccsek tanítanak, kézi klub-priorok nélkül, hetente újraillesztve), log-loss / Brier / RPS, megbízhatósági sávok, fogadási szimuláció nyitó szorzón CLV-vel, súlyhangolás. A `fitDixonColesModel` új `asOfMs`, a `computeExpectedGoalsFromModel` új `usePriors` paramétert kapott.
- **Szkriptek:** `scripts/backtest-download.mjs` (CSV-k letöltése a gitignore-olt `data/backtest/` mappába) és `scripts/backtest.ts` (futtatás: `npx tsx scripts/backtest.ts`); kimenet: `src/data/backtestReport.json` és `docs/backtest-report.md`. Új fejlesztői függőség: `tsx`.
- **Módszertan (`BacktestSection.tsx`):** a kézi mintaadatsor helyett a valós backtest eredménye: pontosság-táblázat, fogadási szimuláció, megbízhatósági diagram, hangolási görbe, figyelmeztető állapotsor.
- **Eredmények nézet:** a "Hitelesített ROI" mellé kikerült, hogy többnyire szimulált szorzón számolt kalibrációs mutató, nem piaci hozam.
- **Tesztek:** 21 új teszt (`marketBlend.test.ts`, `backtestEngine.test.ts`), a valós szorzós tesztek az új, piaci referenciához mérő viselkedésre átírva; összesen 27 fájlban 259 / 259 zöld.

### Korlátok
- A backtest 5 liga Pinnacle árain készült; az app élő oddsai API-Sports bukmékerekből jönnek (a Pinnacle ott is szerepel, ha elérhető). Egy szezon holdout statisztikai ereje korlátozott (N = 1752); a z-érték −3,97 azonban egyértelmű.
- Az Over/Under súlyhangolás ugyanazt az eredményt adta (0); BTTS-re nincs piaci adat a CSV-kben.

## [1.26.3] - 2026-10-22

### Javítva (Fixed) - A főliga-lekérés hibájának újrapróbálása (`App.tsx`)
A v1.26.2 élő ellenőrzése: ha a Football-Data fő lekérése is 429-et kapott (az ingyenes kulcs keretét a deploy utáni üres edge-cache mellett a lekérések elfogyasztják), az app csak az API-Sports adatait mutatta, és nem próbálkozott újra. Mostantól a sikertelen főliga-lekérés és az üres eredmény is ütemezett újrapróbálást indít (65 mp, legfeljebb 8 alkalom), és a felület jelzi az állapotot.

## [1.26.2] - 2026-10-22

### Javítva (Fixed) - Modell-építés automatikus újrapróbálása
A v1.26.1 élő ellenőrzése: új deploy után az edge-cache üres, az ingyenes Football-Data kulcs 10 kérés/perces keretét az első látogató elégeti, ezért csak az első liga (PL) modellje készült el, a többi a következő (10 perces, vagy kézi) frissítésig hiányzott.
- **Újrapróbálás (`seasonHistory.ts`, `footballDataApi.ts`, `App.tsx`):** az `ensureLeagueModels` jelenti a még függő ligákat; ha van ilyen, az app 65 másodperc után (a kvótapihenő lejártakor) automatikusan újratölt, legfeljebb 8 alkalommal. A sikeres szinkron üzenete kiírja, hány liga modellje készül még.
- **Teszt:** 1 új teszt (függő liga jelentése); összesen 25 fájlban 238 / 238 zöld.

## [1.26.1] - 2026-10-22

### Javítva (Fixed) - Éles ellenőrzés utáni javítás (`seasonHistory.ts`)
A v1.26.0 élő oldalon végzett ellenőrzése két hibát talált (a szezon-lekérés és a `regularTime` mező egyébként működik: PL 70 + 380, CL 189 meccs, a hosszabbításos kupameccseknél a `fullTime` valóban a hosszabbítást is tartalmazza, a `regularTime` a 90 perces eredményt).
- **Részleges modell 24 órára tartósult:** ha az előző szezon lekérése kvóta (429) miatt elmaradt, a csak az aktuális szezonból illesztett modell (pl. La Liga 89 meccs) 24 órára elmentődött. Mostantól a részleges előzményből készült modell csak az adott futásra érvényes, a következő frissítéskor teljes adatból újraillesztődik.
- **Átmeneti hiba hibacache-be került:** a Serie A 6 órára "nem elérhetőnek" lett jelölve, pedig elérhető. Mostantól csak a tényleges 403/404, illetve teljes lekérés melletti kevés minta kerül hibacache-be (kulcs: `soccerai_dc_history_fail_v2_`); a 429, a hálózati és az 5xx hiba átmeneti, nem cache-elődik.
- **Tesztek:** 3 új teszt (429, 403, részleges előzmény); összesen 25 fájlban 237 / 237 zöld.

## [1.26.0] - 2026-10-22

### Javítva & Továbbfejlesztve (Fixed & Enhanced) - Szezon-alapú Modell (Adat- és modell csomag)
A külső kódaudit (F-01, F-02, F-03, F-09, F-10, F-12) és az azt követő szintetikus szimuláció alapján.
- **Szezon-előzmény (`seasonHistory.ts`, `api/matches.ts`, `vite.config.ts`):** a Dixon–Coles modell ligánként a teljes aktuális szezon lejátszott meccseiből tanul, és ha ez 180 meccs alatt van, az előző szezont is felhasználja. Új `season` paraméter a proxyn (négyjegyű évszám ellenőrzéssel); a fejlesztői proxy is érti a `competition` végpontot. 24 órás edge-cache és modell-cache, a 10 kérés/perc korlát betartásával, időkerettel (15 mp) és hibacache-sel (6 óra) a nem elérhető ligákra (pl. az ingyenes csomagban nem szereplő Európa Liga).
- **Egységes skála (`dixonColesFitting.ts`):** a modell explicit liga-gólszintet (μ) és hazai előnyt (γ) illeszt, α és β átlaga 1,0. Megszűnt a dupla skálázás, amely a szimulációban +21% hazai és +10% vendég gólszám-torzítást okozott. A kézi klub-priorok ugyanabban a konvencióban vannak.
- **Bayes-i regularizáció:** a csapat erőssége 1,0 felé húz (K=14, a szimulációban ez adta a legjobb out-of-sample log-loss-t); a ρ kis mintán a tipikus −0,10 felé húz.
- **Kerekítetlen valószínűség (`predictionEngine.ts`, `scannerService.ts`):** az EV és a Kelly a gólmátrixból számolt, két tizedesre kerekített valószínűségből jön (`MarketProbabilities.exact`), a kijelzés marad egész százalék. A λ két helyett három tizedesig pontos, az xG két tizedesig.
- **Gólmátrix 12x12 (`MAXG`):** a korábbi 8x8 csonkolás magas gólszámú meccseken ~1 százalékpontot vitt el (a Bayern–Dortmund referencia-pin Over 2.5: 82 → 83, Over 3.5: 65 → 66). A ScoreLab 4+ cellái a mátrix teljes méretét használják.
- **`||` helyett `??`:** a 0 értékű ρ és hazai előny többé nem íródik felül az alapértékkel.
- **Őszinte adatalap (`apiSportsClient.ts`, `dixonColesFitting.ts`):** az API-Sports ligáknál egyetlen nap meccseiből már nem készül "illesztett" modell; az `isFitted` csak modell-eredetű értéknél igaz, nem a kézi priornál. Az adatminőség (A/B/C) a tényleges mintaszámból jön. Kis mintájú modell-ratinget a klub-priorral keveri a program.
- **90 perces eredmény (`seasonHistory.ts`, `footballDataApi.ts`):** hosszabbítás/tizenegyes esetén a `regularTime` mező, ha elérhető; ez javítja a kupameccsek elszámolását. [Az élő API-n a mező megléte ellenőrzendő.]
- **Modell-cache v2, meccs-cache v5:** a korábbi, vékony mintából készült modellek nem használhatók tovább.
- **Tesztek:** 15 új teszt (`dixonColesAccuracy.test.ts`, `seasonHistory.test.ts`); összesen 25 fájlban 234 / 234 zöld.

### Mért hatás (szintetikus liga, 40 ismétlés; nem valós piaci backtest)
- Átlagos várható gól 380 meccses illesztésnél: hazai 1,82 → 1,50, vendég 1,32 → 1,19 (igaz: 1,50 / 1,20).
- 1X2 log-loss (kisebb a jobb): ligaátlag 1,0751; 30 meccsből illesztve 1,0800 (rosszabb a ligaátlagnál); 60 meccsből 1,0692; 190 meccsből 1,0466; 380 meccsből 1,0382 (korábban kb. 1,05); orákulum 1,0217. Ezért az illesztés alsó határa 60 meccs.
- Hatékony piacon (5% árrés) a valós ROI minden változatnál kb. −5% (−4,2% … −6,6%), miközben a modell átlagosan +18% … +47% EV-t állít. A pontosabb illesztés a log-loss-t javítja, de az "élt" nem teremti meg: az "igazolt piaci előny" állítás tiltva marad, és a következő lépés a piaccal való súlyozás.
- Módszertani megjegyzés: az audit első szimulációjában a "piac" valószínűségei más ρ-val készültek, mint a szimulált világ, ezért az ott közölt ROI-számok (−0,4% … −4,2%) torzítottak voltak; a most közölt számok a javított szimulációból származnak.

## [1.25.0] - 2026-10-22

### Hozzáadva & Továbbfejlesztve (Added & Enhanced) - Őszinte Felület (Design csomag)
A külső kódaudit (2026-10-22) eredményei alapján: a felület többé ne állítson többet, mint amit a modell és az adat megenged.
- **Érzékenységi sáv (`modelConfidence.ts`, `TopPicks.tsx`):** a tipp-kártyákon a modell-esély mellett a λ becsült hibájából számolt forgatókönyv-sáv látszik (nem statisztikai konfidencia-intervallum, ezt a tooltip is jelzi). Kis mintán a sáv szélesebb.
- **Őszinte adatminőség-felirat:** az A/B/C betű mellett Szezon-illesztés / Részleges illesztés / Vékony minta / Ligaátlag + prior felirat a mögötte álló meccsszámmal (kártya és meccs-részletező).
- **Szimulált és lejárt ár jelölése (`OddsSourceBadge.tsx`):** csíkozott sáv a kártya tetején, szaggatott/pontozott keretek, egységes jelvény. A különbség színvakon és kis méretben is látszik.
- **Döntés-központú állapotsor:** a Top tippek fölött egy mondat mondja meg, van-e valós, érvényes áron pozitív elméleti él. Ha nincs, a lista kifejezetten nem fogadási ajánlás.
- **Üres állapot:** ha egyetlen mérkőzés sem jut át a robusztussági szűrőn, a felület "Ma nincs ajánlott tipp" üzenetet ad a korábbi néma eltűnés helyett.
- **Megbízhatósági diagram (`ReliabilityChart.tsx`):** SVG diagram a Módszertanban, az átlóval és a mintaelemszámmal arányos pontokkal. Kiírja, hogy az adatsor illusztratív minta, nem az élő napló.
- **Tőkegörbe (`EquityCurve.tsx`, `equityCurve.ts`):** kumulált bankroll-görbe és maximális drawdown a Tétnaplóban, kis mintára figyelmeztetéssel.
- **Akadálymentesség (`index.css`, `useSoccerBallCanvas.ts`):** a `text-slate-500/600` szövegszínek kontrasztja WCAG AA közelébe emelve; `prefers-reduced-motion` támogatás a CSS-animációkra és a 3D labdára; a diagramok `role="img"` és szöveges leírást kapnak.
- **Tesztek:** 9 új teszt (`modelConfidence.test.ts`, `equityCurve.test.ts`); összesen 23 fájlban 219 / 219 zöld.

### Ismert korlátok (nem ennek a kiadásnak a tárgya)
- A modell adatalapja továbbra is a 3 napos API-ablak (audit F-01), és fennáll a λ-skála eltérés (F-02). Ezeket a következő, Adat- és modell csomag javítja. Az érzékenységi sáv ezért kis mintán szándékosan széles.

## [1.24.9] - 2026-10-22

### Hozzáadva & Továbbfejlesztve (Added & Enhanced) - Részletes Meccs Magyarázat és Szakértői Elemzés
- **Szakértői Elemzés & Meccs Magyarázat Kártya (`MatchDetailModal.tsx`, `MatchExplanationCard.tsx`, `matchExplanationService.ts`):**
  - **Emberi nyelvezetű, gazdag meccselemzés:** A korábbi egyetlen, száraz matematikai kódmondat (`Piacfüggő λ-rács teszt: ROBUSZTUS...`) helyett a mérkőzés modál megnyitásakor egy átfogó, természetes magyar nyelvű sportszakértői meccselemzés fogadja a felhasználót.
  - **Átfogó Narratíva & Címsor:** A csapatok erejét, favorit státuszát, aktuális tabella-helyezését és esélyeit összefoglaló, kiemelt aranyfényű cím és 2-3 mondatos összefoglaló.
  - **Csapatdinamika, Helyezés és H2H Múlt:** Részletes forma-összehasonlítás (utolsó 5 mérkőzés győzelmi/döntetlen/vereség aránya), tabella-pozíciók és az egymás elleni múltbéli eredmények hatása a várható játékmenetre.
  - **Gólvárás & Taktikai Tempó (xG & Poisson Modell):** Az összetett elvárt gólok (xG), a 2.5 gól feletti/alatti kimenetelek esélyei, a BTTS (mindkét csapat szerez gólt) valószínűsége és a mérkőzés ritmusa.
  - **Kiemelt Tipp Részletes Indoklása:** Részletesen megindokolja, hogy miért az adott piacot (1X2, BTTS, Over/Under 2.5, BTTS & Over 2.5) választotta az algoritmus, és miben rejlik a piaci oddsokhoz viszonyított matematikai értéke.
  - **4 Strukturált Kulcstényező:** Erőviszony & Formaindex, Gólprofil & Tempó, Fogadási Fókusz, valamint Taktikai Megjegyzés (pl. első félidei gólnyomás).
  - **Kockázati Besorolás & Figyelmeztetés:** Alacsony / Közepes / Magas volatilitási címke és szakértői kockázatkezelési tanács.
  - **Lenyitható Algoritmus Diagnosztika:** Haladó felhasználóknak egyetlen kattintással elérhető a kvantitatív λ-rács stabilitás és a Shin bukmékeri árrés részletezése.
- **Automatizált Regressziós Tesztcsomag (`matchExplanationService.test.ts`, `matchExplanationRegression.test.tsx`):**
  - 7 új automatizált teszt ellenőrzi a narratív generátort és a modál komponens szerver-oldali renderelését különböző piacok és hiányos adatok esetén.
  - A teljes tesztcsomag 21 fájlban 210 / 210 teszttel zöld.

## [1.24.8] - 2026-10-22

### Javítva & Továbbfejlesztve (Fixed & Enhanced) - Intelligens Scanner Megjelenítés
- **Üres Scanner Nézet Megszüntetése (`ScannerView.tsx`):**
  - **Dinamikus Alapértelmezett Preset:** Korábban a Scanner megnyitásakor mindig a `💎 +EV Értéktippek` (`best_ev`) volt aktív, ami valós, élő bukmékeri oddsok nélkül (szimulált oddsok vagy demó mód esetén) szigorúan 0 találatot mutatott. Mostantól, ha nincsenek aktív valós +EV oddsok, a Scanner automatikusan a **`🎯 Kiemelt MI Tippek`** (`ai_picks`) nézetet nyitja meg, így a felület sosem indul üres képernyővel.
  - **Intelligens Időszak-kezelés:** Ha a mai napon nincsenek még meg nem kezdett mérkőzések, a rendszer automatikusan az **`Összes Nyitott Meccs`** nézetre vált, megelőzve a mérkőzésmentes napok miatti téves 0 találatot.
  - **Interaktív Tájékoztató & Gyorsváltók:** Ha a felhasználó a `+EV` szűrőre kattint valós bukméker oddsok hiányában, a felület világosan elmagyarázza a szimulált vs. valós oddsok közötti különbséget, és egyetlen kattintással elérhetővé teszi az MI tippek vagy az összes mérkőzés megtekintését.

## [1.24.7] - 2026-10-22

### Letisztítás & Továbbfejlesztve (Clean UI & Enhanced) - Alsó Lábléc Integrálása az About Menübe
- **Állandó Alsó Keretes Lábléc Eltávolítása Minden Oldalról (`App.tsx`):**
  - **Megszüntetett alsó zsúfoltság:** A korábban minden egyes nézet (Top Tippek, Mérkőzés Rács, Scanner, Eredmények, Tétnapló, Módszertan) alján megjelenő, több száz képpontos lábléc teljes mértékben eltávolításra került a fő elrendezésből.
  - **Szellős, natív app élmény:** A tartalmi felületek fellélegeznek, a mérkőzéslisták és funkcionális panelek a teljes képernyőt kihasználják zavaró alsó dobozok nélkül.
- **Tartalom Átültetése az Alkalmazás Névjegy Modálba (`AboutModal.tsx`):**
  - **Platform Leírás & Modellezés:** Kvantitatív analitikai háttér, Dixon-Coles Poisson modellezés és Shin de-vigging részletezése.
  - **Lefedett Bajnokságok:** Rendszerezett, zászlós kártyák a támogatott bajnokságokról (Premier League, La Liga, Serie A, Bundesliga, Ligue 1, BL & UEL).
  - **Felelős Játék & Módszertani Figyelmeztetés (18+):** Kiemelt figyelmeztető doboz a matematikai valószínűségekről és a bankroll-menedzsmentről.
  - **Rendszerintegrációk & Szerzői Jogok:** Élő Football-Data API integráció, Poisson & xG modellezési adatok, valamint a fejlesztői információk.

## [1.24.6] - 2026-10-22

### Javítva & Továbbfejlesztve (Fixed & Enhanced) - Kitakarásmentes Vendégcsapat Megjelenítés
- **2-Soros Csapatelrendezés a Mérkőzés Rács Kompakt Nézetében (`MatchCompactList.tsx`):**
  - **Megszüntetett kitakarási hiba:** A korábbi egyvonalas, szűk 80–112 px szélességű horizontális elrendezés (`[Hazai] [VS] [Vendég] [3D diagramok]`) helyett a professzionális sportplatformok (FlashScore, SofaScore) bevált 2-soros csapatszerkezete került bevezetésre.
  - **Tágas, védett tér a csapatneveknek:** A Hazai csapat az 1. sorban, a Vendég csapat közvetlenül alatta, a 2. sorban kapott helyet. A vendég csapatok így sosem tolódnak ki oldalra a 3D diagramok alá, és még a leghosszabb nevek (pl. *Borussia Mönchengladbach*, *Wolverhampton Wanderers*, *Paris Saint-Germain*) is bőséges hellyel, kitakarás nélkül jelennek meg.
  - **Tökéletes vizuális párhuzam a 3D mutatókkal:** Az 1. csapatsor (Hazai) vízszintesen pontosan a Stadionzöld 3D Pill-el (Gólok / Fő piac), míg a 2. csapatsor (Vendég) a Sportfogadási Arany 3D Pill-el (Másodlagos piac) alkot harmonikus, azonos magasságú sávot.
  - **Eredmények és Élő Percek integrációja:** Lezárt mérkőzéseknél az adott csapat góljai közvetlenül a csapat neve mellett jelennek meg a sor végén, míg a kezdési időpont és a státusz (FT / ÉLŐ) külön bal oldali információs blokkban kapott helyet.
- **Automatizált Regressziós Tesztcsomag (`compactListLayoutRegression.test.tsx`):**
  - 4 új automatizált teszt védi a DOM-szerkezetet, garantálva, hogy a Hazai és Vendég csapatok önálló, függőlegesen egymás alá rendezett konténerekben futnak, megakadályozva a 3D diagramok és a vendégcsapatok közötti bármiféle átfedést vagy kitakarást.

## [1.24.5] - 2026-10-21

### Hozzáadva & Továbbfejlesztve (Added & Enhanced) - Letisztult, Szellős Kezelőfelület
- **1. Lépés: Összecsukható / Elrejthető Szűrősáv (`StatsGrid.tsx`):**
  - **Kompakt, egyvonalas vezérlősáv:** A korábbi, 300–400 képpontos, többemeletes gomb- és legördülő-rengeteg helyett egyetlen letisztult sor (Keresőmező azonnali törlés gombbal, Nézetváltó gombok, Megjelenítési mód kapcsoló).
  - **Kinyitható Szűrőfiók (`Szűrők (X aktív) ▾`):** Egyetlen gombnyomással elérhető a teljes bajnokságválasztó (vízszintesen görgethető vagy kiterjeszthető nézetben), az Élő / Kiemelt jelek szűrő, a piackapcsolók és a ScoreLab 2-mutatós választó.
  - **Összecsukott szűrő-chipek:** Összecsukott állapotban a felhasználó egyetlen kattintással eltávolíthatja az éppen aktív szűrőket közvetlenül az eszköztárról anélkül, hogy a teljes fiókot ki kellene nyitnia.
  - **Állapotmegőrzés:** Az összecsukott/kinyitott állapot automatikusan mentésre kerül a böngésző helyi tárhelyébe (`localStorage`).
- **2. Lépés: Összecsukható Hero KPI Sáv (`HeroKpi.tsx`):**
  - **28 képpontos mini-szalag:** A 3D labdás kiemelt statisztikai blokk összecsukható egy ultravékony szalaggá (`Ma: X meccs · Y bajnokság · Z kiemelt jel`), így azonnal a mérkőzések listája kerül a képernyő középpontjába.
  - **Megőrzött állapot:** A felhasználó preferenciája megmarad (`soccerai_hero_kpi_collapsed`), bármikor visszanyitható vagy elrejthető egy kattintással.
- **3. Lépés: Tágas, Jól Szellőző Kártyák és Megnövelt Tipográfia (`MatchCardsList.tsx`, `MatchCompactList.tsx`):**
  - **Olvashatóbb szövegméretek:** A zsúfolt, mikroszkopikus (`text-[8px]`, `text-[10px]`) feliratok helyett tiszta, jól olvasható méretek (`text-xs`, `text-sm`, `text-base`).
  - **Kényelmesebb belső margók és csapatlogók:** Kártyanézetben megnövelt paddingok és 24x24 px-es logók; kompakt nézetben tágasabb sorok és 28x28 px-es logók a prémium, kényelmes olvasási élményért.

## [1.24.4] - 2026-10-21

### Javítva & Letisztult Sport Arculat (Fixed & Clean Athletic Styling)
- **Klasszikus Stadionzöld és Sportfogadási Arany Százaléksávok (`MatchCompactList.tsx`):**
  - **Színek lecserélése a felhasználói visszajelzés alapján:** A türkiz, cián, rózsaszín és lila árnyalatok teljes eltávolítása a kompakt lista mutatóiból.
  - **1. Mutató (Gólok / Fő piac):** Mély, férfias és elegáns stadion fűzöld és smaragd színátmenet (`from-emerald-600 via-emerald-500 to-green-500`) visszafogott zöld fénnyel.
  - **2. Mutató (Másodlagos piac):** Nemes, meleg sportfogadási arany és borostyán gradiens (`from-amber-600 via-amber-500 to-yellow-500`) finom meleg fénnyel.
  - **Harmónia az arculattal:** A két mutató mostantól 100%-ban illeszkedik a SoccerAI alapvető sport arculatához (zöld statisztikák / arany oddsok és prémium tippek).

## [1.24.3] - 2026-10-21

### Hozzáadva & Továbbfejlesztve (Added & Enhanced)
- **Élénk 3D Színátmenetes Százaléksávok (`MatchCompactList.tsx`, `index.css`):**
  - **Megszüntetett egyhangúság és háttérbe olvadás:** A korábbi sötétkék és egyszínű kitöltés helyett dinamikus, vibráló multi-stop gradiensek kerültek bevezetésre:
    - 1. Mutató (Gólok / Fő piac): `from-emerald-400 via-teal-300 to-cyan-400` elektromos smaragd-türkiz színátmenet fényes aurával (`shadow-[0_0_10px_rgba(45,212,191,0.55)]`).
    - 2. Mutató (Másodlagos piac): `from-amber-400 via-rose-500 to-purple-600` sugárzó borostyán-rózsa-lila színátmenet fényes aurával (`shadow-[0_0_10px_rgba(244,63,94,0.55)]`).
  - **3D Hengeres Üvegfény és Élfény:** Külön belső spekuláris réteg (`from-white/35 via-white/10 to-transparent`) és felső 3D élfény-visszaverődés, amely sosem fedi el vagy nyomja el a Tailwind horizontális színátmeneteit.
  - **Süllyesztett 3D Ágyazat:** A csúszka alapja mély süllyesztett ágyazatot (`bg-slate-950 shadow-[inset_0_2px_4px_rgba(0,0,0,0.85)]`) kapott, így a fényes gradiens élesen kiemelkedik belőle.
- **Eredmények Csoportosítása Dátum Szerint (`ResultsView.tsx`):**
  - **Naponkénti Csoportosítás:** A befejezett mérkőzések naptári napok szerint szétbontott kártyacsoportokban jelennek meg, kronologikusan csökkenő sorrendben (legfrissebb elöl).
  - **Magyar Dátumfejlécek & Naptár Ikon:** Pl. `Ma – 2026. október 21., szerda`, `Tegnap – 2026. október 20., kedd` és korábbi napok a hét napjával kiírva.
  - **Napi Eredményösszesítő Címkék:** Minden dátumcsoport fejlécében látható az adott nap meccsszáma, valamint a nyertes és vesztes tippek száma.
- **Eredmények Eltűnésének Megszüntetése:**
  - **Alapértelmezett "Összes Befejezett Eredmény" Nézet:** A korábbi szűk "Hitelesített Pre-Match" fül helyett a nézet alapértelmezetten az összes lezárt mérkőzést mutatja, így a felhasználó sosem találkozik üres képernyővel.
  - **Kártyák Egyértelmű Megkülönböztetése:** Minden kártya világos jelvényt kap: `🔒 AUDITÁLT` zöld/borostyán pecsét kriptográfiai lenyomattal, vagy `📁 ARCHÍVUM` jelölés.
  - **Demó Mód Mentése (`App.tsx`):** Mintamódban is azonnal perzisztálódnak a lezárt mérkőzések a helyi előzménytárba, valamint üres tárhely esetén automatikus kezdőarchívum inicializálódik.
- **Bővített Adatmegőrzési Kapacitás (`historyService.ts`):**
  - A korábbi 150 mérkőzéses limit **300 mérkőzésre** emelkedett a `historyService.ts`-ben, tökéletes összhangban a `predictionAuditService.ts` 300-as limitjével.
  - **Hány napi eredményt ment el?:** Átlagos heti 30–40 európai mérkőzés mellett ez **60–90 nap (2–3 hónap)** teljes meccselőzményét és auditnaplóját őrzi meg a böngésző helyi tárhelyén (`localStorage`, FIFO alapon).
  - **Közvetlen Export/Import:** Bármikor letölthető a teljes auditnapló egyetlen kattintással JSON-ban, és korlátlan ideig megőrizhető vagy átvihető másik eszközre.
- **Új Regressziós Tesztcsomag (`src/components/__tests__/resultsGroupingRegression.test.ts`):**
  - 199 / 199 zöld teszt a teljes projekten.

## [1.21.1] - 2026-10-20

### Javítva & CI Pipeline Zöldítés (Fixed & CI Strict Linting)
- **GitHub Actions CI Zöldítés (`.github/workflows/ci.yml`):**
  - **Oxlint szigorú ellenőrzés javítása:** Megszüntetve mind a 19 linter figyelmeztetés (`npx oxlint --deny-warnings` 0 warning, 0 error).
  - Nem használt importok eltávolítása tesztekből és komponensekből (`clearAuditLog`, `computeRecordHash`, `STORAGE_KEY_AUDIT_LOG`, `extractMarketsFromMatrix`, `vi`, `MIN_STATISTICAL_SAMPLE_SIZE`, `evaluatePickWon`, `TrendingUp`, `Info`, `isOddsExpired`, `PredictionAuditRecord`).
  - `unicorn/no-new-array` refaktorálva: `Array.from({ length: n }, () => base)` a `src/services/predictionEngine.ts` fájlban.
  - Böngészőteszt szkript (`scripts/verifyBrowser.mjs`) tiszta process exit kezelése.
- **Eredmények Szűrősáv Bővítése (`src/components/ResultsView.tsx`):**
  - Bekötésre került a vizuális időszakszűrő gombcsoport (Összes, Ma, Tegnap, 7 nap) a meglévő audit szűrő logikához.

## [1.21.0] - 2026-10-20

### Hozzáadva & Tudományos Kalibráció (Added & Scientific Calibration)
- **Valós Böngészős Verifikáció (Headless Chromium CDP Interfész):**
  - **Automatizált böngészős ellenőrző szkript (`scripts/verifyBrowser.mjs`):** Valós headless Chromium folyamat indítása, CDP (Chrome DevTools Protocol) csatlakozás natív WebSocketen keresztül.
  - **Interaktív modul-ellenőrzés:** Az összes lap (`TopPicks`, `StatsGrid`, `ScannerView`, `ResultsView`, `BankrollView`, `MethodologyView`), a Szelvényépítő Drawer (`BetSlipDrawer`), és a 3D meccslabda canvas végiglátogatása és renderelésének igazolása.
  - **Kivétel- és hibafigyelés:** 0 kezeletlen futásidejű kivétel (uncaught exception), 0 konzolhiba.
- **Időrendhelyes (Chronological Walk-Forward) Mintavételezés (`src/services/calibrationService.ts`):**
  - **Lookahead bias kizárása:** A mérkőzések szigorúan időbélyeg szerint növekvő sorrendbe rendezése; in-sample és out-of-sample szétválasztás temporális vágási időpont ($T_{\text{split}}$) mentén.
  - Jövőbeli meccsek paraméterei és eredményei nem szivároghatnak át a múltbeli becslésekbe (nincs adatcsorgás).
- **Valószínűségi Kalibráció Mérése:**
  - **Multi-class 1X2 Brier-pontszám & Brier Skill Score (BSS):** A predikciós motor pontosságának mérése a naiv egyenletes bázishoz (0.6667) viszonyítva.
  - **Várható Kalibrációs Hiba (Expected Calibration Error - ECE) & Max Hiba (MCE):** Valószínűségi decilisek/kvintilisek szerinti súlyozott eltérés ($|\bar{p}_k - \bar{y}_k|$).
  - **Megbízhatósági diagram (Reliability Table):** Megjeleníti az egyes esélykategóriákban a modell átlagos jóslatát és a valós kimenetelek találati arányát.
- **Szigorú Piaci Előny Hitelesítési Kapu (Edge Verification Gate):**
  - **"Előtte ne állíts igazolt piaci előnyt":** A rendszer szigorúan megtiltja az „igazolt piaci előny” hangoztatását, amennyiben a mintaméret kisebb mint $N=250$, a kalibrációs hiba $ECE > 8.0\%$, vagy az elért többlethozam statisztikailag nem szignifikáns ($p \ge 0.05, Z \le 1.645$).
  - **Terminológiai pontosság:** A felületeken a nyers piaci él helyett a „Becsült elméleti él (+EV)” megnevezés jelenik meg egyértelmű módszertani magyarázattal.
  - **Új 6. Módszertani Panel (`MethodologyView.tsx`):** Részletes interaktív nézet a Brier score-ról, az ECE-ről, az out-of-sample ROI-ról, a hipotézistesztelésről és a megbízhatósági táblázatról.
- **10 Új Dedikált Regressziós Teszt (`src/services/__tests__/calibrationService.test.ts`):**
  - A teljes tesztkészlet immár **145/145 sikeres teszttel** (100% pass) fut le.

## [1.20.0] - 2026-10-20

### Hozzáadva & Rendszer-stabilizáció (Added & System Stabilization)
- **API Kvóta & Kérésszám Védelem (`src/services/quotaService.ts`):**
  - **Csúszóablakos Ráta-korlátozás (Sliding Window):** Football-Data.org hívások követése pontos percenkénti csúszóablakkal (10 req/min). A 11. hívás blokkolásra kerül dinamikus `retryAfterSeconds` visszaszámlálóval.
  - **Napi Limit Menedzsment (API-Sports):** API-Sports napi 100 kéréskeretének automatikus számlálása és perzisztálása; válaszfejlécek (`x-ratelimit-requests-remaining`) szinkronizálása.
  - **Intelligens 429 Backoff:** HTTP 429 válasz esetén automatikus pihenőidő (Retry-After fejléc vagy 60s) aktiválása mindkét külső szolgáltatónál.
  - **Megmentő Gyorsítótár (Stale Cache Fallback):** Hálózati vagy kvótahiba esetén a rendszer nem üríti ki a képernyőt (`[]`), hanem a legfrissebb érvényes mérkőzéseket jeleníti meg barátságos figyelmeztető sáv kíséretében.
- **Mérkőzés Státuszok Stabilizálása:**
  - **Pontos Állapot Leképezés (`POSTPONED`, `CANCELLED`, `SUSPENDED`):** Bővített `MatchStatus` típus. A korábban hibásan `UPCOMING`-ra visszahulló elmaradt/félbeszakadt mérkőzések a valós státuszukkal jelennek meg.
  - **Fogadási Zárolás:** Elhalasztott, törölt, élő vagy befejezett meccsekre a szelvényhez adás azonnal tiltott.
- **Megmásíthatatlan Audit Napló & Tétnapló Import:**
  - **Kriptográfiai SHA-256 Integritás-ellenőrzés (`predictionAuditService.ts`):** Új `importAuditLogFromJson` funkció, amely importáláskor matematikai hash-ellenőrzéssel (`auditHash`) vizsgálja meg minden rekord hitelességét. Az utólag módosított oddsokat vagy valószínűségeket a rendszer azonnal elutasítja.
  - **Audit Import Gomb a Felületen (`ResultsView.tsx`):** Egykattintásos JSON feltöltés, állapot-visszajelzés és a hitelesített rekordok azonnali beolvasása.
  - **Szigorú Séma-validáció a Tétnaplóban (`bankrollService.ts`):** Mind a becsomagolt formátum (`{ bets: [...], initialBankroll: ... }`), mind a közvetlen tömb (`[...]`) támogatott szigorú értéktartomány ellenőrzéssel (pozitív tét, odds >= 1.0, érvényes kimenetelek).
- **Szelvény Integritás & Automatikus Tisztítás (`BetSlipDrawer.tsx`, `App.tsx`):**
  - **Élő Állapot Szinkronizáció:** A háttérben frissülő meccsadatok automatikusan aktualizálják a szelvényen lévő tételeket (`matchStatus`, `kickoffDate`, `kickoffTime`).
  - **Elkezdődött/Lezárt Meccsek Figyelmeztetése:** Piros kerettel és egyértelmű okkal (`⚠️ A mérkőzés már befejeződött`, `⚠️ A mérkőzés éppen zajlik`, `⚠️ A mérkőzés már elkezdődött`) jelöli az érvénytelen tételeket.
  - **Tisztító Gomb:** Új „🧹 Tisztítás / Érvénytelenek eltávolítása” funkció, amely egyetlen gombnyomással törli az időközben érvénytelenné vált tételeket.
  - **Mentésvédelem:** A „Rögzítés Tétnaplóba” gomb zárolva van mindaddig, amíg érvénytelen esemény található a szelvényen.
- **12 Új Dedikált Regressziós Teszt (`src/services/__tests__/quotaAndIntegrityRegression.test.ts`):**
  - 135/135 egységteszt fut le sikeresen (100% pass rate).

## [1.19.0] - 2026-10-20

### Hozzáadva & Valós Odds Integráció (Added & Real Odds Integration)
- **Valós Bukméker Oddsok (Pinnacle & Bet365) és Lejárat (TTL) Bekötése:**
  - **Minden Ajánlási Nézet Lefedve:** A valós bukmékeri szorzók közvetlenül bekötve a `TopPicks` (3D kártya és szekunder szignálok), `ScannerView` (lehetőségek és szűrők), `StatsGrid` (rács cellák és szelvény gombok), `BetSlipDrawer` (szelvény és tétnapló), valamint a `MatchDetailModal` (részletes elemző nézet) felületekbe.
  - **60 Perces Lejárati Idő (TTL) & Frissesség:** A gyorsítótárazott oddsok pontos lejárati idővel (`expiresAt`), hátralévő percekkel (`ttlMinutes`) és lejárati flaggel (`isExpired`) rendelkeznek. A felületeken valós idejű lejárati pill (`🏢 Pinnacle ⏳ 45p`) jelzi a piaci adat korát.
  - **Lejárt Odds Kezelés:** Ha a bukmékeri odds lejár (>= 60 perc), a rendszer automatikusan megjelöli (`🔴 Lejárt odds`), a szorzót áthúzva jelzi, és azonnal zárolja a piaci él számítást az újrafrissítésig.
- **Szimulált Árak Védelme & Value/Kelly Letiltása:**
  - **Szigorú Value (+EV%) és Kelly Zárolás:** Szimulált árképzés esetén (`isSimulatedOdds === true`, hiányzó bukmékeri szorzó vagy lejárt odds) a Value (+EV%) és a Negyed-Kelly tét kijelzése szigorúan **le van tiltva és 0.0%-ra állítva**.
  - **Megtévesztés Kizárása:** Megszűnt az önigazoló arbitrázs illúziója (amikor a modell a saját szintetikus árrésével számolt ki pozitív EV-t). A szimulált tippeken és lehetőségeken egyértelmű jelölés látható: `🧪 Szimulált ár (Value / Kelly letiltva)`.
- **Scanner Valós Odds Szűrés & Preset Szigorítás:**
  - **„Csak Valós Oddsok” Kapcsoló:** Új szűrőgomb a Scanner vezérlősávjában, amely egyetlen kattintással kizárja az összes szimulált vagy lejárt piacot.
  - **Megbízható `best_ev` Preset:** A „Legjobb Érték (+EV)” preset immár kizárólag érvényes, nem lejárt, valós bukmékeri oddsokból származó pozitív éleket listáz.
- **11 Új Dedikált Regressziós Teszt (`src/services/__tests__/realOddsExpirationRegression.test.ts`):**
  - Teszteli a 60 perces lejárati TTL számítást, a lejárat detektálást, az `attachCachedRealOddsToMatches` viselkedését, a `predictionEngine` szimulált ár zárolását, valamint a `scannerService` szűrési garanciáit.
  - A teljes tesztkészlet **123/123 sikeres teszttel** (100% pass) fut le.

## [1.18.0] - 2026-10-20

### Hozzáadva & Matematikai Egységesítés (Added & Model Unification)
- **Egységesített Kanonikus Dixon-Coles Képletek (`src/services/predictionEngine.ts`):**
  - **Közös Tau Faktor (`dixonColesTau`):** Megszűnt az egymástól eltérő inline kód a `dixonColesFitting.ts` és a `predictionEngine.ts` között. A tau faktor szigorúan nemnegatív ($\tau \ge 0.001$), meggátolva a negatív valószínűségi sűrűséget.
  - **Kanonikus Várható Gól Számítás (`computeDixonColesExpectedGoals`):** Egységes $\lambda_H, \lambda_A$ intenzitási számítás az összes szolgáltatásban (`predictionEngine`, `dixonColesFitting`, `scoreLabService`). A ScoreLab immár garantáltan azonos xG értékeket és gólmátrixot használ, mint a központi predikciós motor.
  - **Hare-Niemeyer (Legnagyobb Maradvány) Normalizálás (`normalizeIntegerPercentages`):** Megszűntek a kerekítési hibák miatti 99% vagy 101% összegek, valamint a negatív csonkolások. Az 1X2 partíció, a ScoreLab kimeneteli zónák és a gólszám-eloszlás sávok összege **matematikailag garantáltan 100%**.
- **Szigorú Numerikus Invariánsok Betartatása:**
  - **Gólszám Monotonitás:** $P(\text{Over } 3.5) \le P(\text{Over } 2.5) \le P(\text{Over } 1.5)$.
  - **Fréchet / Copula Határok:** $\max(0, P(\text{BTTS}) + P(\text{Over } 2.5) - 100) \le P(\text{BTTS \& Over } 2.5) \le \min(P(\text{BTTS}), P(\text{Over } 2.5))$.
  - **Félidő / Teljes Meccs Konzisztencia:** $P(\text{FH Over } 0.5) \le P(\text{FT Over } 0.5)$.
  - **Mátrix Normalizálás:** $\sum_{i,j} M[i][j] \equiv 1.0 \pm 10^{-12}$.
- **Saját Regressziós Tesztcsomag ([`modelInvariantsRegression.test.ts`](file:///home/attila/projects/soccerai/src/services/__tests__/modelInvariantsRegression.test.ts)):**
  - **48 új dedikált regressziós teszt**, amely property-based szcenáriókon és fix Golden Regression Pin-eken (Arsenal-Aston Villa, Bayern-Dortmund, Juventus-Roma) keresztül védi a modellt a numerikus sodródástól.
  - A projekt tesztkészlete **112/112 sikeres egységtesztre** bővült (100% pass rate).

## [1.17.0] - 2026-10-20

### Hozzáadva & Integritás (Added & Integrity Verification)
- **Kezdés Előtti Megmásíthatatlan Predikciónapló (`src/services/predictionAuditService.ts`):**
  - **Szigorú Pre-Kickoff rögzítés (`isMatchBeforeKickoff`):** Egy mérkőzés előrejelzése KIZÁRÓLAG akkor kerülhet be a hitelesített naplóba, ha a meccs még `UPCOMING` státuszú és a hivatalos kezdési időpont a jövőben van. A kezdés után vagy utólag beérkező mérkőzések hitelesítése elutasításra kerül.
  - **Megmásíthatatlan napló (Write-Once / Append-Only):** A már rögzített mérkőzések tippet, valószínűségét és szorzóját semmilyen későbbi lekérés vagy frissítés NEM írhatja felül.
  - **Determinisztikus Integritási Aláírás (`computeRecordHash`):** Minden predikcióhoz egyedi hash készül a rögzítés időpontja, a kezdés és a kiválasztott piac alapján.
  - **Valós Eredmény Alapú Lezárás (`settleAuditPredictions`):** A lefújást követően a rendszer a lepecsételt pre-match tippet automatikusan összeveti a hivatalos API végeredménnyel, és kiszámolja a profitot (`WON` / `LOST` / `VOID`).
  - **Audit JSON Export:** A teljes predikciónapló egy kattintással letölthető vagy vágólapra másolható az ellenőrizhetőséghez.
- **Provenance Javítása & Régi ROI-k Kizárása (`src/components/ResultsView.tsx`):**
  - **Teljes Mock Fallback Megszüntetés:** Eltávolításra került a korábbi `MOCK_MATCHES.filter(m => m.status === 'FINISHED')` fallback; kamu/minta adatokból nem képződhet hivatalos megtérülés vagy találati arány.
  - **Két Elkülönített Eredmény Nézet:**
    1. *Hitelesített Pre-Match Napló (Hivatalos):* Kizárólag a kezdés előtt naplózott és valós végeredménnyel lezárt meccsek számítanak bele a hivatalos KPI mutatókba (Találati Arány, Hitelesített ROI %, Nettó Profit).
    2. *Nem auditált külső archívum (Tájékoztató jellegű):* Külön lapon jeleníti meg a kezdés után/utólag érkezett vagy korábbi archív meccseket egyértelmű figyelmeztető sávval, hogy ezek nem képezik a hivatalos ROI részét.
- **Kezdő Állapot Tisztítása (`src/App.tsx`, `HeroKpi.tsx`):**
  - A mérkőzéslista kezdeti állapota üres tömb (`[]`), így inicializáláskor sem villannak be vagy szivárognak át a mock meccsek.
  - A fejléc KPI sáv tegnapi találati aránya szigorúan a hitelesített audit naplóból számolódik (ha nincs tegnapi lezárt auditált meccs, az `Audit: Pre-Match Napló` pajzs-jelzés látható).
- **Egységtesztek Bővítése:** 7 új dedikált teszt a predikciónapló integritási szabályainak ellenőrzésére ([`predictionAuditService.test.ts`](file:///home/attila/projects/soccerai/src/services/__tests__/predictionAuditService.test.ts)), összesen **64/64 sikeres teszt**.

## [1.16.5] - 2026-10-20

### Hozzáadva & Javítva (Added & Fixed)
- **Kvantitatív Érték-Index és Játszható Szorzók (1.50+ Sweet Spot, `src/services/predictionEngine.ts`):**
  - **Megszűnt a használhatatlan mini-oddsok (< 1.40) automatikus ajánlása:** Korábban a tisztán valószínűség alapú pontozás miatt az óriásfavoritok 1.12–1.25-ös szorzói lettek a mérkőzések „Top Tippjei”.
  - **Új Érték-Index Formula:** Az 1.40 alatti szorzók erős pontlevonást kapnak (-40 .. -65 pont), míg a sportfogadás kvantitatív édes-pontja (**1.55 – 2.45**) +32 pontos kiemelt értékelést és +EV bónuszt kap.
  - **Intelligens Piacválasztás Favoritoknál:** Ha egy favorit sima győzelme csak 1.15-öt fizet, az AI automatikusan a valós értékkel bíró alternatív piacokat (pl. Over 2.5 gól, BTTS & Over 2.5) jelöli ki ajánlott tippnek.
  - **TopPicks Szorzósáv Gyorsválasztó (`src/components/TopPicks.tsx`):** Dedikált szűrő a Nap Top 3 Kiemelt Tippjénél (`🎯 Érték Szorzók 1.50+`, `🌐 Összes Szorzó`, `🛡️ Alacsony Szorzók < 1.50`). A kártyákon fényes zöld szorzó-jelvény mutatja a játszható értékpiacokat.
  - **Scanner Szorzósáv Szűrő (`src/components/ScannerView.tsx` & `scannerService.ts`):** Új `🎯 Érték Sáv (1.55 - 2.45)` preset és beépített `Min. Odds` választó (1.01+, 1.40+, 1.55+, 1.75+, 2.00+).
- **Nagyobb és Folyamatosan Forgó 3D Labda (`src/components/Logo.tsx`, `Header.tsx`):**
  - **Nagyobb, tiszta megjelenés:** A fejlécben a méret 38px-ről **46px-re nőtt**, a belső renderelési sugár a doboz **97%-át** kitölti, így a fotorealisztikus textúra és a FIFA 2026 embléma kiválóan látható.
  - **Folyamatos, megállásmentes rotáció:** A forgási szög és állapot perzisztens `useRef`-be került, így az egér mozgatása és a hover állapot NEM nullázza le a pozíciót, a labda sosem akad meg.
  - **Optimális forgási sebesség:** ~16 másodperces lágy, nyugodt és elegáns 3D fordulat, ami jól észrevehetően és folyamatosan forog.

## [1.16.4] - 2026-10-20

### Javítva & Fotorealisztikus 3D Grafika (Fixed & Photorealistic Graphics)
- **100% Fotorealisztikus adidas TRIONDA PRO FIFA 2026 Hivatalos Meccslabda (`src/components/Logo.tsx`):**
  - **4-Nézetes Ortogonális Stúdiófotó-Szintézis:** A korábbi procedurális/szintetikus vektorrajz és torzuló textúra helyett 4 db 8K stúdióminőségű termékfotó (Elölnézet 0°, Jobb oldal 90°, Hátulnézet 180°, Bal oldal 270°) egyesítéséből felépített teljes 360°-os panorámatérkép.
  - **Hiteles Hivatalos Elemek:** Eredeti arany FIFA World Cup 2026 trófeás embléma, modern adidas 3-bar Performance logó és a hivatalos „FIFA CONNECTED BALL TECHNOLOGY” szenzoros pecsét.
  - **A 3 Rendező Nemzet Színei & Motívumai:** USA kobaltkék hullám fehér csillagokkal, Mexikó smaragdzöld hullám azték/sas-toll mintázattal, Kanada rubinpiros hullám éles juharlevél geometriával, mindezt körbeölelő elegáns fémes pezsgő-arany szalagokkal.
  - **Kétszeres Bilineáris Textúra-Szűrés:** A lebegőpontos UV koordináták bilineáris simításával 100%-ban megszűnt a pixelesedés, a recés körvonal és a forgás közbeni vibrálás (aliasing).
  - **Letisztult, Prémium Megjelenés:** A gyermeteg, arcade stílusú szaggatott radar/techno karikák eltávolításra kerültek; a labda a logóterület 92%-át tiszta, büszke, prémium formában tölti ki lágy talaj- és térárnyékkal.
  - **Nyugodt, Méltóságteljes 3D Forgás:** Megtartva a lassú (~60 másodperces teljes körbefordulás) természetes dőlt tengelyű rotációt 60 FPS sebességgel.

## [1.16.3] - 2026-10-19

### Hozzáadva & Vizuális Élmény (Added & Visual Enhancement)
- **3D Animált FIFA 2026 Világbajnokság Hivatalos Meccslabda (`src/components/Logo.tsx`):**
  - A bal felső fejléc-ikon átalakult a 2026-os FIFA Világbajnokság hivatalos meccslabdájának (**adidas Trionda**) élethű, folyamatosan forgó 3D modelljévé.
  - **Hiteles 2026 VB Dizájn:** Forradalmi 4-paneles aerodinamikai szerkezet mélyvarrásokkal, az USA (kobaltkék), Mexikó (smaragdzöld) és Kanada (rubinpiros) dinamikus hullámpaneleivel, valamint arany FIFA trófea szegéllyel.
  - **Fénytani & 3D Sugárkövetés (Orthographic Sphere Raycasting):** 14°-os tengelydőlés, rögzített bal felső megvilágítás, Phong spekuláris csillogás és peremfény a labda ívelt felületén.
  - **60 FPS Precomputed LUT:** Kevesebb mint 0.5 ms / képkocka számítási igény, láthatóság-érzékeny CPU/akkumulátorkímélés, valamint interaktív hover gyorsítás és kattintásra induló szuperspin.

## [1.16.2] - 2026-10-19

### Javítva & Biztonsági Optimalizáció (Fixed & Security/Stability)
- **Valós Élő API Adatok Garanciája (`src/App.tsx`):**
  - Megszűnt a csendes és félrevezető visszatérés a beépített mock mintameccsekre (`MOCK_MATCHES`).
  - Hálózati hiba vagy üres API válasz esetén a rendszer kizárólag üres listát és egyértelmű, transzparens hiba/figyelmeztető sávot jelenít meg egykattintásos `Újrapróbálás` gombbal.
  - A szimulált mintaadatok kizárólag akkor töltődnek be, ha a felhasználó a Beállításokban kézzel kiválasztja a „Beépített Offline Szimulációs Motor” üzemmódot.
- **HTTP 429 Kvótavédelem & 0 Extra Hálózati Kérés (`src/services/footballDataApi.ts`):**
  - Megszűnt a korábbi 8 párhuzamos API lekérés a befejezett meccsekért, amely másodpercek alatt kimerítette a Football-Data.org ingyenes tier-jének 10 kérés/perc sebességkorlátját.
  - A Dixon-Coles modellek közvetlenül a már letöltött meccsekből helyben a memóriában épülnek fel, így 1 kérés történik 9 helyett (100% kvótatakarékosság).
- **Lekérdezési Időablak Javítása (`src/services/footballDataApi.ts`):**
  - A `dateTo` időablak `+2` napra bővült, megszüntetve a 00:00 UTC cutoff problémát, így a holnapi 9 valós Bajnokok Ligája mérkőzés azonnal bekerül a kínálatba.
- **Bajnokok Ligája és Európai Kupa Empirikus Priorok (`src/services/dixonColesFitting.ts`):**
  - Beépített európai klub-priorok (`EUROPEAN_CLUB_PRIORS`) a topcsapatokra (Man City, PSG, Barcelona, Liverpool, Dortmund, Napoli, Roma, Atleti stb.), amelyek pontos xG-t és megbízható Dixon-Coles predikciókat szolgáltatnak kupa meccseken is.

## [1.16.1] - 2026-10-19

### Javítva & Továbbfejlesztve (Fixed & Enhanced)
- **Scanner Időszak & Státusz Választó (`src/components/ScannerView.tsx`):**
  - Dedikált, azonnal elérhető idősáv-választó gombok: `⚡ Mai Értéktippek`, `📅 Holnapi Meccsek`, `🌐 Összes Nyitott Meccs`, és `🏁 Lezárt / Archív EV`.
  - Dinamikus találatszámláló az éppen aktív szűrésre.
- **Fogadható Meccsek Alapértelmezése (`src/services/scannerService.ts`):**
  - A Scanner alapértelmezetten kizárólag a fogadható (`UPCOMING` és `LIVE`) mérkőzéseket vizsgálja és rangsorolja (`statusFilter: 'open_only'`), így a korábban lezárt meccsek nem nyomják el a mai és holnapi lehetőségeket.
  - A lezárt meccsek külön kérésre, a `Lezárt / Archív EV` gombra kattintva bármikor ellenőrizhetők visszamenőleges elemzéshez.
- **Időzóna-biztos Dátumszűrés:**
  - Áttérés a `getRelativeDateStr` központi helyi időzónás dátumkezelőre a `.toISOString()` UTC-eltolódásának megszüntetésére.

## [1.16.0] - 2026-10-19

### Hozzáadva (Added)
- **Nemzetközi Kupák Integrációja (API-Sports & Football-Data.org):**
  - **Bajnokok Ligája (UEFA Champions League, ⭐):** Bekötve az API-Sports (`id: 2`, `ucl`) és Football-Data (`CL`) végpontokon, empirikus kupa gólátlagokkal (hazai: 1.74, vendég: 1.34).
  - **Európa Liga (UEFA Europa League, 🏆):** Bekötve az API-Sports (`id: 3`, `uel`) és Football-Data (`EL`) forrásokon, sajátos gólátlagokkal (hazai: 1.66, vendég: 1.30).
  - **Konferencia Liga (UEFA Conference League, 🟢):** Bekötve az API-Sports (`id: 848`, `uecl`) és Football-Data (`EC`) forrásokon (hazai: 1.62, vendég: 1.26).
- **Kupameccs Statisztika & Dixon-Coles Modellezés:**
  - A nemzetközi kupák magasabb tempójához és intenzívebb gólvárakozásához optimalizált paraméterek, amelyek automatikusan illeszkednek a bivariáns Dixon-Coles és Poisson mátrix kalkulációkba.
- **Kupaszűrés & Prioritás a Meccslistában (`src/components/StatsGrid.tsx`):**
  - Kiemelt prioritás a ligasávban (Bajnokok Ligája: 5, Európa Liga: 6, Konferencia Liga: 7).
  - Kettős alias feloldás (`ucl`/`cl`, `uel`/`el`, `uecl`/`ec`), így bármely forrásból származik a kupameccs, a ligagomb egységesen szűri.
- **Frissített Beállítások Dialógus (`src/components/SettingsModal.tsx`):**
  - Kiemelt kupajelvények (⭐ Bajnokok Ligája, 🏆 Európa Liga, 🟢 Konferencia Liga) és egyértelmű tájékoztató szöveg.
- **7 Új Automatizált Vitest Egységteszt (`cupCompetitions.test.ts`):**
  - A teljes tesztcsomag **55/55 sikeres tesztre** bővült, 0 hiba és 0 figyelmeztetés az Oxlint ellenőrzésen.

## [1.15.0] - 2026-10-19

### Hozzáadva (Added)
- **Pulzáló Élő Meccs Kapszula a Fejlécben (`src/components/Header.tsx`):**
  - Élénk piros, animált pulzáló (`animate-ping`) élő meccs számláló kapszula a fejléc jobb felső műveleti sávjában.
  - Közvetlen kattintásra automatikusan átvált a meccslistára és bekapcsolja az élő szűrőt.
  - Ha nincs folyamatban lévő meccs, diszkrét mentesített jelzőként funkcionál.
- **Élő Mérkőzések Gyorsszűrő Kapcsoló (`src/components/StatsGrid.tsx`):**
  - Dedikált „Csak Élő” gomb a vezérlősávban valós idejű mérkőzésszámlálóval és pulzáló jelvénnyel.
  - Globális eseményvezérlés (`focitipp_filter_live`): Fejlécből történő kattintásra azonnal megnyitja és beállítja az élő találkozók listáját.
  - Intelligens üres állapot kezelés gyorsgombbal a szűrő visszakapcsolására.
- **Valós Idejű Élő Eredmény & Perc Jelzések a Felületen:**
  - Játékperc (`minute'`), hazai és vendég gólok és lezárási állapot azonnali renderelése.

## [1.14.0] - 2026-10-19

### Hozzáadva (Added)
- **Kvantitatív Értékkereső & Piacvizsgáló (`src/components/ScannerView.tsx`):**
  - Teljes körű piacvizsgáló modul a teljes meccskínálatból kinyert fogadási lehetőségek automatikus rangsorolásával.
  - 8 db intelligens preset kapszula: 💎 +EV Értéktippek, 🎯 Kiemelt MI Tippek, ⚽ Over 2.5 Gólradar, 🥅 Mindkét Csapat Lő (BTTS), 🛡️ Erős Favoritok, ⚡ 1. Félidő >0.5 Gól, 💣 Értékes Meglepetések és Összes lehetőség.
  - Dinamikus szűrő- és rendezősáv: Valós idejű kereső csapatra és ligára, bajnokságválasztó, minimum modell-esély küszöbök (50%+, 60%+, 70%+) és 5-irányú rendezés (+EV %, Valószínűség, Szorzó, Negyed-Kelly méret, Kezdési idő).
  - Találati kártyák valós Pinnacle/Bet365 vagy szimulált bukmékeri oddsokkal, várható éllel (+EV %), Negyed-Kelly tőkeallokációval és közvetlen szelvényre tevéssel.
- **Bajnokság Statisztikai & Értékradar Nézet:**
  - Kvantitatív liga-ranglista átlagos várható gólok (xG), Over 2.5 gyakoriság, BTTS arány és top gólvárakozású mérkőzés szerint rendezve.
- **Navigáció Bővítése (`src/components/Header.tsx`, `src/App.tsx`):**
  - Új `scanner` tab bekötve mind az asztali navigációs sávba, mind a mobil 6-oszlopos kompakt gombsorba.
  - Dinamikus `React.lazy` és `Suspense` kód-felosztás a minimális bundle méret megőrzése érdekében.
- **Dedikált Scanner Szolgáltatás & 3 Új Egységteszt (`scannerService.ts`, `scannerService.test.ts`):**
  - Összesen 48 db sikeres Vitest egységteszt, 100%-os típusbiztonság és 0 Oxlint hiba/figyelmeztetés.

## [1.13.0] - 2026-10-19

### Hozzáadva (Added)
- **ScoreLab Csapat-összehasonlító Kártya (`src/components/ScoreLabH2HCard.tsx`):**
  - Forma- és momentum-index: Az utolsó 5 mérkőzés pontozása (W=3p, D=1p, L=0p, max 15p) és arányos vizualizációja.
  - Kétoldalas dinamikus összehasonlító sávok: Várható gólok ($xG$), támadási hatékonyság ($\alpha$), védelmi stabilitás ($\beta$, alacsonyabb a kedvezőbb) és lőtt/kapott gólátlagok.
  - Felső intelligens modell-összegző panel a legfőbb meccsdinamikai és előny-tényezőkkel.
- **Részletes Egymás Elleni Történet (Head-to-Head):**
  - Rögzített H2H találkozók esetén: Győzelmi mérleg (Hazai, Döntetlen, Vendég), átlagos H2H gólszám, mindkét csapat szerez gólt (BTTS) arány és a korábbi összecsapások eredményei kártyákon.
  - Új vagy közvetlen múlt nélküli párosításoknál: Intelligens szimulált összecsapási elemzés a csapatok szezonbeli Dixon-Coles MLE paraméterei és aktuális formája alapján.
- **Bivariáns Dixon-Coles Poisson Gólmátrix (`src/components/ScoreLabPoissonMatrix.tsx`):**
  - Interaktív 5x5-ös pontos végeredmény valószínűségi hőtérkép cellánkénti esélyekkel és fair szorzókkal ($1/p$).
  - Top 6 legvalószínűbb pontos végeredmény rangsor (pl. 🥇 1-1, 🥈 2-1, 🥉 1-0) kimeneteli színkódolással (1, X, 2).
  - Gólszám-intervallum sávok (0-1 gól, 2-3 gól, 4+ gól) és 1X2 mátrix zónák összesítése.
- **3-utas Fülválasztó a Meccs Részletekben (`src/components/MatchDetailModal.tsx`):**
  - `[📊 Áttekintés & Oddsok]`, `[⚔️ H2H & Csapatok]`, `[🎯 Poisson Mátrix]` fülek az áttekinthető, modern navigációért.
- **ScoreLab Szolgáltatás & 7 Új Egységteszt (`scoreLabService.ts`, `scoreLabService.test.ts`):**
  - Összesen 45 db sikeres Vitest egységteszt, 100%-os matematikai stabilitás és 0 Oxlint hiba/figyelmeztetés.

## [1.12.0] - 2026-10-19

### Hozzáadva (Added)
- **Nemzetközi Bajnokságok Bővítése (Football-Data & API-Sports):**
  - Portugál Primeira Liga (`PPL` / `94`)
  - Belga Jupiler Pro League (`144`)
  - Török Süper Lig (`203`)
  - Osztrák Tipico Bundesliga (`218`)
  - Svájci Credit Suisse Super League (`207`)
  - Skót Premiership (`179`)
  - Lengyel PKO BP Ekstraklasa (`106`)
  - Görög Super League 1 (`197`)
  - Amerikai Major League Soccer / MLS (`253`)
- **Intelligens Kereszt-API Mérkőzés Deduplikáció (`src/App.tsx`):** Normalizált csapatnév- és dátum-összevetés révén kiszűri a duplikált mérkőzéseket, ha mindkét API szolgáltatná ugyanazt a találkozót (pl. Primeira Liga).
- **Valós Történelmi Gólátlagok & Dixon-Coles Bajnokság-modellek (`src/services/apiSportsClient.ts`):** Minden új ligához dedikált hazai és vendég gólátlagok, biztosítva a pontos Poisson eloszlásokat és Kelly-méretezést.
- **Dinamikus Ligarendezés és Alias Támogatás (`src/components/StatsGrid.tsx`):** Az új ligák azonnal szűrhetők, saját prioritással és országzászlókkal jelennek meg a ligasávban.
- **Frissített Beállítások Szövegezés (`src/components/SettingsModal.tsx`):** Egyértelműen tájékoztat a bővített európai élvonalbeli bajnokságokról és másodosztályokról.

## [1.11.0] - 2026-10-18

### Hozzáadva (Added)
- **Automatizált Vitest Egységteszt Csomag (`src/services/__tests__/`):** 38 db egységteszt lefedettség a matematikai és elszámolási motorra (`betEvaluation.test.ts`: 19 teszt, `predictionEngine.test.ts`: 14 teszt, `bankrollService.test.ts`: 5 teszt). A tesztfuttatás beépítésre került a GitHub Actions CI munkafolyamatba (`npm test`).
- **Dedikált Matematikai Szelvénykiértékelő Modul (`src/services/betEvaluation.ts`):** Új, tiszta függvényekből álló motor a fogadási piacok szigorú kiértékelésére, félidős és végeredmény támogatással.
- **Kódfelosztás és Lazy Loading (`src/App.tsx`):** A másodlagos nézetek (`BankrollView`, `ResultsView`, `MethodologyView`) és a nehéz modális ablakok (`MatchDetailModal`, `SettingsModal`, `AboutModal`) dinamikus `React.lazy` és `Suspense` betöltést kaptak, csökkentve a fő JS csomag méretét 384 KB-ra (109 KB gzip).
- **Szelvényépítő Korreláció-figyelmeztetés (`src/components/BetSlipDrawer.tsx`):** Azonos mérkőzésből származó piacok (pl. BTTS + Over 2.5) észlelése esetén automatikus figyelmeztetés jelenik meg, jelezve a szorzott esély torzítását.
- **LocalStorage Kvótavédelem és Cache Purgálás (`historyService.ts`, `apiSportsClient.ts`):** 150 meccses plafon az archívumnak és `QuotaExceededError` elkapás, valamint naponta lefutó elavult API-Sports cache takarítás az 5 MB böngészőkvóta megvédésére.

### Javítva (Fixed)
- **Szelvénykiértékelés String-Matching Hibájának Megszüntetése:** A `evaluatePickWon` korábban magyar csapatneveket tartalmazó címkéknél (pl. `Arsenal (1)`) hibásan az alapértelmezett `totalGoals > 2.5`-re esett vissza. Az új motor egzakt piac-kódok (`PickMarket`) és végződések (`(1)`, `(2)`, `(x)`) alapján értékel, ismeretlen piacnál pedig sosem könyvel tévesen, hanem `null`-t ad.
- **Félidős Piac (`FH_OVER_05`) Helyes Kiértékelése:** A félidős piacok a korábbi teljes meccs helyett mostantól kizárólag a félidős gólok (`homeHalfTimeScore`, `awayHalfTimeScore`) alapján záródnak le; hiányzó félidős adatnál nem történik téves kiértékelés a 2. félidős gólokból.
- **Erős Szignál Küszöb Bekötése (`SettingsModal.tsx`, `StatsGrid.tsx`):** A beállításokban megadott `focitipp_threshold` (alapértelmezett: 65%) mostantól közvetlenül érvényesül a mérkőzésrács „Csak Kiemelt Jelek” szűrőjében és dinamikus gombfeliratában.
- **Felesleges / Halott Fájlok Eltávolítása:** `src/App.css`, `src/assets/react.svg`, `vite.svg` és `src/assets/hero.png` törölve a repóból.
- **Prop-higiénia:** `Header.tsx` mostantól megjeleníti az `isLiveApi` státuszt, a `StatsGrid.tsx` táblázat pedig felhasználja a szelvényelemeket az aktív tétek vizuális kiemelésére.

## [1.10.0] - 2026-10-18

### Hozzáadva (Added)
- **Dupla Dinamikus Statisztika-Választó Sáv (ScoreLab stílus):** Két független lenyíló választó a vezérlősávban (`1.` és `2.` számozott kapszulák), amivel a felhasználó szabadon kiválaszthatja, melyik 2 kvantitatív mutató jelenjen meg a meccssorokon.
- **ScoreLab Kompakt Meccslista Nézet:** Horizontális meccssoros felület két folyamatjelző pill-lel és közvetlen szelvényre tevéssel.
- **Kedvenc Mérkőzések (My Matches):** Mérkőzések csillagozása és kiemelése a lista tetejére aranyszínű blokkban.
- **Háromirányú Nézetváltó:** Kompakt lista, Kártyák és 11 oszlopos Részletes Táblázat nézet szabadon választható és perzisztens módon mentve.

## [1.9.1] - 2026-10-18

### Javítva & Biztonság (Fixed & Security)
- **React Rules of Hooks Szabálysértés Megszüntetése (`MatchDetailModal.tsx`):** A korábban a feltételes korai visszatérés (`if (!match) return null;`) után elhelyezett hook-hívások (`useState`, `useEffect`) feltétel nélkül, a komponens legtetejére kerültek. Ezzel megszűnt a renderek közötti dinamikus hook-szám váltakozás (0 ↔ 4) és a modális ablak megnyitásakor/bezárásakor fellépő összeomlásveszély.
- **Valódi Szigorú TypeScript Mód Bekapcsolása (`tsconfig.app.json`, `tsconfig.node.json`):** A korábban csak névleges szigorúságot jelentő konfiguráció helyett aktiválásra került a `"strict": true`, `"noImplicitAny": true` és `"strictNullChecks": true` a teljes projektben. A teljes forráskód 0 hibával és 0 figyelmeztetéssel felel meg a szigorú típusbiztonsági követelményeknek.
- **CI Titokszivárgás Megszüntetése és SHA-256 Hash Alapú Titokkeresés (`.github/workflows/ci.yml`):** A CI munkafolyamatból eltávolításra kerültek a korábban keresési mintaként plaintextben beírt API-kulcsok. Helyüket általános, regex alapú auth-fejléc/kulcs formátum-ellenőrzés és SHA-256 ujjlenyomatos hash-vizsgálat vette át, így a CI fájl önmaga többé nem tartalmaz és nem szivárogtat titkokat.

## [1.9.0] - 2026-10-18

### Hozzáadva (Added)
- **Valódi Dixon–Coles (1997) MLE Paraméter-illesztő Motor (`dixonColesFitting.ts`):** A korábbi kézzel beírt 17 csapatos `TEAM_POWER` tábla és a lapos másodosztályú konstansok teljes törlése. A rendszer a szezonban már lejátszott mérkőzésekből, iteratív arányos illesztéssel (Iterative Proportional Fitting Poisson MLE) és exponenciális időbeli súlyozással ($\xi = 0.0025$) számítja ki minden csapat valós támadóerejét ($\alpha_i$), védelmi gyengeségét ($\beta_i$), a hazai pálya előnyt ($\gamma$) és a $\rho$ korrekciót.
- **Dinamikus Bajnokság-szintű Modell Gyorsítótár (`dixonColesFitting.ts`, `api/matches.ts`):** 24 órás Edge- és kliensoldali gyorsítótár a szezonális mérkőzésadatokra, ami minimális kvótafogyasztás mellett biztosít valós idejű, egzakt statisztikai modellt.
- **Dixon–Coles Paraméter-kijelző Panel (`MatchDetailModal.tsx`):** A mérkőzés részleteiben megjelenik mindkét csapat egzakt illesztett $\alpha$ (támadás) és $\beta$ (védelem) mutatója, a $\gamma$ hazai előny, a $\rho$ érték és az illesztéshez felhasznált befejezett meccsek száma.
- **Lejátszási Dátum és Időpont Kijelzése Lezárt Meccseknél (`ResultsView.tsx`, `StatsGrid.tsx`, `MatchDetailModal.tsx`):** A lezárult mérkőzéseken mostantól minden felületen (Eredmények archívuma, Mérkőzésrács táblázat- és kártyanézet, Részletes modális ablak) közvetlenül látható a meccs naptári napja (`kickoffDate`) és kezdési időpontja (`kickoffTime`).
- **Színátmenetes Hátterek & Enyhe Rácsos Háló (`index.css`, minden komponens):** Az alkalmazás minden háttere (főoldal, fejléc, lábléc, statisztikai KPI sáv, mérkőzéskártyák, táblázatok, eredmény- és bankroll-kártyák, modális ablakok és fiókok) modern, gazdag sötét színátmenetet (`linear-gradient`) és enyhe, elegáns rácsos háló réteget (`bg-mesh-*`) kapott finom környezeti smaragd és borostyán fényekkel.

### Javítva & Integritás (Fixed & Integrity)
- **First-run Dishonesty Felszámolása a Tétnaplóban (`bankrollService.ts`):** Az új felhasználók többé nem kapnak automatikusan generált, nem létező nyertes szelvényeket (+5 280 Ft, +3 400 Ft). A tétnapló 100%-ig tiszta, üres kezdőállapottal indul.
- **Kitalált Sikerráta Törlése (`HeroKpi.tsx`, `App.tsx`):** A beégetett „Tegnap: 83% találat” felirat törölve. A rendszer kizárólag akkor ír ki sikerrátát, ha ténylegesen léteznek tegnapi lezárt meccsek az archívumban, amit valós eredményekből számol. Ellenkező esetben transzparens modell-státuszt mutat.
- **Önbeteljesítő Körkörös „+EV” Felszámolása (`TopPicks.tsx`):** Szimulált bukmékeri oddsoknál tilos piaci értéktöbbletet hazudni. A felület transzparensen a fair szorzót mutatja, és csak valós külső odds jelenlétekor számol piaci előnyt.

## [1.8.0] - 2026-10-18

### Hozzáadva (Added)
- **3D Interaktív Forgó Labda (`ThreeDBall.tsx`):** Valódi 3D szférikus focilabda komponens orbitális tech részecskegyűrűkkel (`preserve-3d`), kattintás- és hover-érzékeny gyorspörgés-effektussal a fejlécben és a Hero sávban.
- **3D Kártya Döntési Hatás (3D Tilt Effect, `TopPicks.tsx`):** A Nap Top 3 kiemelt kártyája dinamikus, egérmozgásra lágyan billenő 3D perspektívát és rétegzett mélységet (`translateZ`) kapott.
- **Tartós Múltbeli Eredmény Archívum (`historyService.ts`, `ResultsView.tsx`):** A lezárt mérkőzések a helyi tárhelyen (`localStorage`) folyamatosan felhalmozódnak és megőrződnek; új időszaki szűrőkkel (Összes archivált, Ma, Tegnap, 7 nap) és archívum-statisztikával.
- **Tartós Fogadási Szelvény Tárolás (Draft Persistence, `App.tsx`):** Az összeállított szelvénytervezet a böngésző tárhelyén korlátlan ideig megmarad oldalfrissítés vagy PWA újraindítás után is.

### Javítva & Módosítva (Fixed & Changed)
- **Színvilág Finomítása (Túl Sok Sárga Eltávolítása):** A korábbi harsány neonsárga gombok, keretek és aktív tabok helyett modern, professzionális smaragdzöld (`emerald-600`) akciógombok, elegáns sötét pala és zafír navigáció került bevezetésre.
- **Szigorú Top Pick Szűrés (`TopPicks.tsx`):** A λ-rácson instabilnak minősülő `ELVETVE` ítéletű tippek kizárásra kerültek a kiemelt ajánlások közül; a Top 3-ba kizárólag sziklaszilárd `ROBUSZTUS` vagy `valószínű` kimenetelek kerülhetnek.
- **Gördíthető Beállítások Modal & Dedikált Vissza Gombok (`SettingsModal.tsx`):** A beállítások ablak `max-h-[90vh]` korlátozást és görgethető tartalmat kapott, valamint jól látható „← Vissza” navigációs gombok kerültek a fejlécbe és a láblécbe.
- **Teljes Szélességű Bajnokság Választó & Görgető Nyilak (`StatsGrid.tsx`):** A liga választó sáv teljes szélességű lett, bal/jobb görgetőgombokkal és „Összes liga kibontása” több soros váltóval, így a LaLiga után lévő ligák sem vágódnak le többé.

## [1.7.0] - 2026-10-18

### Biztonság (Security - 1. szakasz)
- **API Kulcsok Eltávolítása a Kódból és Bundle-ből (`vite.config.ts`, `SettingsModal.tsx`, `App.tsx`, `footballDataApi.ts`, `apiSportsClient.ts`):** Minden beégetett API-kulcs és részleges kulcsrészlet törölve a verziózott forrásfájlokból. A kulcsok kizárólag a `.gitignore`-olt `.env.local` fájlból és a Vercel környezeti változókból töltődnek be (`.env.example` sablonnal).
- **Vercel Serverless Proxyk Lezárása (`api/matches.ts`, `api/apisports.ts`):**
  - `Access-Control-Allow-Origin: *` helyett szigorú origin-ellenőrzés (`403 Forbidden` idegen domainről).
  - Bemeneti paraméterek (`dateFrom`, `dateTo`, `date`: `YYYY-MM-DD`, `fixture`: pozitív egész szám) szigorú formátum-validációja (`400 Bad Request`).
  - Tartalék (fallback) API kulcsok törlése (`503` hiányzó szerveroldali kulcs esetén) és IP-alapú rate limiting (`429 Too Many Requests`).

### Javítva & Módosítva (Fixed & Changed - 1. és 2. szakasz)
- **Őszinte Feliratok & Demó Adat Sáv (`App.tsx`, `ResultsView.tsx`, `TopPicks.tsx`, `MatchDetailModal.tsx`):** A „Verifikált Modell Teljesítmény” és szimulált „+EV” feliratok helyett „Szimulált Modell Teljesítmény & Becsült ROI Archívum”, illetve „Becsült Odds / Fair szorzó” szerepel. Tartalék (mock) adatok használatakor jól látható borostyánsárga **„Demó adat (szimulált mód)”** figyelmeztető sáv jelenik meg.
- **Piacfüggő Robusztussági Teszt (`predictionEngine.ts`):** A `robustnessGridTest` mostantól megkapja a konkrét célpiacot (`1`, `X`, `2`, `OVER_25`, `UNDER_25`, `BTTS_YES`, `BTTS_AND_OVER_25`), és a $\lambda$-rácson annak valószínűségét értékeli ki. Minden kézzel beégetett `'ROBUSZTUS'` / `'valószínű'` címke és a másodosztályú `charCodeAt(0)` heurisztika törölve; egységes `buildMatchQuantAndPick` függvény szolgálja ki mindkét API klienst.
- **Egzakt Közös Valószínűség a Dixon–Coles Mátrixból (`predictionEngine.ts`):** A `BTTS és Over 2.5` együttes esélye (`bttsAndOver25`) közvetlenül a $11 \times 11$-es bivariáns Poisson gólmátrixból számolódik ($i > 0 \land j > 0 \land i+j > 2.5$), kiváltva a korábbi `(a * b) / 80` heurisztikát és megszüntetve a duplán számolt $\times 1.15$-ös hazai előnyt.
- **Egységes Dátum- és Időzóna-kezelés (`src/utils/dateUtils.ts`, `StatsGrid.tsx`, `footballDataApi.ts`):** Közös helyi időzóna-alapú dátumformázó; a „Ma” fül többé nem mutat más napi meccseket üres találat esetén; a Football-Data API hívás explicit 3 napos (`dateFrom=tegnap`, `dateTo=holnap`) ablakot kér le.
- **Network-First Service Worker & Verziófrissítési Jelzés (`public/sw.js`, `main.tsx`, `App.tsx`):** A navigációs kérések (`index.html`) Network-First stratégiát használnak, új Service Worker verzió elérhetőségekor pedig interaktív **„Új alkalmazásverzió érhető el – Frissítés most”** sáv jelenik meg.
- **Reprodukálható Lockfile & GitHub Actions CI (`package-lock.json`, `.github/workflows/ci.yml`):** Verziózott `package-lock.json` és automatizált CI pipeline (`npm ci`, `tsc -b`, `oxlint --deny-warnings`, `vite build`, valamint kulcsszivárgás-ellenőrzés).

## [1.6.0] - 2026-10-17

### Hozzáadva (Added)
- **Saját Bankroll Követő & Tétnapló (Bet Tracker, `BankrollView.tsx`):** Teljes értékű tőkemenedzsment és fogadáskövető modul dinamikus egyenlegszámítással, testreszabható kezdőtőkével és valós idejű nettó profit kalkulációval (+/- Ft).
- **Személyes ROI % & Statisztikai KPI Rács:** Realizált megtérülés (ROI %), találati arány (Strike Rate %), függőben lévő lekötött tőke, valamint átlagos odds és tétösszeg követése.
- **Közvetlen Szelvény Rögzítés a Szelvényépítőből (`BetSlipDrawer.tsx`):** Egykattintásos elmentés a tétnaplóba, beépített Negyed-Kelly kitettség ellenőrzéssel (>10% bankroll arány esetén intelligens kockázati figyelmeztetés) és opcionális jegyzeteléssel.
- **Automatikus Szelvény Kiértékelés (Auto-Evaluate):** A mérkőzés adatbázisban található befejezett találkozók tényleges végeredményei alapján a függőben lévő szelvények egykattintásos automatikus kiértékelése és egyenleghez írása, intelligens korai veszteség-felismeréssel.
- **Kézi Tét Rögzítés & Tetszőleges Esélyfelvitel:** Kézi felviteli modal egyedi, külső vagy offline mérkőzések és speciális oddsok naplózásához.
- **Teljes Adatmentés & Biztonság (`bankrollService.ts`):** Tétnapló exportálása és importálása JSON formátumban, egykattintásos mintaadat-visszaállítás és kezdőtőke módosítás.
- **5-oszlopos Navigáció & Élő Bankroll Chip (`Header.tsx`):** Élő egyenleg-kijelző chip a felső fejlécben és optimalizált 5-elemes mobil tab-váltó (`Top`, `Rács`, `Eredmény`, `Bankroll`, `Módszer`).

## [1.5.0] - 2026-10-17

### Hozzáadva (Added)
- **Progresszív Webalkalmazás (PWA) Támogatás (`manifest.json`):** Mobilra és asztali böngészőbe közvetlenül telepíthető natív standalone alkalmazásként böngészősáv nélkül.
- **Intelligens Service Worker (`sw.js`):** Kettős gyorsítótárazási stratégia (Cache-First a statikus eszközökre, Network-First az API hívásokra) intelligens offline tartalék üzemmóddal.
- **Alkalmazáson belüli Telepítés Rendszer (`Header.tsx`):** Egy kattintásos közvetlen telepítés indító gomb az automatikus `beforeinstallprompt` esemény alapján, valamint Standalone PWA állapotjelző jelvény.
- **Nagyfelbontású PWA Ikoncsomag (`public/icons/`):** 192x192 és 512x512 méretű PNG ikonok, Apple Touch Icon és frissített 3D SoccerAI SVG logó.

## [1.4.0] - 2026-10-17

### Hozzáadva (Added)
- **Piac-specifikus Szűrés & Elemzés (`ResultsView.tsx`):** Külön szűrhető és elemezhető piaci kategóriák (BTTS, Over 2.5, Kombinált, 1X2, Under 2.5) az Eredmények nézetben.
- **Interaktív Piaci Teljesítmény Sáv:** 5 db kattintható mini-KPI kártya piacok szerinti eseményszámmal, nyerési aránnyal és virtuális ROI%-kal.
- **Virtuális ROI & Profit Szimulátor:** 10 000 Ft-os bázistéttel számított tiszta nyereség (+Ft), tőkearányos megtérülés (ROI %) és átlagos nyertes szorzó.
- **Többszintű Szűrőrendszer:** Státusz szerinti gyorsválasztó (Mind, Nyert, Vesztes), bajnokság választó és kártyánkénti nettó hozam kijelzés.
- **Bővített Archívum (`mockMatches.ts`):** Valósághű befejezett meccsek a Premier League, La Liga, Serie A, Ligue 1, Bundesliga és NB I ligákból.

## [1.3.0] - 2026-10-17

### Hozzáadva (Added)
- **Élő Bukmékeri Odds Integráció (`apiSportsClient.ts`, `api/apisports.ts`):** Valós piaci szorzók lekérése az API-Sports `/odds` végponton keresztül Pinnacle, Bet365, William Hill, BetVictor és Marathonbet irodáktól 1X2, Over/Under 2.5 és BTTS piacokra.
- **Piaci Élek és Érték (+EV %) Kijelzés (`MatchDetailModal.tsx`):** A meccs részletezőben megjelenő dedikált panel, amely összehasonlítja a kvantitatív Dixon–Coles fair szorzókat a valós bukmékeri oddsokkal, kiszámítja a bukmékeri árrést (vig) és zölddel jelzi a pozitív várható értéket (+EV).
- **Pinnacle vs Bet365 vs Legjobb Piaci Oddsok Fülválasztó:** Egy kattintásos váltás az éles záró árak (Pinnacle), a mainstream piac (Bet365) és az egész piac legjobb szorzói között.
- **60 perces Odds Kvóta-védelem:** Napi 100 API kéréses limit megóvása igény szerinti (on-demand) meccsszintű lekéréssel és helyi gyorsítótárazással.

## [1.2.1] - 2026-10-17

### Hozzáadva (Added)
- **Mobilos Kompakt Kártyanézet (`StatsGrid.tsx`):** Mobilon (<768px) automatikusan reszponzív kártyás elrendezésben (`MatchCardsList`) jelennek meg a mérkőzések a széles táblázat vízszintes görgetésének kiváltására.
- **Nézetváltó gombpár (`Táblázat 📊` / `Kártyák 🃏`):** Bármikor egy kattintással váltható a részletes hőtérkép-táblázat és a reszponzív kártyarács között.

## [1.2.0] - 2026-10-17

### Hozzáadva (Added)
- **API-Sports (API-Football) szolgáltató integráció (`apiSportsClient.ts`):** 5 új bajnokság valós mérkőzésadatai: 🇪🇸 LaLiga 2 (Segunda División), 🇫🇷 Ligue 2, 🇮🇹 Serie B, 🇩🇪 2. Bundesliga és 🇭🇺 NB I (OTP Bank Liga).
- **Vercel Serverless API-Sports Proxy (`api/apisports.ts`):** 30 perces felhő Edge CDN gyorsítótár a napi 100 kéréses ingyenes keret védelmére és a böngészős CORS áthidalására.
- **Beállítások Másodosztály-kezelő (`SettingsModal.tsx`):** API-Sports fiókstátusz kijelzés, kulcskezelés és egygombos ki/bekapcsoló a másodosztályú ligákhoz.
- **Dinamikus ligaszűrő bővítés (`StatsGrid.tsx`):** Az új ligák automatikusan megjelennek a ligaszűrő chipek között prioritás szerint.

## [1.1.1] - 2026-10-17

### Javítva (Fixed)
- **Eredmények kiértékelési hiba (`ResultsView.tsx`):** A befejezett mérkőzések kiértékelése mostantól a tényleges gólok és a piac alapján történik (`evaluatePickWon`). A 2:2-es végeredmény 2.5 felett és BTTS piacon már helyesen zöld / nyertesként jelenik meg a korábbi téves „NEM JÖTT BE” helyett.
- **Dinamikus nyerési arány kalkuláció:** A felső KPI doboz a valós befejezett meccsekből számolja a modellsikerességet a korábbi fix 83.3% helyett.
- **Tippválasztási szűk keresztmetszet megszüntetése (`footballDataApi.ts`):** Az egyoldalú Over 2.5 dominancia helyett intelligens, többpiacos (BTTS, Over 2.5, BTTS & 2.5 felett, Hazai/Vendég győzelem, 2.5 alatt) értékelés került bevezetésre.

## [1.1.0] - 2026-10-17

### Hozzáadva (Added)
- **4 füles kompakt Dashboard navigáció (`Header.tsx`, `App.tsx`):** Különválasztott `🔥 Napi Top Tippek` (alapértelmezett nyitó fül), `📊 Mérkőzés Rács`, `🏆 Eredmények` és új `📐 Módszertan` fülek a hosszú függőleges görgetés megszüntetésére.
- **Módszertan & Hőtérkép Segédlet nézet (`MethodologyView.tsx`):** Dedikált referencia fül a hőtérkép színskála, a fókuszpiacok (`[I]`, `[A]`, `[B]`, `[G]`, `[D]`, `[C]`) és a Dixon–Coles / Shin / $\lambda$-rács / Negyed-Kelly modellek részletes magyarázatával.
- **Összecsukható (Accordion) bajnokság-panelek (`StatsGrid.tsx`):** A *Minden Bajnokság* nézetben a ligák fejlécére kattintva egyenként összecsukhatók és kinyithatók a táblázatok, kiemelt szignál-számlálóval.

### Módosítva (Changed)
- **Kompakt 1 soros Állapotsáv (`HeroKpi.tsx`):** A korábbi ~400px magas nyitó szekciót egyetlen keskeny, információdús állapotsáv és hőtérkép jelmagyarázat váltotta fel.
- **Alapértelmezett Premier League szűrő (`StatsGrid.tsx`):** A Mérkőzés Rács fül alapértelmezés szerint a Premier League mérkőzéseivel nyit (automatikus visszaállással az összes ligára, ha az adott napon nincs PL-mérkőzés).
- **Kompakt Top Tippek nézet (`TopPicks.tsx`):** A Top 3 kiemelt kártya alatt 6 db kompakt kártyán jelennek meg a további erős (60%+) szignálok, a teljes 39 meccses táblázat duplikálása nélkül.

## [1.0.0] - 2026-10-17

### Hozzáadva (Added)
- **Élő Football-Data.org API integráció:** Valós napi mérkőzések lekérése és Vercel Serverless proxy (`/api/matches`) Edge cache-sel.
- **Kvantitatív Elemző Motor:** Dixon–Coles (1997) korrigált bivariáns Poisson mátrix ($\rho = -0.13$), Shin (1992) bukmékeri de-vigging, $\lambda$-rács robusztussági szűrő és $\lambda$-inverzió gólpiac-validáció.
- **Negyed-Kelly (Quarter-Kelly) tétméretezés:** Konzervatív bankroll-menedzsment ajánlások.
- **Statisztikai Esély Rács (Stats Grid):** 8 piacra kiterjedő valószínűségi hőtérkép és fókuszpiac választó (`[I]`, `[A]`, `[B]`, `[G]`, `[D]`, `[C]`).
- **Napi Top AI Tippek (Top Picks):** Szigorú robusztussági szűrőn átment, legmagasabb várható értékű (+EV) ajánlások.
- **Interaktív Szelvényépítő & Eredménykövető:** Kumulált szorzók és forintosított kifizetési kalkuláció.
- **Egyedi 3D Vektoros Focilabda Logó (`Logo.tsx`):** Fémes arany peremmel és AI orbitális ívekkel ellátott prémium embléma.
- **Alkalmazáson belüli Verziójelző & Névjegy Modál (`AboutModal.tsx`):** Kattintható verziószám a fejlécben és láblécben, részletes kiadási információkkal és release notes-szal.
- **10 perces intelligens háttérfrissítés:** Automatikus mérkőzésfrissítés kizárólag aktív böngészőfül esetén.

### Javítva (Fixed)
- **Mobilos menüsor elrendezés:** A fejléc többé nem lóg ki kis kijelzőkön; a fő navigációs fülek külön szegmentált alsó sávba kerültek.
- **Mobilos vízszintes elmozdulás megszüntetése:** Globális `touch-action: pan-y; overflow-x: hidden;` és táblázat-szintű `touch-pan-x` + overscroll izoláció.
- **Bajnokság-szűrés és csoportosítás:** A Football-Data.org versenykódjainak (`PD`, `SA`, `BL1`, `ELC`, `FL1`, `DED`, `BSA`) kanonikus leképezése, így mind a 39 mérkőzés elérhető és szűrhető.

### Módosítva (Changed)
- `package.json` verziószám frissítve `0.0.0` -> `1.0.0`, és projekt név beállítva `soccerai`-ra.
- Teljes független arculat kialakítása, harmadik félre utaló hivatkozások törlése.
