import { describe, it, expect } from 'vitest';
import { computeEquityCurve } from '../equityCurve';
import type { TrackedBet } from '../../types/football';

function bet(id: string, status: TrackedBet['status'], netProfit: number | undefined, settledAt: string): TrackedBet {
  return {
    id,
    createdAt: settledAt,
    settledAt,
    stake: 1000,
    totalOdds: 2,
    potentialWin: 2000,
    status,
    netProfit,
    items: [],
  };
}

describe('computeEquityCurve', () => {
  it('csak kezdőtőke, ha nincs lezárt szelvény', () => {
    const r = computeEquityCurve([bet('p', 'PENDING', undefined, '2026-10-01T10:00:00Z')], 50000);
    expect(r.points).toHaveLength(1);
    expect(r.settledCount).toBe(0);
    expect(r.maxDrawdownPct).toBe(0);
  });

  it('lezárási idő szerint, kumulálva számol', () => {
    const r = computeEquityCurve(
      [
        bet('b', 'LOST', -1000, '2026-10-02T10:00:00Z'),
        bet('a', 'WON', 1000, '2026-10-01T10:00:00Z'),
        bet('c', 'VOID', 0, '2026-10-03T10:00:00Z'),
      ],
      10000
    );
    expect(r.points.map((p) => p.bankroll)).toEqual([10000, 11000, 10000, 10000]);
    expect(r.peak).toBe(11000);
    expect(r.trough).toBe(10000);
  });

  it('a maximális drawdownt a csúcshoz képest számolja', () => {
    const r = computeEquityCurve(
      [
        bet('1', 'WON', 5000, '2026-10-01T10:00:00Z'), // 15000 csúcs
        bet('2', 'LOST', -3000, '2026-10-02T10:00:00Z'), // 12000
        bet('3', 'LOST', -3000, '2026-10-03T10:00:00Z'), // 9000
        bet('4', 'WON', 2000, '2026-10-04T10:00:00Z'), // 11000
      ],
      10000
    );
    expect(r.maxDrawdownPct).toBe(40); // (15000-9000)/15000
  });
});
