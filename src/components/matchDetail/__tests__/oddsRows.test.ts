import { describe, it, expect } from 'vitest';
import { buildOddsRows, calcEv } from '../oddsRows';
import type { FixtureRealOdds, MarketProbabilities } from '../../../types/football';

const modelP = { homeWin: 50, draw: 25, awayWin: 25, over25: 55, bttsYes: 52 } as unknown as MarketProbabilities;
const match = { homeTeam: { name: 'Hazai FC', shortName: 'HAZ' }, awayTeam: { name: 'Vendég SE' } } as never;

const realOdds = {
  fixtureId: 1,
  updatedAt: 'x',
  bookmakers: [],
  pinnacle: { name: 'Pinnacle', home: 2.1, draw: 3.4, away: 3.6, over25: 1.95, under25: 1.9 },
  bet365: { name: 'Bet365', home: 2.0, draw: 3.3, away: 3.7, bttsYes: 1.8 },
  bestOdds: {
    home: { odd: 2.2, bookmaker: 'X' },
    draw: { odd: 3.5, bookmaker: 'Y' },
    away: { odd: 3.8, bookmaker: 'Z' },
    bttsYes: { odd: 1.85, bookmaker: 'W' },
  },
} as unknown as FixtureRealOdds;

describe('calcEv', () => {
  it('számol egy tizedesre kerekítve, érvénytelen bemenetre null', () => {
    expect(calcEv(50, 2.2)).toBe(10);
    expect(calcEv(0, 2)).toBeNull();
    expect(calcEv(50, undefined)).toBeNull();
  });
});

describe('buildOddsRows', () => {
  it('a Pinnacle fülön a Pinnacle szorzói, piaci referencia nélkül nincs EV (null) és modell fair szorzó', () => {
    // piaci referencia nélkül a blendedMarketPct null -> EV null, a fair a modell valószínűségéből jön
    const rows = buildOddsRows(match, realOdds, 'pinnacle', modelP, undefined);
    expect(rows.map((r) => r.key)).toEqual(['1', 'X', '2', 'O25', 'U25']);
    expect(rows[0].label).toBe('HAZ (1)');
    expect(rows[2].label).toBe('Vendég SE (2)');
    expect(rows[0].odd).toBe(2.1);
    expect(rows[0].fair).toBe((100 / 50).toFixed(2));
    expect(rows[3].fair).toBe((100 / 55).toFixed(2));
    expect(rows[4].fair).toBe((100 / 45).toFixed(2));
  });

  it('a legjobb piac fülön a bestOdds szorzói és a forrás bukméker; BTTS-sor csak szorzóval, EV nélkül', () => {
    const rows = buildOddsRows(match, realOdds, 'best', modelP, undefined);
    expect(rows[0].odd).toBe(2.2);
    expect(rows[0].source).toBe('X');
    const btts = rows.find((r) => r.key === 'BTTS');
    expect(btts?.odd).toBe(1.85);
    expect(btts?.ev).toBeNull();
    expect(btts?.fair).toBe((100 / 52).toFixed(2));
  });

  it('a Bet365 fülön a BTTS-sor megjelenik, a Pinnacle fülön nem (nincs bttsYes szorzó)', () => {
    expect(buildOddsRows(match, realOdds, 'bet365', modelP, undefined).some((r) => r.key === 'BTTS')).toBe(true);
    expect(buildOddsRows(match, realOdds, 'pinnacle', modelP, undefined).some((r) => r.key === 'BTTS')).toBe(false);
  });
});
