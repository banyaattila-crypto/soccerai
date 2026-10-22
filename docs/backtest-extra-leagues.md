# Kisebb ligák backtestje: modell vs. piac

Generálva: 2026-10-22. Forrás: football-data.co.uk (top-5 ligák és 16 "extra liga"). Záró referencia mindenhol a bukmékerek átlaga (AvgC), a Pinnacle záró ár az újabb sorokból hiányzik. Walk-forward, kézi prior nélkül, hangolt paraméterek (ξ = 0,0015, K = 5). Holdout: 2025-07-01-től; hangolás: 2024-07-01 – 2025-06-30. A * jelölt ligán a holdout kisebb, mint 150 meccs (megbízhatatlan).

Rés = modell log-loss − piac log-loss (kisebb a jobb; 0: a modell eléri a piacot). Piaci előny a naivhoz = naiv − piac, modell előnye a naivhoz = naiv − modell: azt mutatja, mennyi információ van a piacban, ill. a modellben a puszta gyakorisághoz képest.

| Liga | Holdout N | Naiv | Modell | Piac | Rés (holdout) | Rés (hangolás) | Piac előnye a naivhoz | Modell előnye a naivhoz |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Oroszország | 176 | 1.0716 | 0.9582 | 0.9782 | **-0.0200** | 0.0053 | 0.0934 | 0.1134 |
| Argentína | 704 | 1.0868 | 1.0688 | 1.0605 | **0.0083** | 0.0121 | 0.0263 | 0.0180 |
| Brazília Série A | 573 | 1.0482 | 1.0021 | 0.9893 | **0.0128** | 0.0353 | 0.0589 | 0.0461 |
| Premier League (kontroll) | 380 | 1.0793 | 1.0254 | 1.0122 | **0.0132** | 0.0139 | 0.0671 | 0.0539 |
| Írország | 236 | 1.0863 | 1.0420 | 1.0274 | **0.0146** | 0.0304 | 0.0589 | 0.0443 |
| Lengyelország | 403 | 1.0671 | 1.0682 | 1.0520 | **0.0162** | 0.0116 | 0.0151 | -0.0011 |
| Dánia | 258 | 1.0767 | 1.0346 | 1.0167 | **0.0179** | 0.0196 | 0.0599 | 0.0420 |
| La Liga (kontroll) | 380 | 1.0464 | 0.9817 | 0.9631 | **0.0186** | 0.0371 | 0.0832 | 0.0646 |
| Románia | 417 | 1.0614 | 1.0190 | 0.9987 | **0.0203** | 0.0305 | 0.0627 | 0.0424 |
| Serie A (kontroll) | 380 | 1.0851 | 0.9987 | 0.9781 | **0.0206** | 0.0283 | 0.1070 | 0.0864 |
| Bundesliga (kontroll) | 306 | 1.0704 | 0.9736 | 0.9493 | **0.0243** | 0.0433 | 0.1211 | 0.0968 |
| Kína | 336 | 1.0682 | 1.0290 | 1.0030 | **0.0261** | 0.0606 | 0.0652 | 0.0391 |
| Mexikó | 451 | 1.0688 | 1.0228 | 0.9966 | **0.0262** | 0.0299 | 0.0722 | 0.0460 |
| Svájc | 288 | 1.0710 | 1.0396 | 1.0107 | **0.0289** | 0.0113 | 0.0603 | 0.0314 |
| Ausztria | 246 | 1.0684 | 1.0606 | 1.0314 | **0.0292** | 0.0018 | 0.0370 | 0.0078 |
| USA (MLS) | 700 | 1.0661 | 1.0487 | 1.0193 | **0.0294** | 0.0209 | 0.0468 | 0.0174 |
| Finnország | 267 | 1.0757 | 1.0291 | 0.9995 | **0.0296** | 0.0304 | 0.0762 | 0.0466 |
| Ligue 1 (kontroll) | 306 | 1.0616 | 1.0083 | 0.9748 | **0.0335** | 0.0264 | 0.0868 | 0.0533 |
| Japán J1 | 272 | 1.0677 | 1.0173 | 0.9796 | **0.0377** | 0.0167 | 0.0881 | 0.0504 |
| Norvégia | 330 | 1.0265 | 0.9375 | 0.8961 | **0.0415** | 0.0370 | 0.1304 | 0.0889 |
| Svédország | 326 | 1.0669 | 1.0299 | 0.9873 | **0.0426** | 0.0093 | 0.0796 | 0.0369 |
