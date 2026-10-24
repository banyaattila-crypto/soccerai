# Fogadási protokoll (v1)

A protokoll célja, hogy a "jó tipp" fogalma a mérés előtt, utólag nem módosítható szabályként rögzített legyen. Az app nem válogat utólag a nyertes tippek között, és a szabály módosítása új verziót, új mérést jelent.

## Szabály (v1)

| Feltétel | Érték | Indok |
| :--- | :--- | :--- |
| Szorzó forrása | valós, friss szorzó a naplózáskor | a szimulált ár nem piaci ár |
| Piac | 1X2, Over/Under 2.5 | csak ezekre van piaci referencia (fair ár) |
| Ár-előny | +2% … +20% a piaci konszenzus de-vigelt fair árához (szorzó · fair − 1) | 2% alatt a zaj nagyobb az előnynél; 20% fölött elavult vagy hibás ár a valószínű |
| Modell–piac eltérés | legfeljebb 5 pp; 5–12 pp figyelmeztetés; 12 pp fölött kizárt | docs/backtest-disagreement.md: nagy eltérésnél a piac a pontosabb (12+ pp: 66%-ban) |
| Szorzó | 1,50 – 4,00 | a nagyon kis és nagy szorzók hozamszórása kezelhetetlen |
| Idő a kezdésig | a naplózás és a kezdés között legalább 20 perc | a tipp megfogadható legyen |
| Napi keret | kezdési naponként legfeljebb 5 tipp, a naplózás sorrendjében | nincs utólagos válogatás |
| Tét | fix 1 egység (papír) | a Kelly-tét a modellhibára érzékeny |

Az eltérés 1X2 tippnél a három kimenetel legnagyobb eltérése (a backtest mértéke). Over/Under tippnél a 2.5 gólos valószínűség eltérése. Az Over/Under piacra a backtest nem készült, ezért ott a küszöb kiterjesztés; a kártya külön mutatja a két piac eredményét.

## Hogyan kerül a mérésbe

1. Naplózáskor a rekordra kerül a protokoll-bélyeg: verzió, a szabály ujjlenyomata (`proto-…`) és a modell–piac eltérés. A bélyeg csak valós szorzón naplózott tippre kerül.
2. A "protokoll-tipp" döntés a rekordból és a bélyegből minden megjelenítéskor újraszámolódik, nem tárolt eredmény. A szabály módosítása ezért nem írja át a régi mérést: az új verziójú szabály csak az új verziójú bélyeggel rendelkező rekordokat számolja.
3. A statisztika: lezárt tippek száma, találati arány, papír ROI a 95%-os intervallummal, legnagyobb visszaesés, átlagos CLV és a belépéskori ár-előny.

## Éles fogadási kapu

Az app csak akkor jelzi az "Éles fogadásra alkalmas" állapotot, ha egyszerre teljesül:

1. legalább 100 lezárt protokoll-tipp,
2. legalább 100 CLV-minta, és a CLV 95%-os intervallumának alsó széle pozitív,
3. a papír ROI nem negatív.

Leállítandó, ha a CLV bizonyítottan negatív (n ≥ 50, az intervallum felső széle < 0), vagy 100 lezárt tipp után a ROI intervallumának felső széle is negatív.

Az "alkalmas" állapot sem garancia: kis tétet és kerethatárt jelent, és a mérést tovább kell folytatni.

## Korlátok

- A naplót a böngésző tárolja, ezért a mérés eszközönként eltér. A szerveroldali tracker (docs/tracker.md) mérésével összevonni külön lépés.
- A záró ár frissítése az API-Sports szorzójára támaszkodik. Amíg a fiók felfüggesztett, a CLV lassabban gyűlik.
- A küszöbök kezdeti becslések. Módosításukhoz új verzió kell, és az új verzió mérése nulláról indul.

---

# B protokoll: magas valószínűségű tippek (v1)

Célja a nagy találati arány olyan áron, ami nem rosszabb a fair árnál. A nagy valószínűség önmagában nem jövedelmező: egy 80%-os tippnek a fair szorzója 1,25, a bukmékeri ár ennél jellemzően kisebb, és a piaci árrés (a 2025/26-os holdout szezonon minden kimenetelre fogadva −6,1%) hosszú távon felemészti a hozamot. Ezért az ár feltétele kötelező.

| Feltétel | Érték |
| :--- | :--- |
| Szorzó forrása | valós, friss szorzó a naplózáskor |
| Piac | 1X2, Over/Under 2.5 |
| Piaci (de-vigelt) valószínűség | legalább 70% |
| Szorzó | 1,25 – 1,70 |
| Ár-előny a fair árhoz (legjobb iroda) | 0% … +20% (a legjobb ár nem rosszabb a fair árnál) |
| Modell–piac eltérés | legfeljebb 5 pp |
| Idő a kezdésig | legalább 20 perc |
| Napi keret | kezdési naponként legfeljebb 5 tipp |
| Tét | fix 1 egység (papír) |

Egy meccsről egy B-tipp készül: a feltételeknek megfelelő kimenetelek közül a legnagyobb piaci valószínűségű. A B-tippek külön, write-once naplóba kerülnek (`soccerai_prob_pick_log_v1`), mert a fő tipp (aiPick) a játszható 1,55-2,40 szorzókat keresi, és a magas valószínűségű jelöltek általában kisebb szorzójúak.

## Éles fogadási kapu (B)

Mind a négy feltételnek egyszerre kell teljesülnie:

1. legalább 100 lezárt tipp,
2. kalibráció: a tényleges találati arány nem marad szignifikánsan (z < −1,96) a naplózáskori becsült valószínűség alatt,
3. legalább 100 CLV-minta, az átlagos CLV nem negatív (az ár nem rosszabb a záró fair árnál),
4. a papír ROI nem negatív.

Leállítandó: ha a találati arány szignifikánsan rosszabb a becsültnél, a CLV bizonyítottan negatív, vagy 100+ lezárt tippel a ROI teljes intervalluma negatív.

---

# Valós fogadások és a protokoll

A protokoll papíron, a naplózáskori (legjobb) áron mér. A ténylegesen megkötött fogadás ára, irodája és eredménye eltérhet (késés, árváltozás, tétkorlát). Ezért a protokoll-tippek mellett a "Megfogadtam" gombbal rögzíthető a valós fogadás (iroda, kapott szorzó, tét), a Tétnaplóban a tipphez kötve. A "Protokoll-fogadások" kártya méri:

- az átlagos ár-eltérést a kapott és a naplózott szorzó között (negatív: rosszabb ár, mint amit a protokoll feltételezett),
- a valós ROI-t és ugyanezen tippek papír ROI-ját (a különbség a gyakorlati költség),
- irodánként a fogadások számát, az ár-eltérést és a valós hozamot.

Ha a valós ROI tartósan elmarad a papírétól, vagy egy iroda rendszeresen rosszabb árat ad, az a protokoll gyakorlati hasznát csökkenti, akkor is, ha a papír mérés jó.
