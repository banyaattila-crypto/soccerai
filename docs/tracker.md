# Szerveroldali szorzó-követő (tracker)

A követő a böngészőtől függetlenül, GitHub Actions időzítéssel fut, és azt méri, amiről a rendszer fogadásra való
alkalmasságát el lehet dönteni: **van-e a legjobb bukméker-ár stratégiának tartós előnye a záró árhoz képest.**

> **Állapot (2026-10-24):** az időzítés ki van kapcsolva. Az API-Sports a megosztott felhő-IP-ről (GitHub Actions, Vercel) érkező
> forgalmat a Free csomagnál visszaélésként értékelheti, a fiókot felfüggesztették. A követő csak kézzel indítható
> (`gh workflow run tracker.yml`), amíg a hívás nem megy saját vagy dedikált IP-ről. Visszakapcsolás: a `schedule` blokk
> visszaírása a `.github/workflows/tracker.yml` fájlban.

## Mit csinál

Modell nélkül, tisztán árakból dolgozik (a modell súlya a backtest szerint úgyis 0):

1. A követett ligák meccslistáját naponta néhányszor lekéri (API-Sports `fixtures?date=`).
2. Minden meccshez korai szorzó-pillanatképet vesz (`odds?fixture=`), a kezdés előtt 45 perc és 30 óra között.
3. Ha a **legjobb bukméker szorzója** a konszenzus (Pinnacle, ennek híján legalább 4 bukméker átlaga) de-vigelt
   fair árához képest legalább **+2%** előnyt ad (és nem gyanúsan nagyot, 20% felett), **jelöltet** rögzít (write-once).
4. A jelölthöz a kezdés előtt két ablakban záró pillanatképet vesz: kezdés előtt 100–50 és 35–8 perccel.
5. A meccs végén rögzíti a 90 perces eredményt, és számolja:
   - **CLV** = jelöléskori szorzó · záró fair valószínűség − 1 (95%-os konfidencia-intervallummal),
   - **egységtét-eredmény** (odds − 1 vagy −1).

Az `src/services/tracker/` mappa tartalmazza a logikát (tiszta, tesztelt), a `scripts/tracker/run.ts` a futtatót,
a `.github/workflows/tracker.yml` az időzítést.

## Beállítás (egyszeri)

1. **API-kulcs titokként.** A kulcsot a saját számítógépeden add meg, ne írd be chatbe vagy fájlba:

   ```bash
   gh secret set API_SPORTS_KEY --repo banyaattila-crypto/soccerai
   ```

   (vagy GitHub: Settings > Secrets and variables > Actions > New repository secret, név: `API_SPORTS_KEY`).
   Ugyanaz az API-Sports kulcs, amit a Vercel `API_SPORTS_KEY` környezeti változója használ.

2. **Első futás kézzel:**

   ```bash
   gh workflow run tracker.yml --repo banyaattila-crypto/soccerai
   ```

   Ezután 20 percenként magától fut. A titok nélkül a futás figyelmeztetéssel kihagyja magát (nem hibázik).

3. **Eredmények:** a `tracker-data` ágon (a futás hozza létre) a `README.md` az olvasható összegzés,
   `summary.json` a gépi, `settled.ndjson` a lezárt jelöltek hosszú távú naplója, `state.json` az aktív állapot.
   Ha nem volt teendő, a futás nem commitol.

Opcionális repository változók (Settings > Secrets and variables > Actions > Variables):
`TRACKER_DAILY_BUDGET` (alap: 50), `TRACKER_RESERVE` (alap: 12), `TRACKER_LEAGUES` (vesszővel elválasztott
API-Sports ligaazonosítók; alap: top 5, BL/EL/KL, Eredivisie, Primeira, Championship, Jupiler, Süper Lig, Skót).

## Kvóta

Az API-Sports ingyenes csomagja napi 100 kérés, és ez **közös** az appéval:

| Fogyasztó | Napi keret |
| :--- | ---: |
| Szorzó-követő | 50 (felső korlát; a valós használat kevesebb) |
| App: szorzó-előlekérés a naplózott tippekhez | 15 |
| App: menetrend (a böngésző 45 perces gyorsítótárával) | kb. 20–30 |

A követő a válasz `x-ratelimit-requests-remaining` fejlécéből látja a hátralévő napi kérést, és 12 alatt leáll.
Ha a kvóta mégis szűk, csökkentsd a `TRACKER_LEAGUES` listát vagy a `TRACKER_DAILY_BUDGET`-et.

## Hogyan kell olvasni

- **n < 50:** nem értelmezhető. **n >= 100 és a 95%-os intervallum alsó széle > 0:** valószínű ár-előny.
  A mérce az `Éles fogadás kapuja` (STATUS_REPORT.md, 6. fejezet 0. pont).
- A CLV két részből áll: az **ár-előny a jelöléskor** (a legjobb bukméker ára a konszenzushoz képest, ez árverseny)
  és a **piac-mozgás a jelölt irányába** (a de-vigelt piaci esély változása; ez jelzi, hogy a piac utólag igazat adott-e).
- A **bukmékerenkénti megoszlás** megmutatja, kitől függ az előny. A lágyabb bukmékerek a nyerő ügyfeleket
  korlátozzák: a legjobb ár csak akkor értékes, ha tényleg elérhető a kívánt tétnagyságnál.
- A ROI rövid távon zaj: egy +3% valódi ROI kimutatásához kb. 4000 fogadás kellene.

## Korlátok

- Az ingyenes API-kvóta miatt a követés szűk (néhány liga, néhány pillanatkép). A záró szorzó így közelítés
  (kezdés előtt 8–35 perc), nem a tényleges utolsó ár.
- Egy bukméker pillanatnyi ára lehet elavult vagy hibás; a 20% feletti "előny" ezért nem jelölt.
- A GitHub Actions időzítése nem pontos (percekig késhet), és 60 nap repó-inaktivitás után a GitHub leállítja
  az időzített futásokat (a követő commitjai az adat-ágra ezt nem akadályozzák; ha mégis leállna, kézzel újraindítható).
- A `tracker-data` ágra a Vercel nem épít (`vercel.json`: `git.deploymentEnabled`).
- Nem fogadás-végrehajtó és nem pénzügyi tanács: mérőeszköz.

## Tesztelés

`npx vitest run src/services/tracker` (ütemezés, jelölt, CLV, lezárás, keret, hibák, teljes életciklus hamis API-val).
Helyi próba hamis szerverrel: `TRACKER_API_BASE=http://localhost:PORT API_SPORTS_KEY=x npx tsx scripts/tracker/run.ts --data ./tmp --now <ISO>`.
