import { describe, it, expect } from 'vitest';
import {
  marketSnapshotForPick,
  computeRecordClv,
  getClvStats,
  getRealOddsRoi,
  isValidClose,
  sanitizeSnapshot,
  CLOSE_WINDOW_MS,
} from '../clvService';
import type { FixtureRealOdds, PredictionAuditRecord } from '../../types/football';

const NOW = Date.parse('2026-10-23T12:00:00Z');
const MIN = 60 * 1000;

const realOdds = (over?: Partial<FixtureRealOdds>): FixtureRealOdds =>
  ({
    fixtureId: 1,
    updatedAt: 'x',
    isExpired: false,
    expiresAt: new Date(NOW + 30 * MIN).toISOString(),
    bookmakers: [{ name: 'Pinnacle', home: 2.0, draw: 3.6, away: 4.0, over25: 1.9, under25: 1.95 }],
    bestOdds: {
      home: { odd: 2.1, bookmaker: 'Bet365' },
      over25: { odd: 1.95, bookmaker: 'X' },
    },
    ...over,
  }) as unknown as FixtureRealOdds;

const matchWith = (ro?: FixtureRealOdds) =>
  ({
    realOdds: ro,
    probabilities: { homeWin: 50, draw: 25, awayWin: 25, over25: 55, bttsYes: 50 },
  }) as never;

describe('marketSnapshotForPick', () => {
  it('1X2 piacra de-vigelt piaci valószínűséget és a legjobb szorzót adja', () => {
    const snap = marketSnapshotForPick(matchWith(realOdds()), '1', NOW)!;
    expect(snap.fairProb).toBeGreaterThan(44);
    expect(snap.fairProb).toBeLessThan(51);
    expect(snap.odds).toBe(2.1);
    expect(snap.bookmaker).toBe('Bet365');
    expect(snap.seenAt).toBe(new Date(NOW).toISOString());
  });

  it('nincs pillanatkép lejárt, hiányzó odds, BTTS vagy ismeretlen piac esetén', () => {
    expect(marketSnapshotForPick(matchWith(undefined), '1', NOW)).toBeUndefined();
    expect(marketSnapshotForPick(matchWith(realOdds({ isExpired: true })), '1', NOW)).toBeUndefined();
    expect(
      marketSnapshotForPick(matchWith(realOdds({ expiresAt: new Date(NOW - MIN).toISOString() })), '1', NOW)
    ).toBeUndefined();
    expect(marketSnapshotForPick(matchWith(realOdds()), 'BTTS_YES', NOW)).toBeUndefined();
  });

  it('a modell valószínűsége nem számít (tisztán piaci érték)', () => {
    const a = marketSnapshotForPick(matchWith(realOdds()), '1', NOW)!;
    const m = {
      realOdds: realOdds(),
      probabilities: { homeWin: 80, draw: 10, awayWin: 10, over25: 55, bttsYes: 50 },
    } as never;
    expect(marketSnapshotForPick(m, '1', NOW)!.fairProb).toBe(a.fairProb);
  });
});

const KICK = NOW + 60 * MIN;
const rec = (over: Partial<PredictionAuditRecord> = {}): PredictionAuditRecord =>
  ({
    id: 'r',
    matchId: 'm',
    loggedAt: new Date(NOW - 40 * MIN).toISOString(),
    kickoffTimestamp: KICK,
    pick: { market: '1', odds: 2.1, probability: 50, expectedValue: 0, isSimulatedOdds: false },
    marketAtLog: { fairProb: 47, seenAt: new Date(NOW - 40 * MIN).toISOString() },
    marketClose: { fairProb: 49, seenAt: new Date(NOW).toISOString() },
    provenance: 'VERIFIED_PRE_MATCH',
    settled: false,
    status: 'PENDING',
    profit: 0,
    roi: 0,
    ...over,
  }) as unknown as PredictionAuditRecord;

describe('computeRecordClv', () => {
  it('CLV = szorzó · záró fair − 1; az ár-előny és a piac-mozgás külön is megvan', () => {
    const c = computeRecordClv(rec())!;
    expect(c.clvPct).toBeCloseTo((2.1 * 0.49 - 1) * 100, 6);
    expect(c.shopPct).toBeCloseTo((2.1 * 0.47 - 1) * 100, 6);
    expect(c.driftPct).toBeCloseTo((49 / 47 - 1) * 100, 6);
  });

  it('szimulált szorzónál, hiányzó vagy érvénytelen záró pillanatképnél null', () => {
    expect(computeRecordClv(rec({ pick: { market: '1', odds: 2.1, isSimulatedOdds: true } as never }))).toBeNull();
    expect(computeRecordClv(rec({ marketClose: undefined }))).toBeNull();
    // túl közel a naplózáshoz (< 15 perc)
    expect(
      computeRecordClv(rec({ marketClose: { fairProb: 49, seenAt: new Date(NOW - 30 * MIN).toISOString() } }))
    ).toBeNull();
    // a kezdés után készült
    expect(
      computeRecordClv(rec({ marketClose: { fairProb: 49, seenAt: new Date(KICK + MIN).toISOString() } }))
    ).toBeNull();
    // a 3 órás ablakon kívül
    expect(
      isValidClose(
        rec({
          loggedAt: new Date(KICK - CLOSE_WINDOW_MS - 2 * 60 * MIN).toISOString(),
          marketClose: { fairProb: 49, seenAt: new Date(KICK - CLOSE_WINDOW_MS - MIN).toISOString() },
        })
      )
    ).toBe(false);
  });
});

describe('getClvStats', () => {
  const many = (n: number, closeFair: (i: number) => number) =>
    Array.from({ length: n }, (_, i) =>
      rec({ id: `r${i}`, marketClose: { fairProb: closeFair(i), seenAt: new Date(NOW).toISOString() } })
    );

  it('nincs adat -> no_data', () => {
    expect(getClvStats([]).verdict).toBe('no_data');
    expect(getClvStats([rec({ marketClose: undefined })]).verdict).toBe('no_data');
  });

  it('kevés minta (n < 50) mindig insufficient, még nagy átlagos CLV mellett is', () => {
    const s = getClvStats(many(20, () => 55));
    expect(s.n).toBe(20);
    expect(s.verdict).toBe('insufficient');
  });

  it('legalább 100 minta és a konfidencia-intervallum alsó széle > 0 -> edge_likely', () => {
    const s = getClvStats(many(120, (i) => 49 + (i % 3) * 0.2)); // CLV kb. +3%, szűk szórás
    expect(s.meanClvPct).toBeGreaterThan(2);
    expect(s.ci95LowPct).toBeGreaterThan(0);
    expect(s.verdict).toBe('edge_likely');
  });

  it('50-99 minta pozitív átlaggal is csak unproven (az edge-hez 100 kell)', () => {
    expect(getClvStats(many(70, (i) => 49 + (i % 3) * 0.2)).verdict).toBe('unproven');
  });

  it('a CI felső széle < 0 -> negative', () => {
    const s = getClvStats(many(80, (i) => 44 + (i % 3) * 0.2)); // CLV kb. -7%
    expect(s.ci95HighPct).toBeLessThan(0);
    expect(s.verdict).toBe('negative');
  });

  it('széles szórás, a nullát tartalmazó intervallum -> unproven', () => {
    const s = getClvStats(many(80, (i) => (i % 2 === 0 ? 40 : 58)));
    expect(s.ci95LowPct).toBeLessThan(0);
    expect(s.ci95HighPct).toBeGreaterThan(0);
    expect(s.verdict).toBe('unproven');
  });
});

describe('sanitizeSnapshot és getRealOddsRoi', () => {
  it('az importált pillanatképből csak az értelmes mezők maradnak', () => {
    expect(sanitizeSnapshot({ fairProb: 47, seenAt: '2026-10-23T11:00:00Z', odds: 2.1, bookmaker: 'B' })).toEqual({
      fairProb: 47,
      seenAt: '2026-10-23T11:00:00Z',
      odds: 2.1,
      bookmaker: 'B',
    });
    expect(sanitizeSnapshot({ fairProb: 140, seenAt: '2026-10-23T11:00:00Z' })).toBeUndefined();
    expect(sanitizeSnapshot({ fairProb: 47, seenAt: 'nem dátum' })).toBeUndefined();
    expect(sanitizeSnapshot('x')).toBeUndefined();
    expect(sanitizeSnapshot({ fairProb: 47, seenAt: '2026-10-23T11:00:00Z', odds: -3 })?.odds).toBeUndefined();
  });

  it('a valós szorzós ROI csak a nem szimulált, lezárt tippekből számol', () => {
    const recs = [
      rec({ id: 'a', settled: true, status: 'WON', roi: 110 }),
      rec({ id: 'b', settled: true, status: 'LOST', roi: -100 }),
      rec({ id: 'c', settled: true, status: 'WON', roi: 50, pick: { market: '1', odds: 1.5, isSimulatedOdds: true } as never }),
      rec({ id: 'd' }),
    ];
    const r = getRealOddsRoi(recs);
    expect(r.n).toBe(3);
    expect(r.settledN).toBe(2);
    expect(r.roiPct).toBeCloseTo(5, 6);
  });
});
