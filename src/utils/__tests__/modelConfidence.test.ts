import { describe, it, expect } from 'vitest';
import {
  getDataQualityInfo,
  getProbabilityRange,
  lambdaRelativeError,
} from '../modelConfidence';
import type { Match } from '../../types/football';

type Q = Pick<Match, 'quantAnalysis'>;

function quant(sampleSize?: number, fitted = true): Q {
  return {
    quantAnalysis: {
      dataQuality: 'A',
      robustnessVerdict: 'valószínű',
      minEdge: 0,
      medianEdge: 0,
      posPct: 0,
      quarterKellyPct: 0,
      shinMargin: 0,
      shinProbs: { home: 40, draw: 30, away: 30 },
      lambdaInversion: { marketLambda: 2.6, beOver: 2.5, beUnder: 2.7, verdict: '' },
      keyFactors: [],
      riskLevel: 'Közepes',
      dixonColesRatings: {
        homeAttack: 1,
        homeDefense: 1,
        awayAttack: 1,
        awayDefense: 1,
        homeAdvantage: 1.2,
        rho: -0.13,
        isEmpiricallyFitted: fitted,
        sampleSize,
      },
    },
  } as unknown as Q;
}

describe('getDataQualityInfo', () => {
  it('illesztés nélkül ligaátlag + prior', () => {
    expect(getDataQualityInfo({}).basis).toBe('prior');
    expect(getDataQualityInfo(quant(undefined, false)).basis).toBe('prior');
  });

  it('a minta mérete szerint osztályoz', () => {
    expect(getDataQualityInfo(quant(8)).basis).toBe('thin');
    expect(getDataQualityInfo(quant(29)).basis).toBe('thin');
    expect(getDataQualityInfo(quant(30)).basis).toBe('partial');
    expect(getDataQualityInfo(quant(99)).basis).toBe('partial');
    expect(getDataQualityInfo(quant(100)).basis).toBe('season');
    expect(getDataQualityInfo(quant(380)).shortLabel).toContain('380');
  });
});

describe('lambdaRelativeError', () => {
  it('kis mintán a felső korlátra áll, nagy mintán csökken', () => {
    expect(lambdaRelativeError(undefined)).toBe(0.25);
    expect(lambdaRelativeError(10)).toBe(0.25);
    expect(lambdaRelativeError(380)).toBeLessThan(0.16);
    expect(lambdaRelativeError(380)).toBeLessThan(lambdaRelativeError(100));
  });
});

describe('getProbabilityRange', () => {
  const base = (sample?: number) => ({
    homeTeam: { xgAvg: 1.6 },
    awayTeam: { xgAvg: 1.1 },
    ...quant(sample),
  }) as unknown as Pick<Match, 'homeTeam' | 'awayTeam' | 'quantAnalysis'>;

  it('a sáv tartalmazza a középértéket és 0-100 közé esik', () => {
    const r = getProbabilityRange(base(380), '1')!;
    expect(r.low).toBeLessThan(r.high);
    expect(r.low).toBeGreaterThanOrEqual(0);
    expect(r.high).toBeLessThanOrEqual(100);
  });

  it('kisebb mintánál szélesebb sávot ad', () => {
    const wide = getProbabilityRange(base(10), 'OVER_25')!;
    const narrow = getProbabilityRange(base(380), 'OVER_25')!;
    expect(wide.high - wide.low).toBeGreaterThan(narrow.high - narrow.low);
  });

  it('nem támogatott piacra és hiányzó xG-re undefined', () => {
    expect(getProbabilityRange(base(100), 'FH_OVER_05')).toBeUndefined();
    const noXg = { homeTeam: {}, awayTeam: {}, ...quant(100) } as unknown as Pick<
      Match,
      'homeTeam' | 'awayTeam' | 'quantAnalysis'
    >;
    expect(getProbabilityRange(noXg, '1')).toBeUndefined();
  });
});
