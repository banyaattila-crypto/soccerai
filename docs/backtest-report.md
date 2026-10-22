# Backtest jelentés

Generálva: 2026-10-22T18:32:16.671Z. Forrás: football-data.co.uk (Pinnacle záró és nyitó szorzók). Ligák: Premier League, La Liga, Serie A, Bundesliga, Ligue 1.
Szezonok: bemelegítés 2023/24 (csak tanít), hangolás 2024/25, **holdout 2025/26** (a súlyt nem látta).
Walk-forward: egy meccset csak a nála korábbi meccsekből illesztett modell jósol, a kézi klub-priorok nélkül; újraillesztés hetente.

## 1X2 pontosság a holdout szezonon (kisebb a jobb)

| Forrás | N | Log-loss | Brier | RPS |
| :--- | ---: | ---: | ---: | ---: |
| Naiv (gyakoriság) | 1752 | 1.0718 | 0.6483 | 0.2293 |
| Modell (Dixon–Coles) | 1752 | 0.9982 | 0.5951 | 0.2037 |
| Piac (Pinnacle záró, Shin) | 1752 | 0.9776 | 0.5822 | 0.1976 |
| Keverék (modell súly 0) | 1752 | 0.9776 | 0.5822 | 0.1976 |

Over/Under 2.5 log-loss (N=1752): modell 0.6890, piac 0.6733, keverék (súly 0) 0.6733.

## Fogadási szimuláció a holdout szezonon (nyitó Pinnacle szorzón)

| Forrás | Küszöb | Fogadás | Állított EV | Valós ROI | CLV | z |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| Nyers modell | EV > 0% | 2064 | 16.0% | -10.5% | -5.7% | -2.80 |
| Nyers modell | EV > 2% | 1805 | 18.1% | -12.5% | -5.9% | -3.07 |
| Nyers modell | EV > 5% | 1455 | 21.6% | -16.6% | -6.1% | -3.60 |
| Keverék (nyitó piac, w=0) | EV > 0% | 0 | 0.0% | 0.0% | 0.0% | 0.00 |
| Keverék (nyitó piac, w=0) | EV > 2% | 0 | 0.0% | 0.0% | 0.0% | 0.00 |
| Keverék (nyitó piac, w=0) | EV > 5% | 0 | 0.0% | 0.0% | 0.0% | 0.00 |

Viszonyítás: minden kimenetelre fogadva a hozam -6.1% (a piac árrése).
Hangolási görbe (tune szezon, 1X2 log-loss a modell súlyának függvényében): w=0: 0.9602; w=0.05: 0.9608; w=0.1: 0.9614; w=0.2: 0.9629; w=0.3: 0.9648; w=0.5: 0.9698; w=0.75: 0.9784; w=1: 0.9895.

CLV: a nyitó szorzó és a záró, de-vigelt fair ár különbsége. Tartósan pozitív CLV az egyetlen megbízható jele a piacnál jobb információnak.

## Ligánként (holdout, 1X2 log-loss)

| Liga | N | Modell | Piac | Keverék |
| :--- | ---: | ---: | ---: | ---: |
| Premier League | 380 | 1.0261 | 1.0146 | 1.0146 |
| La Liga | 380 | 0.9815 | 0.9636 | 0.9636 |
| Serie A | 380 | 0.9991 | 0.9774 | 0.9774 |
| Bundesliga | 306 | 0.9751 | 0.9494 | 0.9494 |
| Ligue 1 | 306 | 1.0063 | 0.9773 | 0.9773 |
