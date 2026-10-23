import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordPreMatchPredictions,
  updateClosingSnapshots,
  getAuditLog,
  exportAuditLogAsJson,
  importAuditLogFromJson,
} from '../predictionAuditService';
import { getClvStats } from '../clvService';
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
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
  },
  configurable: true,
  writable: true,
});

const T0 = Date.parse('2026-10-23T10:00:00Z');
const MIN = 60 * 1000;
const KICK = T0 + 4 * 60 * MIN;

const odds = (homeFair = 2.0) => ({
  fixtureId: 1,
  updatedAt: 'x',
  isExpired: false,
  expiresAt: new Date(T0 + 24 * 60 * MIN * 60).toISOString(),
  bookmakers: [{ name: 'Pinnacle', home: homeFair, draw: 3.6, away: 4.0, over25: 1.9, under25: 1.95 }],
  bestOdds: { home: { odd: 2.1, bookmaker: 'Bet365' } },
});

const match = (simulated: boolean, ro = odds()): Match =>
  ({
    id: 'm1',
    status: 'UPCOMING',
    utcDate: new Date(KICK).toISOString(),
    kickoffDate: '2026-10-23',
    kickoffTime: '14:00',
    leagueId: 'pl',
    leagueName: 'Premier League',
    homeTeam: { name: 'Hazai' },
    awayTeam: { name: 'Vendég' },
    probabilities: { homeWin: 50, draw: 25, awayWin: 25, over25: 55, bttsYes: 50 },
    realOdds: simulated ? undefined : ro,
    aiPick: {
      market: '1',
      marketLabel: 'Hazai (1)',
      probability: 48,
      odds: 2.1,
      expectedValue: 1.2,
      isSimulatedOdds: simulated,
    },
  }) as unknown as Match;

beforeEach(() => localStorage.clear());

describe('naplózás és záró pillanatkép (CLV)', () => {
  it('valós szorzónál a naplózáskor piaci pillanatkép készül, szimulált szorzónál nem', () => {
    recordPreMatchPredictions([match(false)], T0);
    const rec = getAuditLog()[0];
    expect(rec.marketAtLog).toBeDefined();
    expect(rec.marketAtLog!.fairProb).toBeGreaterThan(44);
    expect(rec.marketClose).toBeUndefined();

    localStorage.clear();
    recordPreMatchPredictions([match(true)], T0);
    expect(getAuditLog()[0].marketAtLog).toBeUndefined();
  });

  it('a záró pillanatkép frissül a kezdés előtt, a tipp és az auditHash nem változik', () => {
    recordPreMatchPredictions([match(false)], T0);
    const before = getAuditLog()[0];
    const r1 = updateClosingSnapshots([match(false, odds(1.9))], T0 + 120 * MIN);
    expect(r1.updated).toBe(1);
    const after = getAuditLog()[0];
    expect(after.marketClose).toBeDefined();
    expect(after.marketClose!.seenAt).toBe(new Date(T0 + 120 * MIN).toISOString());
    expect(after.auditHash).toBe(before.auditHash);
    expect(after.pick).toEqual(before.pick);
    expect(after.marketClose!.fairProb).not.toBe(after.marketAtLog!.fairProb); // más szorzó, más fair ár

    // egy későbbi frissítés felülírja
    updateClosingSnapshots([match(false, odds(1.8))], T0 + 180 * MIN);
    expect(getAuditLog()[0].marketClose!.seenAt).toBe(new Date(T0 + 180 * MIN).toISOString());
  });

  it('kezdés után, lezárt vagy szimulált rekordnál nem módosít semmit', () => {
    recordPreMatchPredictions([match(false)], T0);
    expect(updateClosingSnapshots([match(false)], KICK + MIN).updated).toBe(0);
    localStorage.clear();
    recordPreMatchPredictions([match(true)], T0);
    expect(updateClosingSnapshots([match(true)], T0 + 120 * MIN).updated).toBe(0);
  });

  it('a CLV a naplózás után legalább 15 perccel készült záró pillanatképből számolódik', () => {
    recordPreMatchPredictions([match(false)], T0);
    updateClosingSnapshots([match(false, odds(2.0))], T0 + 5 * MIN); // túl korai
    expect(getClvStats(getAuditLog()).n).toBe(0);
    updateClosingSnapshots([match(false, odds(2.0))], T0 + 200 * MIN);
    expect(getClvStats(getAuditLog()).n).toBe(1);
  });

  it('az exportált és importált napló megtartja a pillanatképeket, az érvénytelent eldobja', () => {
    recordPreMatchPredictions([match(false)], T0);
    updateClosingSnapshots([match(false, odds(1.9))], T0 + 200 * MIN);
    const json = exportAuditLogAsJson();
    localStorage.clear();
    const res = importAuditLogFromJson(json);
    expect(res.importedCount).toBeGreaterThan(0);
    const rec = getAuditLog()[0];
    expect(rec.marketAtLog).toBeDefined();
    expect(rec.marketClose).toBeDefined();

    // hamisított pillanatkép (értelmetlen fairProb) importáláskor kiesik
    const forged = JSON.parse(json);
    const list = Array.isArray(forged) ? forged : forged.records;
    list[0].marketClose = { fairProb: 999, seenAt: 'x' };
    localStorage.clear();
    importAuditLogFromJson(JSON.stringify(forged));
    expect(getAuditLog()[0].marketClose).toBeUndefined();
  });
});
