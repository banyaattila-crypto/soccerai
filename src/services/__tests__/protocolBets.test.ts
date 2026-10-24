import { describe, it, expect, beforeEach } from 'vitest';
import type { TrackedBet } from '../../types/football';

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
Object.defineProperty(globalThis, 'window', { value: globalThis, configurable: true, writable: true });

import { getTrackedBets, autoEvaluateBetsList } from '../bankrollService';
import { computeProtocolBetStats, createProtocolBet, defaultStake, findProtocolBet } from '../protocolBets';

const base = {
  protocol: 'prob' as const,
  matchId: 'm1',
  matchTitle: 'Hazai – Vendég',
  marketLabel: 'Hazai győzelem (1)',
  market: '1' as const,
  loggedOdds: 1.45,
  loggedBookmaker: 'Pinnacle',
  probabilityPct: 72,
  takenOdds: 1.4,
  bookmaker: 'Bet365',
  stake: 1000,
};

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
});

describe('protokoll-fogadások rögzítése', () => {
  it('a fogadás a tétnaplóba kerül a protokoll-hivatkozással és az irodával, és kétszer nem rögzíthető', () => {
    const bet = createProtocolBet(base);
    expect(bet?.protocolRef).toMatchObject({ protocol: 'prob', matchId: 'm1', loggedOdds: 1.45 });
    expect(bet?.bookmaker).toBe('Bet365');
    expect(bet?.totalOdds).toBe(1.4);
    expect(bet?.potentialWin).toBe(1400);
    expect(getTrackedBets()).toHaveLength(1);
    expect(findProtocolBet(getTrackedBets(), 'prob', 'm1')).toBeDefined();
    expect(findProtocolBet(getTrackedBets(), 'edge', 'm1')).toBeUndefined();
    expect(createProtocolBet(base)).toBeNull();
    expect(getTrackedBets()).toHaveLength(1);
  });

  it.each([
    ['érvénytelen szorzó', { takenOdds: 1 }],
    ['nulla tét', { stake: 0 }],
    ['hiányzó iroda', { bookmaker: '  ' }],
  ])('nem rögzít: %s', (_n, over) => {
    expect(createProtocolBet({ ...base, matchId: 'x', ...over })).toBeNull();
  });

  it('az alapértelmezett tét a bankroll 1%-a, 100 Ft-ra kerekítve, legalább 500 Ft', () => {
    expect(defaultStake(50000)).toBe(500);
    expect(defaultStake(123456)).toBe(1200);
    expect(defaultStake(10000)).toBe(500);
  });

  it('a rögzített fogadás a végeredmény alapján automatikusan lezárul', () => {
    createProtocolBet(base);
    const { updatedBets } = autoEvaluateBetsList(getTrackedBets(), [
      { id: 'm1', status: 'FINISHED', homeScore: 2, awayScore: 0 } as never,
    ]);
    expect(updatedBets[0].status).toBe('WON');
    expect(updatedBets[0].netProfit).toBe(400);
  });
});

describe('protokoll-fogadások mérése', () => {
  const bet = (over: Partial<TrackedBet> & { logged: number; taken: number; stake?: number; bookmaker?: string }): TrackedBet => {
    const { logged, taken, stake = 1000, bookmaker = 'Bet365', ...rest } = over;
    return {
      id: `b${Math.random()}`,
      createdAt: '2026-10-24T10:00:00Z',
      stake,
      totalOdds: taken,
      potentialWin: Math.round(stake * taken),
      status: 'PENDING',
      bookmaker,
      protocolRef: { protocol: 'prob', matchId: `m${Math.random()}`, loggedOdds: logged },
      items: [],
      ...rest,
    } as TrackedBet;
  };

  it('az ár-eltérés a kapott és a naplózott szorzó különbsége, a rosszabb esetek száma külön', () => {
    const stats = computeProtocolBetStats([bet({ logged: 1.5, taken: 1.45 }), bet({ logged: 1.5, taken: 1.5 }), bet({ logged: 1.4, taken: 1.45 })]);
    expect(stats.n).toBe(3);
    expect(stats.worseCount).toBe(1);
    expect(stats.avgSlippagePct).toBeCloseTo(((1.45 / 1.5 - 1) + 0 + (1.45 / 1.4 - 1)) * 100 / 3, 5);
  });

  it('a valós és a papír hozam ugyanazokon a lezárt tippeken, irodánként', () => {
    const won = bet({ logged: 1.5, taken: 1.45, status: 'WON', netProfit: 450 });
    const lost = bet({ logged: 1.5, taken: 1.5, status: 'LOST', netProfit: -1000, bookmaker: 'Pinnacle' });
    const pending = bet({ logged: 1.5, taken: 1.5 });
    const stats = computeProtocolBetStats([won, lost, pending]);
    expect(stats.settled).toBe(2);
    expect(stats.pending).toBe(1);
    expect(stats.realProfit).toBe(-550);
    expect(stats.realRoiPct).toBeCloseTo((-550 / 2000) * 100, 5);
    expect(stats.paperRoiPct).toBeCloseTo((50 + -100) / 2, 5);
    expect(stats.byBookmaker.map((b) => b.bookmaker)).toEqual(['Bet365', 'Pinnacle']);
    expect(stats.byBookmaker[1].roiPct).toBeCloseTo(-100, 5);
  });

  it('protokoll-hivatkozás nélküli szelvényt nem számol, és szűrhető protokollra', () => {
    const plain = { ...bet({ logged: 1.5, taken: 1.5 }), protocolRef: undefined } as TrackedBet;
    expect(computeProtocolBetStats([plain]).n).toBe(0);
    expect(computeProtocolBetStats([bet({ logged: 1.5, taken: 1.5 })], 'edge').n).toBe(0);
    expect(computeProtocolBetStats([bet({ logged: 1.5, taken: 1.5 })], 'prob').n).toBe(1);
  });
});
