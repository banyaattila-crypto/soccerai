import { describe, it, expect, beforeEach } from 'vitest';
import type { Match } from '../../types/football';

const store: Record<string, string> = {};
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
  },
  configurable: true,
  writable: true,
});

import {
  PROTOCOL_V1,
  PROTOCOL_PROB_V1,
  calibrationOf,
  evaluateProtocolInput,
  gateFor,
  protocolFingerprint,
} from '../bettingProtocol';
import { getClvStats } from '../clvService';
import {
  findProbCandidate,
  getProbLog,
  getProbStats,
  recordProbPicks,
  settleProbPicks,
  updateProbClosing,
} from '../probPickService';

const NOW = Date.parse('2026-10-24T08:00:00Z');

/** Hazai favorit: Pinnacle 1,32 / 5,2 / 9,5 (a piaci hazai valószínűség kb. 72%), másik iroda jobb áron (1,45). */
const match = (id: string, over: Partial<Match> = {}): Match =>
  ({
    id,
    leagueId: 'pl',
    leagueName: 'Premier League',
    leagueCountry: 'Anglia',
    leagueFlag: 'x',
    homeTeam: { id: `${id}h`, name: `Hazai${id}`, shortName: 'H', logo: '', form: [], xgAvg: 1.9 },
    awayTeam: { id: `${id}a`, name: `Vendég${id}`, shortName: 'A', logo: '', form: [], xgAvg: 0.9 },
    status: 'UPCOMING',
    kickoffDate: '2026-10-24',
    kickoffTime: '18:00',
    utcDate: '2026-10-24T16:00:00Z',
    probabilitySource: 'market',
    modelProbabilities: { homeWin: 70, draw: 18, awayWin: 12, bttsYes: 45, over15: 80, over25: 55, over35: 30, fhOver05: 66 },
    probabilities: { homeWin: 72, draw: 17, awayWin: 11, bttsYes: 45, over15: 80, over25: 55, over35: 30, fhOver05: 66 },
    odds: { home: 1.45, draw: 4.6, away: 8, bttsYes: 1.8, over25: 1.9, under25: 1.9 },
    realOdds: {
      fixtureId: 0,
      updatedAt: '09:00',
      expiresAt: '2026-10-24T20:00:00Z',
      isExpired: false,
      bookmakers: [
        { name: 'Pinnacle', home: 1.32, draw: 5.2, away: 9.5 },
        { name: 'Másik', home: 1.45, draw: 4.8, away: 8.5 },
      ],
      bestOdds: { home: { odd: 1.45, bookmaker: 'Másik' }, draw: { odd: 5.2, bookmaker: 'Pinnacle' }, away: { odd: 9.5, bookmaker: 'Pinnacle' } },
    },
    ...over,
  }) as unknown as Match;

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
});

describe('B protokoll: szabályok', () => {
  const good = { market: '1', odds: 1.45, isSimulatedOdds: false, fairProbPct: 72, gapPp: 2, leadMs: 3 * 3600 * 1000 };

  it('a nagy valószínűségű, fair ár fölötti tipp megfelel', () => {
    const r = evaluateProtocolInput(good, PROTOCOL_PROB_V1);
    expect(r.eligible).toBe(true);
    expect(r.edgePct).toBeCloseTo(4.4, 1);
  });

  it.each([
    ['69% valószínűség', { fairProbPct: 69, odds: 1.5 }],
    ['fair ár alatti ár (negatív előny)', { odds: 1.35 }],
    ['túl kis szorzó', { odds: 1.2, fairProbPct: 90 }],
    ['túl nagy szorzó', { odds: 1.8, fairProbPct: 70 }],
    ['nagy eltérés', { gapPp: 6 }],
    ['szimulált szorzó', { isSimulatedOdds: true }],
  ])('nem felel meg: %s', (_n, over) => {
    expect(evaluateProtocolInput({ ...good, ...over }, PROTOCOL_PROB_V1).eligible).toBe(false);
  });

  it('az A protokoll nem kezeli a valószínűséget, a B igen; a két ujjlenyomat eltér', () => {
    expect(protocolFingerprint(PROTOCOL_V1)).not.toBe(protocolFingerprint(PROTOCOL_PROB_V1));
  });

  it('az A protokoll v1 ujjlenyomata a B bevezetése előtt rögzített rekordokkal is egyező marad', () => {
    expect(protocolFingerprint(PROTOCOL_V1)).toBe('proto-cf5eebdc6a209969');
  });
});

describe('B protokoll: jelölt kiválasztás és naplózás', () => {
  it('a legnagyobb valószínűségű megfelelő kimenetelt választja, a legjobb áron', () => {
    const c = findProbCandidate(match('1'), NOW);
    expect(c?.market).toBe('1');
    expect(c?.odds).toBe(1.45);
    expect(c?.bookmaker).toBe('Másik');
    expect(c?.probPct).toBeGreaterThanOrEqual(70);
    expect(c?.edgePct).toBeGreaterThanOrEqual(0);
  });

  it('szimulált (valós szorzó nélküli) vagy már megkezdett meccshez nincs jelölt', () => {
    expect(findProbCandidate(match('1', { realOdds: undefined }), NOW)).toBeNull();
    expect(findProbCandidate(match('1'), Date.parse('2026-10-24T17:00:00Z'))).toBeNull();
  });

  it('write-once napló, napi 5 tipp keret, és a rekord a B ujjlenyomatot viseli', () => {
    const matches = Array.from({ length: 7 }, (_, i) => match(String(i + 1)));
    expect(recordProbPicks(matches, NOW).added).toBe(5);
    expect(recordProbPicks(matches, NOW + 1000).added).toBe(0);
    const log = getProbLog();
    expect(log).toHaveLength(5);
    expect(log[0].protocol?.fingerprint).toBe(protocolFingerprint(PROTOCOL_PROB_V1));
    expect(log[0].pick.isSimulatedOdds).toBe(false);
    expect(log[0].marketAtLog?.fairProb).toBeGreaterThanOrEqual(70);
  });

  it('lezárás a végeredményből, statisztika a naplóból; nyert a hazai győzelem', () => {
    recordProbPicks([match('1'), match('2')], NOW);
    const finished = [
      match('1', { status: 'FINISHED', homeScore: 2, awayScore: 0 } as Partial<Match>),
      match('2', { status: 'FINISHED', homeScore: 0, awayScore: 1 } as Partial<Match>),
    ];
    expect(settleProbPicks(finished).settled).toBe(2);
    const log = getProbLog();
    expect(log.map((r) => r.status).sort()).toEqual(['LOST', 'WON']);
    const stats = getProbStats();
    expect(stats.selected).toBe(2);
    expect(stats.settled).toBe(2);
    expect(stats.won).toBe(1);
    expect(stats.units).toBeCloseTo(0.45 - 1, 5);
    expect(stats.calibration.n).toBe(2);
  });

  it('záró pillanatkép a kezdés előtt frissül, a CLV így számolható', () => {
    recordProbPicks([match('1')], NOW);
    expect(updateProbClosing([match('1')], Date.parse('2026-10-24T14:30:00Z')).updated).toBe(1);
    const rec = getProbLog()[0];
    expect(rec.marketClose).toBeDefined();
    expect(getClvStats(getProbLog()).n).toBe(1);
  });
});

describe('B protokoll: kalibráció és kapu', () => {
  it('a kalibráció z-értéke a becsült és tényleges találati arányból számolódik', () => {
    const rows = (wins: number, n: number, p: number) =>
      Array.from({ length: n }, (_, i) => ({ prob: p, won: i < wins }));
    expect(calibrationOf(rows(75, 100, 0.75)).z).toBeCloseTo(0, 5);
    expect(calibrationOf(rows(60, 100, 0.75)).z).toBeLessThan(-1.96);
    expect(calibrationOf([]).n).toBe(0);
  });

  const clv = (n: number, mean: number) => {
    const base = getClvStats([]);
    return { ...base, n, meanClvPct: mean, verdict: (n < 50 ? 'insufficient' : mean < -1 ? 'negative' : 'unproven') as 'insufficient' | 'negative' | 'unproven' };
  };

  it('csak akkor alkalmas, ha mind a négy feltétel teljesül', () => {
    const ok = gateFor({ settled: 120, clv: clv(120, 0.5), roiPct: 1, roiHigh: 6, calibration: { n: 120, predictedPct: 75, observedPct: 74, z: -0.3 } }, PROTOCOL_PROB_V1);
    expect(ok.status).toBe('ready');
    expect(ok.criteria.map((c) => c.key)).toEqual(['settled', 'calibration', 'clv', 'roi']);
  });

  it('szignifikánsan alacsonyabb tényleges találati aránynál leállítandó', () => {
    const g = gateFor({ settled: 120, clv: clv(120, 0.5), roiPct: 1, roiHigh: 6, calibration: { n: 120, predictedPct: 75, observedPct: 62, z: -3 } }, PROTOCOL_PROB_V1);
    expect(g.status).toBe('stop');
  });

  it('negatív ROI vagy negatív CLV esetén nem alkalmas', () => {
    expect(gateFor({ settled: 120, clv: clv(120, 0.5), roiPct: -3, roiHigh: 2, calibration: { n: 120, predictedPct: 75, observedPct: 74, z: -0.2 } }, PROTOCOL_PROB_V1).status).toBe('paper');
    expect(gateFor({ settled: 120, clv: clv(120, -2), roiPct: 1, roiHigh: 6, calibration: { n: 120, predictedPct: 75, observedPct: 74, z: -0.2 } }, PROTOCOL_PROB_V1).status).toBe('stop');
  });
});
