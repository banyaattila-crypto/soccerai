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

import { recordPreMatchPredictions, getAuditLog } from '../predictionAuditService';
import { protocolFingerprint, computeProtocolStats } from '../bettingProtocol';

const NOW = Date.parse('2026-10-24T08:00:00Z');

const match = (id: string, simulated: boolean): Match =>
  ({
    id,
    leagueId: 'pl',
    leagueName: 'Premier League',
    leagueCountry: 'Anglia',
    leagueFlag: 'x',
    homeTeam: { id: `${id}h`, name: `H${id}`, shortName: 'H', logo: '', form: [], xgAvg: 1.6 },
    awayTeam: { id: `${id}a`, name: `A${id}`, shortName: 'A', logo: '', form: [], xgAvg: 1.1 },
    status: 'UPCOMING',
    kickoffDate: '2026-10-24',
    kickoffTime: '18:00',
    utcDate: '2026-10-24T16:00:00Z',
    probabilitySource: 'market',
    modelProbabilities: { homeWin: 50, draw: 25, awayWin: 25, bttsYes: 50, over15: 75, over25: 52, over35: 30, fhOver05: 66 },
    probabilities: { homeWin: 48, draw: 26, awayWin: 26, bttsYes: 50, over15: 75, over25: 52, over35: 30, fhOver05: 66 },
    odds: { home: 2.15, draw: 3.5, away: 3.8, bttsYes: 1.8, over25: 1.85, under25: 2 },
    realOdds: simulated
      ? undefined
      : {
          fixtureId: 0,
          updatedAt: '09:00',
          expiresAt: '2026-10-24T11:00:00Z',
          isExpired: false,
          bookmakers: [
            { name: 'Pinnacle', home: 2.05, draw: 3.5, away: 3.8 },
            { name: 'Másik', home: 2.3, draw: 3.4, away: 3.7 },
          ],
          bestOdds: { home: { odd: 2.3, bookmaker: 'Másik' } },
        },
    aiPick: {
      market: '1',
      marketLabel: 'Hazai győzelem (1)',
      probability: 48,
      odds: 2.3,
      confidence: 60,
      expectedValue: 3,
      isSimulatedOdds: simulated,
    },
  }) as unknown as Match;

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
});

describe('protokoll-bélyeg a naplózáskor', () => {
  it('valós szorzón naplózott tippre kerül bélyeg (verzió, ujjlenyomat, eltérés), szimuláltra nem', () => {
    recordPreMatchPredictions([match('1', false), match('2', true)], NOW);
    const log = getAuditLog();
    const real = log.find((r) => r.matchId === '1');
    const sim = log.find((r) => r.matchId === '2');
    expect(real?.protocol?.version).toBe(1);
    expect(real?.protocol?.fingerprint).toBe(protocolFingerprint());
    expect(real?.protocol?.gapPp).toBe(2);
    expect(sim?.protocol).toBeUndefined();
  });

  it('a naplózott, megfelelő tipp bekerül a protokoll-statisztikába', () => {
    recordPreMatchPredictions([match('1', false)], NOW);
    const stats = computeProtocolStats(getAuditLog());
    expect(stats.selected).toBe(1);
    expect(stats.pending).toBe(1);
    expect(stats.gate.status).toBe('collecting');
  });
});
