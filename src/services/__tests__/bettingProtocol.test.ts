import { describe, it, expect } from 'vitest';
import type { PredictionAuditRecord } from '../../types/football';
import {
  PROTOCOL_V1,
  protocolFingerprint,
  evaluateProtocolInput,
  evaluateRecord,
  selectProtocolRecords,
  computeProtocolStats,
  computePickGapPp,
  gateFor,
  sanitizeProtocolStamp,
  type ProtocolInput,
} from '../bettingProtocol';
import { getClvStats } from '../clvService';

const good: ProtocolInput = {
  market: '1',
  odds: 2.1,
  isSimulatedOdds: false,
  fairProbPct: 49, // 2.1 * 0.49 - 1 = +2.9%
  gapPp: 3,
  leadMs: 3 * 3600 * 1000,
};

describe('protokoll: szabályok', () => {
  it('a megfelelő tipp protokoll-tipp', () => {
    const r = evaluateProtocolInput(good);
    expect(r.eligible).toBe(true);
    expect(r.edgePct).toBeCloseTo(2.9, 1);
  });

  it.each([
    ['szimulált szorzó', { isSimulatedOdds: true }],
    ['ismeretlen piac', { market: 'BTTS' }],
    ['túl kicsi szorzó', { odds: 1.4, fairProbPct: 73 }],
    ['túl nagy szorzó', { odds: 4.5, fairProbPct: 23 }],
    ['kicsi ár-előny', { fairProbPct: 47.8 }],
    ['gyanúsan nagy ár-előny', { fairProbPct: 60 }],
    ['nincs fair ár', { fairProbPct: undefined }],
    ['ismeretlen eltérés', { gapPp: null }],
    ['kevés idő a kezdésig', { leadMs: 10 * 60 * 1000 }],
  ])('nem protokoll-tipp: %s', (_name, over) => {
    const r = evaluateProtocolInput({ ...good, ...(over as Partial<ProtocolInput>) });
    expect(r.eligible).toBe(false);
    expect(r.reasons.length).toBeGreaterThan(0);
  });

  it('az eltérés sávjai: 5 pp-ig jó, 5-12 figyelmeztetés, 12 fölött kizárt', () => {
    expect(evaluateProtocolInput({ ...good, gapPp: 5 }).eligible).toBe(true);
    expect(evaluateProtocolInput({ ...good, gapPp: 7 }).level).toBe('warn');
    expect(evaluateProtocolInput({ ...good, gapPp: 12 }).level).toBe('excluded');
  });

  it('az ujjlenyomat a szabály minden módosításával változik', () => {
    const a = protocolFingerprint(PROTOCOL_V1);
    expect(a).toBe(protocolFingerprint(PROTOCOL_V1));
    expect(protocolFingerprint({ ...PROTOCOL_V1, minEdgePct: 3 })).not.toBe(a);
    expect(protocolFingerprint({ ...PROTOCOL_V1, gate: { ...PROTOCOL_V1.gate, minSettled: 50 } })).not.toBe(a);
  });

  it('az eltérés: 1X2 tippnél a három kimenetel legnagyobb, O/U tippnél a 2.5 gólos eltérés', () => {
    const m = {
      probabilitySource: 'market' as const,
      modelProbabilities: { homeWin: 50, draw: 25, awayWin: 25, bttsYes: 50, over15: 75, over25: 60, over35: 30, fhOver05: 66 },
      probabilities: { homeWin: 45, draw: 26, awayWin: 29, bttsYes: 50, over15: 75, over25: 55, over35: 30, fhOver05: 66 },
    };
    expect(computePickGapPp(m, '1')).toBe(5);
    expect(computePickGapPp(m, 'OVER_25')).toBe(5);
    expect(computePickGapPp({ ...m, probabilitySource: 'model' }, '1')).toBeNull();
    expect(computePickGapPp(m, 'BTTS_YES')).toBeNull();
  });

  it('importált bélyeg csak szabályos alakban marad meg', () => {
    expect(sanitizeProtocolStamp({ version: 1, fingerprint: protocolFingerprint(), gapPp: 3 })).toBeDefined();
    expect(sanitizeProtocolStamp({ version: 1, fingerprint: 'x', gapPp: 3 })).toBeUndefined();
    expect(sanitizeProtocolStamp({ version: 0, fingerprint: protocolFingerprint(), gapPp: 3 })).toBeUndefined();
    expect(sanitizeProtocolStamp({ version: 1, fingerprint: protocolFingerprint(), gapPp: -3 })?.gapPp).toBeNull();
  });
});

let seq = 0;
const rec = (over: Partial<PredictionAuditRecord> & { odds?: number; fair?: number } = {}): PredictionAuditRecord => {
  const { odds = 2.1, fair = 49, ...rest } = over;
  const kickoff = Date.parse('2026-10-24T15:00:00Z');
  const i = ++seq;
  return {
    id: `audit-${i}`,
    matchId: `m${i}`,
    loggedAt: new Date(kickoff - 6 * 3600 * 1000 + i * 1000).toISOString(),
    kickoffDate: '2026-10-24',
    kickoffTime: '17:00',
    kickoffTimestamp: kickoff + i * 60000,
    leagueId: 'pl',
    leagueName: 'Premier League',
    homeTeam: { name: 'A' },
    awayTeam: { name: 'B' },
    pick: { market: '1', marketLabel: 'A győz', probability: 49, odds, expectedValue: 3, isSimulatedOdds: false },
    marketAtLog: { fairProb: fair, odds, seenAt: new Date(kickoff - 6 * 3600 * 1000).toISOString() },
    protocol: { version: 1, fingerprint: protocolFingerprint(), gapPp: 3 },
    provenance: 'VERIFIED_PRE_MATCH',
    auditHash: 'audit2-x',
    settled: false,
    status: 'PENDING',
    profit: 0,
    roi: 0,
    ...rest,
  } as PredictionAuditRecord;
};

const settle = (r: PredictionAuditRecord, won: boolean): PredictionAuditRecord => ({
  ...r,
  settled: true,
  status: won ? 'WON' : 'LOST',
});

describe('protokoll: kiválasztás és mérés', () => {
  it('bélyeg nélküli vagy más verziójú rekord nem számít; a rekordból újraszámolt döntés a mérvadó', () => {
    expect(evaluateRecord(rec({ protocol: undefined }))).toBeNull();
    expect(evaluateRecord(rec({ protocol: { version: 2, fingerprint: protocolFingerprint(), gapPp: 3 } }))).toBeNull();
    expect(evaluateRecord(rec())?.eligible).toBe(true);
    expect(evaluateRecord(rec({ protocol: { version: 1, fingerprint: protocolFingerprint(), gapPp: 9 } }))?.level).toBe('warn');
  });

  it('napi keret: kezdési naponként az első 5 tipp a naplózás sorrendjében', () => {
    const records = Array.from({ length: 8 }, () => rec());
    const sel = selectProtocolRecords(records);
    expect(sel).toHaveLength(5);
    expect(sel.map((r) => r.id)).toEqual(records.slice(0, 5).map((r) => r.id));
  });

  it('papír ROI, találati arány és visszaesés fix 1 egységes téttel', () => {
    const base = [rec(), rec(), rec(), rec()];
    const stats = computeProtocolStats([settle(base[0], false), settle(base[1], false), settle(base[2], true), base[3]]);
    expect(stats.selected).toBe(4);
    expect(stats.settled).toBe(3);
    expect(stats.pending).toBe(1);
    expect(stats.won).toBe(1);
    expect(stats.units).toBeCloseTo(-2 + 1.1, 5);
    expect(stats.roiPct).toBeCloseTo(((-2 + 1.1) / 3) * 100, 5);
    expect(stats.maxDrawdownUnits).toBeCloseTo(2, 5);
    expect(stats.avgEdgePct).toBeCloseTo(2.9, 1);
  });

  it('VOID tipp nem számít a lezártak közé', () => {
    const r = { ...rec(), settled: true, status: 'VOID' as const };
    expect(computeProtocolStats([r]).settled).toBe(0);
  });
});

describe('protokoll: éles kapu', () => {
  const clv = (n: number, mean: number, se: number) => {
    // szintetikus CLV-statisztika a getClvStats kimenetének alakjában
    const base = getClvStats([]);
    return {
      ...base,
      n,
      meanClvPct: mean,
      seClvPct: se,
      ci95LowPct: mean - 1.96 * se,
      ci95HighPct: mean + 1.96 * se,
      verdict: (n < 50 ? 'insufficient' : n >= 100 && mean - 1.96 * se > 0 ? 'edge_likely' : mean + 1.96 * se < 0 ? 'negative' : 'unproven') as
        | 'insufficient'
        | 'edge_likely'
        | 'negative'
        | 'unproven',
    };
  };

  it('kevés adatnál adatgyűjtés, közepesnél csak papír', () => {
    expect(gateFor({ settled: 10, clv: clv(10, 1, 1), roiPct: 5, roiHigh: 30 }).status).toBe('collecting');
    expect(gateFor({ settled: 60, clv: clv(60, 1, 1), roiPct: 5, roiHigh: 30 }).status).toBe('paper');
  });

  it('csak akkor alkalmas, ha mindhárom feltétel teljesül', () => {
    const ok = gateFor({ settled: 120, clv: clv(120, 1.5, 0.5), roiPct: 3, roiHigh: 12 });
    expect(ok.status).toBe('ready');
    expect(ok.criteria.every((c) => c.ok)).toBe(true);
    // negatív ROI blokkol, de nem leállító, ha az intervallum még tartalmazza a nullát
    expect(gateFor({ settled: 120, clv: clv(120, 1.5, 0.5), roiPct: -2, roiHigh: 8 }).status).toBe('paper');
    // a CLV intervallum alsó széle nem pozitív
    expect(gateFor({ settled: 120, clv: clv(120, 0.5, 0.5), roiPct: 3, roiHigh: 12 }).status).toBe('paper');
  });

  it('bizonyítottan negatív CLV vagy ROI esetén leállítandó', () => {
    expect(gateFor({ settled: 60, clv: clv(60, -2, 0.5), roiPct: 3, roiHigh: 12 }).status).toBe('stop');
    expect(gateFor({ settled: 150, clv: clv(150, 0.2, 0.5), roiPct: -12, roiHigh: -2 }).status).toBe('stop');
  });
});
