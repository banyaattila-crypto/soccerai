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

## Reprodukció

A 3. és 4. kísérlet kódja az `feat/home-away-split` ágon van (nem merge-elt): `fitDixonColesModel` 7. paramétere (`homeAwaySplitStrength`), a `computeExpectedGoalsFromModel` 7. paramétere (`unknownTeamPrior`) és a `scripts/backtest-structure.ts`. Futtatás az ágon: `npx tsx scripts/backtest-structure.ts`.

## Következtetés

A modell a záró piacnál kb. 0,02 log-loss-szal rosszabb, és a gólokból tanuló, csak szerkezetet változtató módosítások ezt nem zárják be. A piac olyan információt árul (felállás, sérülések, lövésminőség, hírek), amit a gólok nem hordoznak. További pontosságjavulás várhatóan csak új információs forrástól jön (pl. xG-adat), ami külön adatforrás-vizsgálatot igényel.

Gyakorlati következmény: ha az app valós szorzót ismer egy meccsre, a legpontosabb elérhető valószínűség a de-vigelt piaci ár (a keverési súly 0, lásd `src/services/marketBlend.ts`). A modell ott ad hozzáadott értéket, ahol nincs piaci ár.
