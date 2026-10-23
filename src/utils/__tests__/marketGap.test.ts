import { describe, it, expect } from 'vitest';
import { getMarketGap, marketGapLevel, MARKET_GAP_WARN_PP, MARKET_GAP_STRONG_PP } from '../marketGap';

const probs = (h: number, d: number, a: number) => ({ homeWin: h, draw: d, awayWin: a, over25: 50, bttsYes: 50 }) as never;

describe('marketGapLevel', () => {
  it('a backtest-küszöbök szerint osztályoz', () => {
    expect(marketGapLevel(MARKET_GAP_WARN_PP - 0.1)).toBe('none');
    expect(marketGapLevel(MARKET_GAP_WARN_PP)).toBe('warn');
    expect(marketGapLevel(MARKET_GAP_STRONG_PP - 0.1)).toBe('warn');
    expect(marketGapLevel(MARKET_GAP_STRONG_PP)).toBe('strong');
  });
});

describe('getMarketGap', () => {
  it('nincs érték, ha a valószínűség nem piaci alapú vagy hiányzik a modell eredeti értéke', () => {
    expect(getMarketGap({ probabilities: probs(50, 25, 25), probabilitySource: 'model' } as never)).toBeNull();
    expect(getMarketGap({ probabilities: probs(50, 25, 25), probabilitySource: 'market' } as never)).toBeNull();
  });

  it('a legnagyobb 1X2 eltérést és annak irányát adja', () => {
    const g = getMarketGap({
      probabilities: probs(45, 28, 27),
      modelProbabilities: probs(55, 24, 21),
      probabilitySource: 'market',
    } as never)!;
    expect(g.pp).toBe(10);
    expect(g.outcome).toBe('1');
    expect(g.modelHigher).toBe(true);
    expect(g.level).toBe('warn');
  });

  it('12 pp felett erős jelzés; 5 pp alatt none', () => {
    const strong = getMarketGap({
      probabilities: probs(60, 22, 18),
      modelProbabilities: probs(44, 26, 30),
      probabilitySource: 'market',
    } as never)!;
    expect(strong.level).toBe('strong');
    expect(strong.outcome).toBe('1');
    expect(strong.modelHigher).toBe(false);
    const none = getMarketGap({
      probabilities: probs(50, 25, 25),
      modelProbabilities: probs(52, 24, 24),
      probabilitySource: 'market',
    } as never)!;
    expect(none.level).toBe('none');
  });
});
