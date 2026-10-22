# Backtest-kísérletek jegyzőkönyve

Minden kísérlet ugyanazon a walk-forward backtesten készült (5 liga, football-data.co.uk; bemelegítés 2023/24, **hangolás 2024/25**, **holdout 2025/26**, N = 1752; lásd `docs/backtest-report.md`). Elfogadási kritérium: a holdout 1X2 log-loss javulása. A paramétert mindig a hangolási szezonon választottuk, a holdout csak igazolt.

Alapállapot (v1.27.1): ξ = 0,0015, K = 5. Holdout log-loss **0,9981** (piac: 0,9776, naiv: 1,0718).

## 1. ξ és K hangolása (elfogadva, v1.27.1)

5 × 5 rács, majd finomítás. A fennsík széles (ξ = 0,001–0,002, K = 4–6). Holdout: 1,0004 → 0,9982. Reprodukció: `npx tsx scripts/backtest-tune.ts`.

## 2. Utólagos kalibráció: döntetlen-korrekció és hőmérséklet (elutasítva)

A hangolási szezonon d = 0,975, τ = 1,00 adódott; a holdouton 0,9982 → 0,9983. A modell átlagosan kalibrált (holdout döntetlen: 25,2% modell, 25,5% tényleges), nincs mit korrigálni.

## 3. Hazai/idegenbeli erősség szétválasztása (elutasítva)

Csapatonként négy, 1,0 felé húzó szorzó (otthoni/idegenbeli támadás és védelem, páronként geometriai átlag 1,0), regularizációs erősség K_s:

| K_s | Hangolás | Holdout |
| ---: | ---: | ---: |
| (nincs szétválasztás) | 0,9895 | **0,9981** |
| 5 | 0,9976 | 1,0088 |
| 10 | 0,9948 | 1,0058 |
| 20 | 0,9920 | 1,0030 |
| 40 | 0,9905 | 1,0007 |
| 80 | 0,9897 | 0,9993 |

A log-loss a regularizációval monoton javul a szétválasztás nélküli értékhez közelítve: a csapatonkénti hazai/idegenbeli különbség egy szezon adatában zaj, nem jel. **Nem adoptáltuk.**

## 4. Feljutó (ismeretlen) csapatok kezdeti erőssége (elutasítva)

Az ismeretlen csapat erőssége a modellben 1,0 (ligaátlag). Gyengébb kezdeti értékkel (támadás/védelem): 0,95/1,05, 0,9/1,1, 0,85/1,15, 0,8/1,2.

Holdout: 0,9980, 0,9980, 0,9981, 0,9982 (alap: 0,9981). A hangolási szezonon enyhe javulás látszik (0,9895 → 0,9874), a holdouton nincs. **Nem adoptáltuk.**

## 5. Kisebb ligák: közelebb van-e a modell a piachoz? (nincs bizonyíték)

16 "extra liga" (football-data.co.uk) és kontrollként a top-5, mind ugyanazzal a záró referenciával (a bukmékerek átlaga, AvgC), walk-forward, hangolt paraméterekkel (`npx tsx scripts/backtest-extra.ts`, részletes táblázat: `docs/backtest-extra-leagues.md`). Hipotézis: a kisebb ligák piaca gyengébb, ezért ott kisebb a modell–piac rés.

- A rés (modell − piac log-loss, holdout 2025-07-től) a top-5-ön 0,013–0,034, az extra ligákon 0,008–0,043. Nem szisztematikusan kisebb.
- Egy liga hibája kb. ±0,014 (N ≈ 300, a meccsenkénti log-loss-különbség szórása ≈ 0,25), ezért a ligák közti különbségek jórészt zajok. Csak a norvég (0,042), svéd (0,043) és japán (0,038) rés látszik a top-5 felső sávja fölött.
- Egyik ligán sem előzi meg a modell a piacot. A "piaci előny" hipotézist nem támasztja alá az adat.
- **A modell mint önálló becslő** ott értékes, ahol nincs piaci ár: a naivhoz képest a log-loss-előnye Norvégiában 0,089, Brazíliában 0,046, Mexikóban 0,046, Finnországban 0,047, Japánban 0,050, Írországban 0,044, Dániában 0,042, Romániában 0,042, Svédországban 0,037. Gyenge (≈ 0–0,02) Lengyelországban (−0,001), Ausztriában (0,008), az USA-ban (0,017) és Argentínában (0,018). Az orosz minta kicsi (176 meccs), nem értékelhető.
- Korlát: az átlagos záró ár kevésbé éles, mint a Pinnacle, ezért a rés kissé alulbecsült.

## Reprodukció

A 3. és 4. kísérlet kódja az `feat/home-away-split` ágon van (nem merge-elt): `fitDixonColesModel` 7. paramétere (`homeAwaySplitStrength`), a `computeExpectedGoalsFromModel` 7. paramétere (`unknownTeamPrior`) és a `scripts/backtest-structure.ts`. Futtatás az ágon: `npx tsx scripts/backtest-structure.ts`.

## Következtetés

A modell a záró piacnál kb. 0,02 log-loss-szal rosszabb, és a gólokból tanuló, csak szerkezetet változtató módosítások ezt nem zárják be. A piac olyan információt árul (felállás, sérülések, lövésminőség, hírek), amit a gólok nem hordoznak. További pontosságjavulás várhatóan csak új információs forrástól jön (pl. xG-adat), ami külön adatforrás-vizsgálatot igényel.

Gyakorlati következmény: ha az app valós szorzót ismer egy meccsre, a legpontosabb elérhető valószínűség a de-vigelt piaci ár (a keverési súly 0, lásd `src/services/marketBlend.ts`). A modell ott ad hozzáadott értéket, ahol nincs piaci ár.
