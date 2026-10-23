import { describe, it, expect } from 'vitest';
import { parseOddsApiEvent, teamNamesMatch, findOddsApiEvent, type OddsApiEvent } from '../oddsApiParsing';

const event: OddsApiEvent = {
  id: 'e1',
  commence_time: '2026-10-24T14:00:00Z',
  home_team: 'Manchester United',
  away_team: 'Brighton and Hove Albion',
  bookmakers: [
    {
      key: 'pinnacle',
      title: 'Pinnacle',
      markets: [
        { key: 'h2h', outcomes: [
          { name: 'Manchester United', price: 2.1 },
          { name: 'Brighton and Hove Albion', price: 3.6 },
          { name: 'Draw', price: 3.5 },
        ] },
        { key: 'totals', outcomes: [
          { name: 'Over', price: 1.9, point: 2.5 },
          { name: 'Under', price: 1.95, point: 2.5 },
          { name: 'Over', price: 1.5, point: 1.5 },
        ] },
      ],
    },
    {
      key: 'other',
      title: 'Másik',
      markets: [{ key: 'h2h', outcomes: [
        { name: 'Manchester United', price: 2.2 },
        { name: 'Brighton and Hove Albion', price: 3.4 },
        { name: 'Draw', price: 3.6 },
      ] }],
    },
  ],
};

describe('The Odds API feldolgozás', () => {
  it('1X2 és O/U 2.5 szorzót nyer ki, a legjobb szorzót kiválasztja', () => {
    const p = parseOddsApiEvent(event);
    expect(p.bookmakers).toHaveLength(2);
    expect(p.pinnacle?.home).toBe(2.1);
    expect(p.pinnacle?.over25).toBe(1.9);
    expect(p.pinnacle?.under25).toBe(1.95);
    expect(p.bestOdds.home).toEqual({ odd: 2.2, bookmaker: 'Másik' });
    expect(p.bestOdds.draw?.odd).toBe(3.6);
    expect(p.bestOdds.over25?.odd).toBe(1.9);
  });

  it('a csapatnév-egyeztetés kezeli a gyakori eltéréseket', () => {
    expect(teamNamesMatch('Manchester United', 'Manchester United FC')).toBe(true);
    expect(teamNamesMatch('Brighton and Hove Albion', 'Brighton & Hove Albion FC')).toBe(true);
    expect(teamNamesMatch('Manchester City', 'Manchester United')).toBe(false);
    expect(teamNamesMatch('Real Madrid', 'Real Betis')).toBe(false);
  });

  it('az esemény párosítása időablakkal történik', () => {
    const parsed = [parseOddsApiEvent(event)];
    const ko = Date.parse('2026-10-24T14:00:00Z');
    expect(findOddsApiEvent(parsed, 'Manchester United FC', 'Brighton & Hove Albion FC', ko)).not.toBeNull();
    expect(findOddsApiEvent(parsed, 'Manchester United FC', 'Brighton & Hove Albion FC', ko + 5 * 86400000)).toBeNull();
  });
});
