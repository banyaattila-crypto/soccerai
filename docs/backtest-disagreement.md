# Modell–piac eltérés elemzése

Generálva: 2026-10-23T06:02:46.442Z. Forrás: football-data.co.uk, 5 liga, walk-forward predikciók (3504 meccs, hangolási + holdout szezon). Záró referencia: Pinnacle (Shin).

Eltérés = max_k |modell_k − piaci fair_k| az 1X2 három kimenetelén, százalékpontban. Rés = modell log-loss − piac log-loss meccsenként (pozitív: a piac pontosabb). A "piac jobb" a meccsek aránya, ahol a piac log-lossa kisebb.

| Eltérés (pp) | N | Modell LL | Piac LL | Átlagos rés ± SE | Piac jobb |
| :--- | ---: | ---: | ---: | ---: | ---: |
| 0–3 | 727 | 0.9599 | 0.9596 | 0.0003 ± 0.0018 | 51.3% |
| 3–5 | 754 | 0.9911 | 0.9873 | 0.0038 ± 0.0032 | 54.5% |
| 5–8 | 834 | 0.9973 | 0.9815 | 0.0158 ± 0.0050 | 61.2% |
| 8–12 | 656 | 1.0023 | 0.9773 | 0.0250 ± 0.0082 | 61.3% |
| 12+ | 533 | 1.0282 | 0.9256 | 0.1026 ± 0.0151 | 66.4% |

Olvasat: ha az átlagos rés minden sávban pozitív, és az eltéréssel nő, akkor a modell és a piac közti nagy eltérés a modell hibájának jele, nem rejtett értéké.
