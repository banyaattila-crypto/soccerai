import { TrackedBet } from '../types/football';

export interface EquityPoint {
  /** 0 = kezdőtőke, 1.. = lezárt szelvények sorrendben */
  index: number;
  bankroll: number;
  label: string;
}

export interface EquityCurveResult {
  points: EquityPoint[];
  peak: number;
  trough: number;
  /** Csúcstól mélypontig mért legnagyobb esés, a csúcs %-ában (0..100) */
  maxDrawdownPct: number;
  settledCount: number;
}

function settleTime(bet: TrackedBet): number {
  const t = new Date(bet.settledAt || bet.createdAt).getTime();
  return isNaN(t) ? 0 : t;
}

/**
 * Kumulált tőkegörbe a lezárt (WON/LOST/VOID) szelvényekből,
 * lezárási idő szerint növekvő sorrendben.
 */
export function computeEquityCurve(bets: TrackedBet[], initialBankroll: number): EquityCurveResult {
  const settled = bets
    .filter((b) => b.status === 'WON' || b.status === 'LOST' || b.status === 'VOID')
    .sort((a, b) => settleTime(a) - settleTime(b));

  const points: EquityPoint[] = [{ index: 0, bankroll: initialBankroll, label: 'Kezdőtőke' }];
  let running = initialBankroll;
  let peak = initialBankroll;
  let trough = initialBankroll;
  let maxDd = 0;

  settled.forEach((bet, i) => {
    running += bet.netProfit ?? 0;
    points.push({
      index: i + 1,
      bankroll: running,
      label: new Date(bet.settledAt || bet.createdAt).toLocaleDateString('hu-HU'),
    });
    if (running > peak) peak = running;
    if (running < trough) trough = running;
    if (peak > 0) {
      const dd = ((peak - running) / peak) * 100;
      if (dd > maxDd) maxDd = dd;
    }
  });

  return {
    points,
    peak,
    trough,
    maxDrawdownPct: Math.round(maxDd * 10) / 10,
    settledCount: settled.length,
  };
}
