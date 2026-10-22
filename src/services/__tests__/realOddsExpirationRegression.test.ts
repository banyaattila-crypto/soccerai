import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getCachedFixtureOdds,
  isOddsExpired,
  getOddsTtlStatus,
  attachCachedRealOddsToMatches,
  ODDS_CACHE_TTL_MS,
  pruneOldApiSportsCache,
  ODDS_CACHE_PREFIX,
  CACHE_KEY,
} from '../apiSportsClient';
import { buildMatchQuantAndPick, quarterKelly } from '../predictionEngine';
import { blendedMarketPct } from '../marketBlend';
import {
  extractOpportunitiesFromMatches,
  filterAndSortOpportunities,
} from '../scannerService';
import { Match, FixtureRealOdds } from '../../types/football';

const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] || null,
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: storageMock,
  writable: true,
});

if (typeof window === 'undefined') {
  (globalThis as any).window = globalThis;
}

describe('Valós Bukméker Oddsok, Lejárat (TTL) és Szimulált Ár Védelem Regresszió', () => {
  const FIXTURE_ID = 555123;
  const FIXTURE_ODDS_CACHE_KEY = `soccerai_odds_cache_${FIXTURE_ID}`;

  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  const createSampleRealOdds = (timestamp: number): FixtureRealOdds => {
    const expiresAt = new Date(timestamp + ODDS_CACHE_TTL_MS).toISOString();
    return {
      fixtureId: FIXTURE_ID,
      updatedAt: '15:30',
      expiresAt,
      ttlMinutes: 60,
      isExpired: false,
      bookmakers: [
        {
          name: 'Pinnacle',
          home: 2.10,
          draw: 3.50,
          away: 3.60,
          over25: 1.75,
          under25: 2.15,
          bttsYes: 1.65,
          margin: 2.8,
        },
        {
          name: 'Bet365',
          home: 2.05,
          draw: 3.40,
          away: 3.95,
          over25: 1.72,
          under25: 2.10,
          bttsYes: 1.62,
          margin: 4.5,
        },
      ],
      pinnacle: {
        name: 'Pinnacle',
        home: 2.10,
        draw: 3.50,
        away: 3.60,
        over25: 1.75,
        under25: 2.15,
        bttsYes: 1.65,
        margin: 2.8,
      },
      bet365: {
        name: 'Bet365',
        home: 2.05,
        draw: 3.40,
        away: 3.95,
        over25: 1.72,
        under25: 2.10,
        bttsYes: 1.62,
        margin: 4.5,
      },
      bestOdds: {
        home: { odd: 2.10, bookmaker: 'Pinnacle' },
        draw: { odd: 3.50, bookmaker: 'Pinnacle' },
        away: { odd: 3.95, bookmaker: 'Bet365' },
        over25: { odd: 1.75, bookmaker: 'Pinnacle' },
        under25: { odd: 2.15, bookmaker: 'Pinnacle' },
        bttsYes: { odd: 1.65, bookmaker: 'Pinnacle' },
      },
    };
  };

  const createBaseMatch = (): Match => ({
    id: `match_${FIXTURE_ID}`,
    apiSportsFixtureId: FIXTURE_ID,
    leagueId: 'pl',
    leagueName: 'Premier League',
    leagueCountry: 'Anglia',
    leagueFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    kickoffTime: '17:30',
    kickoffDate: '2026-10-20',
    status: 'UPCOMING',
    homeTeam: { id: 'ars', name: 'Arsenal', shortName: 'ARS', logo: '', xgAvg: 2.1 },
    awayTeam: { id: 'che', name: 'Chelsea', shortName: 'CHE', logo: '', xgAvg: 1.2 },
    probabilities: {
      homeWin: 58,
      draw: 22,
      awayWin: 20,
      bttsYes: 62,
      over15: 85,
      over25: 68,
      over35: 42,
      fhOver05: 78,
    },
    odds: {
      home: 1.65,
      draw: 4.00,
      away: 5.00,
      bttsYes: 1.55,
      over25: 1.40,
      under25: 2.80,
    },
    aiPick: {
      market: '1',
      marketLabel: 'Arsenal Győzelem (1)',
      probability: 58,
      odds: 1.65,
      confidence: 8.5,
      expectedValue: 0,
      isTopPick: true,
      quarterKellyPct: 0,
      reasoning: 'Kezdeti szimulált tipp',
      isSimulatedOdds: true,
    },
    quantAnalysis: {
      dataQuality: 'A',
      robustnessVerdict: 'ROBUSZTUS',
      minEdge: 5,
      medianEdge: 10,
      posPct: 80,
      quarterKellyPct: 0,
      shinMargin: 3.5,
      shinProbs: { home: 55, draw: 25, away: 20 },
      keyFactors: ['Test'],
      riskLevel: 'Alacsony',
    },
  });

  describe('1. Gyorsítótár TTL és Lejárat Ellenőrzés (apiSportsClient)', () => {
    it('friss gyorsítótárazott odds esetén (<60 perc) érvényesnek jelöli és kiszámolja a hátralévő perceket', () => {
      const now = 1700000000000;
      const cachedTime = now - 20 * 60 * 1000; // 20 perccel korábbi
      const sample = createSampleRealOdds(cachedTime);

      localStorage.setItem(
        FIXTURE_ODDS_CACHE_KEY,
        JSON.stringify({ timestamp: cachedTime, data: sample })
      );

      const res = getCachedFixtureOdds(FIXTURE_ID, now);
      expect(res).toBeDefined();
      expect(res?.isExpired).toBe(false);
      expect(res?.ttlMinutes).toBe(40); // 60 - 20 = 40 perc van hátra
      expect(isOddsExpired(res, now)).toBe(false);

      const status = getOddsTtlStatus(res, now);
      expect(status.isReal).toBe(true);
      expect(status.isExpired).toBe(false);
      expect(status.remainingMinutes).toBe(40);
      expect(status.bookmakerName).toBe('Pinnacle');
    });

    it('lejárt gyorsítótárazott odds esetén (>=60 perc) lezárja a lejárati státuszt (isExpired = true)', () => {
      const now = 1700000000000;
      const cachedTime = now - 65 * 60 * 1000; // 65 perccel korábbi -> LEJÁRT!
      const sample = createSampleRealOdds(cachedTime);

      localStorage.setItem(
        FIXTURE_ODDS_CACHE_KEY,
        JSON.stringify({ timestamp: cachedTime, data: sample })
      );

      const res = getCachedFixtureOdds(FIXTURE_ID, now);
      expect(res).toBeDefined();
      expect(res?.isExpired).toBe(true);
      expect(res?.ttlMinutes).toBe(0);
      expect(isOddsExpired(res, now)).toBe(true);

      const status = getOddsTtlStatus(res, now);
      expect(status.isReal).toBe(true);
      expect(status.isExpired).toBe(true);
      expect(status.remainingMinutes).toBe(0);
    });
  });

  describe('2. attachCachedRealOddsToMatches viselkedése', () => {
    it('érvényes valós bukmékeri odds esetén frissíti a match.odds-ot és pozitív Value/Kelly-t engedélyez', () => {
      const now = 1700000000000;
      const cachedTime = now - 15 * 60 * 1000; // 15 perc
      const sample = createSampleRealOdds(cachedTime);

      localStorage.setItem(
        FIXTURE_ODDS_CACHE_KEY,
        JSON.stringify({ timestamp: cachedTime, data: sample })
      );

      const match = createBaseMatch();
      const [updated] = attachCachedRealOddsToMatches([match], now);

      expect(updated.realOdds).toBeDefined();
      expect(updated.realOdds?.isExpired).toBe(false);
      expect(updated.odds.home).toBe(2.10); // Pinnacle valós odds
      expect(updated.aiPick?.isSimulatedOdds).toBe(false);
      expect(updated.aiPick?.bookmakerName).toBe('Pinnacle');
      expect(updated.aiPick?.ttlMinutes).toBe(45);
      // Az EV a piaci referenciához (Pinnacle fair) mér, nem a nyers modellhez: a korábbi +21,8% (58% · 2,10)
      // helyett legfeljebb néhány százalékos ár-előny (legjobb szorzó vs. Pinnacle) lehetséges.
      expect(updated.aiPick?.expectedValue).toBeLessThan(10);
      expect(updated.aiPick?.expectedValue).toBeGreaterThan(-10);
      expect(updated.aiPick?.quarterKellyPct).toBeGreaterThanOrEqual(0);
    });

    it('lejárt bukmékeri odds esetén szigorúan letiltja és 0-ra állítja a Value (+EV) és Kelly értékeket', () => {
      const now = 1700000000000;
      const cachedTime = now - 75 * 60 * 1000; // 75 perccel korábbi -> LEJÁRT
      const sample = createSampleRealOdds(cachedTime);

      localStorage.setItem(
        FIXTURE_ODDS_CACHE_KEY,
        JSON.stringify({ timestamp: cachedTime, data: sample })
      );

      const match = createBaseMatch();
      const [updated] = attachCachedRealOddsToMatches([match], now);

      expect(updated.realOdds?.isExpired).toBe(true);
      expect(updated.aiPick?.isSimulatedOdds).toBe(true);
      expect(updated.aiPick?.isOddsExpired).toBe(true);
      expect(updated.aiPick?.expectedValue).toBe(0);
      expect(updated.aiPick?.quarterKellyPct).toBe(0);
      expect(updated.quantAnalysis?.quarterKellyPct).toBe(0);
    });

    it('ha egyáltalán nincs valós odds a mérkőzéshez, a szimulált áron a Value és Kelly szigorúan 0 marad', () => {
      const match = createBaseMatch();
      const [updated] = attachCachedRealOddsToMatches([match]);

      expect(updated.realOdds).toBeUndefined();
      expect(updated.aiPick?.isSimulatedOdds).toBe(true);
      expect(updated.aiPick?.expectedValue).toBe(0);
      expect(updated.aiPick?.quarterKellyPct).toBe(0);
    });

    it('soha nem mutálja helyben a bemeneti Match objektumokat (immutabilitás és Object.freeze védelem)', () => {
      const now = 1700000000000;
      const cachedTime = now - 15 * 60 * 1000;
      const sample = createSampleRealOdds(cachedTime);

      localStorage.setItem(
        FIXTURE_ODDS_CACHE_KEY,
        JSON.stringify({ timestamp: cachedTime, data: sample })
      );

      const baseMatch = createBaseMatch();
      const originalHomeOdds = baseMatch.odds.home;

      // Lefagyasztjuk a bemeneti objektumot, hogy bármilyen helyben történő mutáció TypeError-t dobna
      Object.freeze(baseMatch.odds);
      if (baseMatch.aiPick) Object.freeze(baseMatch.aiPick);
      Object.freeze(baseMatch);

      expect(() => {
        const [updated] = attachCachedRealOddsToMatches([baseMatch], now);
        expect(updated).not.toBe(baseMatch);
        expect(updated.odds).not.toBe(baseMatch.odds);
        expect(updated.odds.home).toBe(2.10);
        expect(baseMatch.odds.home).toBe(originalHomeOdds);
      }).not.toThrow();
    });

    it('ha nincs valós odds vagy lejárt, fagyasztott bemeneti Match objektumon sem dob hibát és nem mutálja azt', () => {
      const baseMatch = createBaseMatch();
      baseMatch.apiSportsFixtureId = undefined;
      Object.freeze(baseMatch.odds);
      if (baseMatch.aiPick) Object.freeze(baseMatch.aiPick);
      Object.freeze(baseMatch);

      expect(() => {
        const [updated] = attachCachedRealOddsToMatches([baseMatch]);
        expect(updated).not.toBe(baseMatch);
        expect(updated.aiPick?.isSimulatedOdds).toBe(true);
      }).not.toThrow();
    });
  });

  describe('3. predictionEngine.buildMatchQuantAndPick numerikus invariáns', () => {
    it('szimulált ár esetén (isSimulatedOdds = true) a returned expectedValue és quarterKellyPct szigorúan 0', () => {
      const res = buildMatchQuantAndPick({
        homeTeamName: 'Arsenal',
        awayTeamName: 'Chelsea',
        homeXg: 2.1,
        awayXg: 1.1,
        probabilities: {
          homeWin: 65,
          draw: 20,
          awayWin: 15,
          bttsYes: 55,
          over15: 85,
          over25: 65,
          over35: 40,
          fhOver05: 75,
        },
        odds: {
          home: 1.80, // ha nem lenne szimulált, 0.65 * 1.80 - 1 = +17% lenne
          draw: 3.80,
          away: 5.00,
          bttsYes: 1.65,
          over25: 1.60,
          under25: 2.30,
        },
        dataQuality: 'A',
        leagueLabel: 'Premier League',
        isSimulatedOdds: true, // SZIMULÁLT!
      });

      expect(res.aiPick).toBeDefined();
      expect(res.aiPick?.isSimulatedOdds).toBe(true);
      expect(res.aiPick?.expectedValue).toBe(0);
      expect(res.aiPick?.quarterKellyPct).toBe(0);
      expect(res.quantAnalysis.quarterKellyPct).toBe(0);
    });

    it('valós piaci szorzó esetén (isSimulatedOdds = false) pozitív EV és Kelly kiszámításra kerül', () => {
      const res = buildMatchQuantAndPick({
        homeTeamName: 'Arsenal',
        awayTeamName: 'Chelsea',
        homeXg: 2.1,
        awayXg: 1.1,
        probabilities: {
          homeWin: 65,
          draw: 20,
          awayWin: 15,
          bttsYes: 55,
          over15: 85,
          over25: 65,
          over35: 40,
          fhOver05: 75,
        },
        odds: {
          home: 1.80,
          draw: 3.80,
          away: 5.00,
          bttsYes: 1.65,
          over25: 1.60,
          under25: 2.30,
        },
        dataQuality: 'A',
        leagueLabel: 'Premier League',
        isSimulatedOdds: false, // VALÓS PIACI ODDS!
        // Piaci referencia: a piac szerint a hazai 62%, az Over 2.5 60% -> a 1,80-as szorzón +11,6% ár-előny
        realMarketProbPct: (market, model) =>
          blendedMarketPct(market, model, { p1x2: [0.62, 0.22, 0.16], pOver25: 0.6 }),
      });

      expect(res.aiPick).toBeDefined();
      expect(res.aiPick?.isSimulatedOdds).toBe(false);
      expect(res.aiPick?.expectedValue).toBeGreaterThan(0);
      expect(res.aiPick?.quarterKellyPct).toBeGreaterThan(0);
      expect(res.quantAnalysis.quarterKellyPct).toBeGreaterThan(0);
    });

    it('valós szorzó, de piaci referencia nélkül (nincs realMarketProbPct) az EV és a Kelly 0', () => {
      const res = buildMatchQuantAndPick({
        homeTeamName: 'Arsenal',
        awayTeamName: 'Chelsea',
        homeXg: 2.1,
        awayXg: 1.1,
        probabilities: {
          homeWin: 65,
          draw: 20,
          awayWin: 15,
          bttsYes: 55,
          over15: 85,
          over25: 65,
          over35: 40,
          fhOver05: 75,
        },
        odds: { home: 1.8, draw: 3.8, away: 5.0, bttsYes: 1.65, over25: 1.6, under25: 2.3 },
        dataQuality: 'A',
        leagueLabel: 'Premier League',
        isSimulatedOdds: false,
      });
      expect(res.aiPick?.expectedValue).toBe(0);
      expect(res.aiPick?.quarterKellyPct).toBe(0);
    });
  });

  describe('4. scannerService szűrési és megjelenítési garanciák', () => {
    it('szimulált mérkőzés esetén minden kinyert piacon 0 a várható érték és Kelly', () => {
      const match = createBaseMatch(); // nincs realOdds
      const opps = extractOpportunitiesFromMatches([match]);

      expect(opps.length).toBeGreaterThan(0);
      for (const opp of opps) {
        expect(opp.isRealOdds).toBe(false);
        expect(opp.expectedValue).toBe(0);
        expect(opp.quarterKellyPct).toBe(0);
      }
    });

    it('valós de lejárt odds esetén is 0 a várható érték és a Kelly', () => {
      const match = createBaseMatch();
      const now = 1700000000000;
      const expiredSample = createSampleRealOdds(now - 70 * 60 * 1000);
      expiredSample.isExpired = true;
      match.realOdds = expiredSample;

      const opps = extractOpportunitiesFromMatches([match]);
      const homeOpp = opps.find((o) => o.market === '1');

      expect(homeOpp).toBeDefined();
      expect(homeOpp?.isRealOdds).toBe(true);
      expect(homeOpp?.isExpired).toBe(true);
      expect(homeOpp?.expectedValue).toBe(0);
      expect(homeOpp?.quarterKellyPct).toBe(0);
    });

    it('a best_ev preset soha nem ad vissza szimulált vagy lejárt piacokat', () => {
      const matchSim = createBaseMatch();

      const matchReal = createBaseMatch();
      matchReal.id = 'match_real';
      matchReal.realOdds = createSampleRealOdds(Date.now() - 5 * 60 * 1000);

      const allOpps = extractOpportunitiesFromMatches([matchSim, matchReal]);
      const evOpps = filterAndSortOpportunities(allOpps, {
        preset: 'best_ev',
      });

      expect(evOpps.length).toBeGreaterThan(0);
      expect(evOpps.every((o) => o.isRealOdds === true)).toBe(true);
      expect(evOpps.every((o) => o.isExpired !== true)).toBe(true);
      expect(evOpps.every((o) => o.expectedValue > 0)).toBe(true);
    });

    it('az onlyRealOdds szűrő kizárja az összes szimulált piacot', () => {
      const matchSim = createBaseMatch();
      const matchReal = createBaseMatch();
      matchReal.id = 'match_real';
      matchReal.realOdds = createSampleRealOdds(Date.now() - 5 * 60 * 1000);

      const allOpps = extractOpportunitiesFromMatches([matchSim, matchReal]);
      const onlyReal = filterAndSortOpportunities(allOpps, {
        preset: 'all',
        onlyRealOdds: true,
      });

      expect(onlyReal.length).toBeGreaterThan(0);
      expect(onlyReal.every((o) => o.isRealOdds === true)).toBe(true);
    });
  });

  describe('pruneOldApiSportsCache - localStorage Kvóta és Gyorsítótár Tisztítás', () => {
    const TODAY_STR = '2026-10-21';
    const YESTERDAY_STR = '2026-10-20';

    it('törli a lejárt odds-cache bejegyzéseket az új ODDS_CACHE_PREFIX előtaggal', () => {
      const now = Date.now();
      const freshKey = `${ODDS_CACHE_PREFIX}1001`;
      const expiredKey = `${ODDS_CACHE_PREFIX}1002`;

      // 10 perces friss odds
      localStorage.setItem(
        freshKey,
        JSON.stringify({ timestamp: now - 10 * 60 * 1000, data: { fixtureId: 1001 } })
      );

      // 25 órás elavult odds
      localStorage.setItem(
        expiredKey,
        JSON.stringify({ timestamp: now - 25 * 60 * 60 * 1000, data: { fixtureId: 1002 } })
      );

      pruneOldApiSportsCache(TODAY_STR);

      expect(localStorage.getItem(freshKey)).not.toBeNull();
      expect(localStorage.getItem(expiredKey)).toBeNull();
    });

    it('törli a régebbi legacy api_sports_odds_ és soccerai_apisports_cache_v5_ kulcsokat', () => {
      const now = Date.now();
      const legacyOddsKey = 'api_sports_odds_999';
      const legacyFixtureKey = 'soccerai_apisports_cache_v5_2026-10-19';

      localStorage.setItem(
        legacyOddsKey,
        JSON.stringify({ timestamp: now - 30 * 60 * 60 * 1000, data: {} })
      );
      localStorage.setItem(legacyFixtureKey, JSON.stringify({ data: [] }));

      pruneOldApiSportsCache(TODAY_STR);

      expect(localStorage.getItem(legacyOddsKey)).toBeNull();
      expect(localStorage.getItem(legacyFixtureKey)).toBeNull();
    });

    it('megőrzi az aktuális napi meccscache-t, de törli a korábbi napok meccscache-ét', () => {
      const todayFixtureKey = `${CACHE_KEY}_${TODAY_STR}`;
      const yesterdayFixtureKey = `${CACHE_KEY}_${YESTERDAY_STR}`;

      localStorage.setItem(todayFixtureKey, JSON.stringify({ data: [{ id: 1 }] }));
      localStorage.setItem(yesterdayFixtureKey, JSON.stringify({ data: [{ id: 2 }] }));

      pruneOldApiSportsCache(TODAY_STR);

      expect(localStorage.getItem(todayFixtureKey)).not.toBeNull();
      expect(localStorage.getItem(yesterdayFixtureKey)).toBeNull();
    });

    it('agresszív módban eltávolítja a 2 óránál régebbi vagy lejárt oddsokat', () => {
      const now = Date.now();
      const freshKey = `${ODDS_CACHE_PREFIX}2001`;
      const threeHoursOldKey = `${ODDS_CACHE_PREFIX}2002`;

      localStorage.setItem(
        freshKey,
        JSON.stringify({ timestamp: now - 15 * 60 * 1000, data: { fixtureId: 2001 } })
      );
      localStorage.setItem(
        threeHoursOldKey,
        JSON.stringify({ timestamp: now - 3 * 60 * 60 * 1000, data: { fixtureId: 2002 } })
      );

      pruneOldApiSportsCache(TODAY_STR, true);

      expect(localStorage.getItem(freshKey)).not.toBeNull();
      expect(localStorage.getItem(threeHoursOldKey)).toBeNull();
    });
  });

  describe('Cell-Level Kelly Calculation (StatsGrid handleCellBet logic)', () => {
    it('kiszámolja a cella saját Kelly %-át pozitív EV esetén, és 0-t ad negatív EV-re ahelyett hogy a fő pickjét másolná át', () => {
      // Fő pick: Hazai (1) 65% @ 1.80 -> Kelly > 0
      const homePickKelly = quarterKelly(65, 1.80);
      expect(homePickKelly).toBeGreaterThan(0);

      // Felhasználó a Döntetlen (X) cellára kattint: 20% @ 3.40 (EV = 0.20 * 3.4 - 1 = -32% -> Kelly = 0)
      const drawCellKelly = quarterKelly(20, 3.40);
      expect(drawCellKelly).toBe(0);
      expect(drawCellKelly).not.toBe(homePickKelly);

      // Felhasználó egy olyan piacra kattint, aminek valódi pozitív éle van: 55% @ 2.20
      const valueCellKelly = quarterKelly(55, 2.20);
      expect(valueCellKelly).toBeGreaterThan(0);
      expect(valueCellKelly).toBe(4.4);
    });

    it('szimulált odds vagy lejárt odds esetén szigorúan 0 Kelly-t ad át', () => {
      const isSimulated = true;
      const isExpired = false;
      const cellKellySim = !isSimulated && !isExpired ? quarterKelly(60, 2.50) : 0;
      expect(cellKellySim).toBe(0);

      const isReal = true;
      const isExpiredOdd = true;
      const cellKellyExp = isReal && !isExpiredOdd ? quarterKelly(60, 2.50) : 0;
      expect(cellKellyExp).toBe(0);
    });
  });
});
