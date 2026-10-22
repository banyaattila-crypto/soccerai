# Backtest jelentés

Generálva: 2026-10-22T17:36:37.530Z. Forrás: football-data.co.uk (Pinnacle záró és nyitó szorzók). Ligák: Premier League, La Liga, Serie A, Bundesliga, Ligue 1.
Szezonok: bemelegítés 2023/24 (csak tanít), hangolás 2024/25, **holdout 2025/26** (a súlyt nem látta).
Walk-forward: egy meccset csak a nála korábbi meccsekből illesztett modell jósol, a kézi klub-priorok nélkül; újraillesztés hetente.

## 1X2 pontosság a holdout szezonon (kisebb a jobb)

| Forrás | N | Log-loss | Brier | RPS |
| :--- | ---: | ---: | ---: | ---: |
| Naiv (gyakoriság) | 1752 | 1.0718 | 0.6483 | 0.2293 |
| Modell (Dixon–Coles) | 1752 | 1.0004 | 0.5966 | 0.2042 |
| Piac (Pinnacle záró, Shin) | 1752 | 0.9776 | 0.5822 | 0.1976 |
| Keverék (modell súly 0) | 1752 | 0.9776 | 0.5822 | 0.1976 |

Over/Under 2.5 log-loss (N=1752): modell 0.6855, piac 0.6733, keverék (súly 0) 0.6733.

## Fogadási szimuláció a holdout szezonon (nyitó Pinnacle szorzón)

| Forrás | Küszöb | Fogadás | Állított EV | Valós ROI | CLV | z |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| Nyers modell | EV > 0% | 2162 | 19.5% | -15.2% | -6.1% | -4.00 |
| Nyers modell | EV > 2% | 1950 | 21.5% | -16.0% | -6.3% | -3.97 |
| Nyers modell | EV > 5% | 1648 | 24.8% | -16.2% | -6.6% | -3.61 |
| Keverék (nyitó piac, w=0) | EV > 0% | 0 | 0.0% | 0.0% | 0.0% | 0.00 |
| Keverék (nyitó piac, w=0) | EV > 2% | 0 | 0.0% | 0.0% | 0.0% | 0.00 |
| Keverék (nyitó piac, w=0) | EV > 5% | 0 | 0.0% | 0.0% | 0.0% | 0.00 |

Viszonyítás: minden kimenetelre fogadva a hozam -6.1% (a piac árrése).
Hangolási görbe (tune szezon, 1X2 log-loss a modell súlyának függvényében): w=0: 0.9602; w=0.05: 0.9609; w=0.1: 0.9616; w=0.2: 0.9633; w=0.3: 0.9655; w=0.5: 0.9711; w=0.75: 0.9808; w=1: 0.9934.

CLV: a nyitó szorzó és a záró, de-vigelt fair ár különbsége. Tartósan pozitív CLV az egyetlen megbízható jele a piacnál jobb információnak.

## Ligánként (holdout, 1X2 log-loss)

| Liga | N | Modell | Piac | Keverék |
| :--- | ---: | ---: | ---: | ---: |
| Premier League | 380 | 1.0274 | 1.0146 | 1.0146 |
| La Liga | 380 | 0.9842 | 0.9636 | 0.9636 |
| Serie A | 380 | 1.0029 | 0.9774 | 0.9774 |
| Bundesliga | 306 | 0.9786 | 0.9494 | 0.9494 |
| Ligue 1 | 306 | 1.0055 | 0.9773 | 0.9773 |
