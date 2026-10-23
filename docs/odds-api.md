# The Odds API: használat és kreditkeret

Második, az API-Sports-tól független szorzóforrás. Az ingyenes csomag **havi 500 kredit**; a szerveroldali proxy (`api/oddsapi.ts`) rejti a kulcsot (`ODDS_API_KEY`, Vercel környezeti változó).

## Mibe kerül

| Hívás | Kredit |
| :--- | ---: |
| Sportlista (`/sports`) | 0 |
| Egy liga szorzói (`h2h` + `totals`, `eu` régió) | 2 |

## Keret

- Az app naponta legfeljebb **5 liga** lekérését kezdeményezi eszközönként (2 kredit / liga): 5 · 2 · 30 = 300 kredit / hó. A maradék 200 a tartalék (több eszköz, kézi frissítés).
- A liga-válasz 3 órán át gyorsítótárazott a Vercel peremén és a böngészőben, ezért ugyanazt a ligát ugyanabban az időablakban egy másik eszköz nem kéri újra.
- **30 kredit alatt** az app nem kér újat (hónap végi tartalék).
- A proxy ismeretlen lekérdezési paraméterre 400-at ad: a Vercel gyorsítótár kulcsa a teljes URL, így egy tetszőleges extra paraméterrel kijátszható lenne a gyorsítótár, és minden kérés krediteket fogyasztana.

## Hol látszik

Az oldal tetején az állapotsor mutatja a hátralévő krediteket (a szolgáltató válaszfejlécéből: `x-requests-remaining`, `x-requests-used`), ezen az eszközön a napi lekéréseket, és 100 kredit alatt borostyán, 30 alatt piros. A böngésző a lekérések naplóját (idő, liga, hátralévő kredit) a helyi tárban őrzi (`soccerai_oddsapi_ledger_v1`, legfeljebb 120 bejegyzés).

## Miért nincs szerveroldali követő a The Odds API-ra

Egy statisztikailag értelmezhető mérés (100+ CLV-minta) naponta több liga korai és záró pillanatképét, valamint eredményeit igényelné: kb. 8 kredit liga-meccsnaponként. Az 500 kredit havonta kb. 60 liga-meccsnapot fedez, ami kevesebb, mint ami a 100 mintához kell, és az app saját használatát sem hagyná. Fizetős csomaggal (több ezer kredit) ez megoldható; az ingyenes kerettel nem.

## Nem fedett ligák

Nincs a kínálatban: Román Liga I, magyar NB I, Konferencia Liga. BTTS piac az ingyenes csomagban nincs.
