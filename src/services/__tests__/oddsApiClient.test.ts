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

import {
  getOddsApiOdds,
  selectOddsApiLeagues,
  ODDS_API_CACHE_PREFIX,
  ODDS_API_TTL_MS,
} from '../oddsApiClient';
import { attachCachedRealOddsToMatches } from '../apiSportsClient';

const NOW = Date.parse('2026-10-24T08:00:00Z');

const match = (over: Partial<Match> = {}): Match =>
  ({
    id: 'fd-1',
    leagueId: 'pl',
    leagueName: 'Premier League',
    leagueCountry: 'Anglia',
    leagueFlag: 'x',
    homeTeam: { id: 'h', name: 'Arsenal FC', shortName: 'ARS', logo: '', form: [], xgAvg: 1.8 },
    awayTeam: { id: 'a', name: 'Everton FC', shortName: 'EVE', logo: '', form: [], xgAvg: 1.1 },
    status: 'UPCOMING',
    kickoffDate: '2026-10-24',
    kickoffTime: '16:00',
    probabilities: { homeWin: 60, draw: 22, awayWin: 18, bttsYes: 50, over15: 78, over25: 55, over35: 30, fhOver05: 70 },
    odds: { home: 1.6, draw: 4, away: 5.5, bttsYes: 1.8, over25: 1.85, under25: 2 },
    ...over,
  }) as unknown as Match;

const cacheEvent = (ts: number) => {
  store[`${ODDS_API_CACHE_PREFIX}soccer_epl`] = JSON.stringify({
    timestamp: ts,
    events: [
      {
        homeTeam: 'Arsenal',
        awayTeam: 'Everton',
        commenceTime: '2026-10-24T14:00:00Z',
        bookmakers: [
          { name: 'Pinnacle', home: 1.7, draw: 3.9, away: 5.2, over25: 1.9, under25: 1.95, margin: 2.4 },
          { name: 'Másik', home: 1.72, draw: 3.8, away: 5.0, over25: 1.88, under25: 1.97, margin: 2.6 },
        ],
        pinnacle: { name: 'Pinnacle', home: 1.7, draw: 3.9, away: 5.2, over25: 1.9, under25: 1.95, margin: 2.4 },
        bestOdds: { home: { odd: 1.72, bookmaker: 'Másik' }, draw: { odd: 3.9, bookmaker: 'Pinnacle' }, away: { odd: 5.2, bookmaker: 'Pinnacle' } },
      },
    ],
  });
};

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
});

describe('The Odds API kliens', () => {
  it('a gyorsítótárból párosítja a meccset, és a lejárati idő a lekérés idejéhez kötött', () => {
    cacheEvent(NOW - 3600 * 1000);
    const odds = getOddsApiOdds(match(), NOW);
    expect(odds?.bestOdds.home?.odd).toBe(1.72);
    expect(odds?.isExpired).toBe(false);
    expect(odds?.ttlMinutes).toBe(120);
    expect(getOddsApiOdds(match(), NOW + 4 * 3600 * 1000)?.isExpired).toBe(true);
  });

  it('nem kínált ligához és ismeretlen meccshez nem ad szorzót', () => {
    cacheEvent(NOW);
    expect(getOddsApiOdds(match({ leagueId: 'liga1_romania' }), NOW)).toBeNull();
    expect(getOddsApiOdds(match({ awayTeam: { id: 'a', name: 'Fulham', shortName: 'FUL', logo: '', form: [], xgAvg: 1 } } as Partial<Match>), NOW)).toBeNull();
  });

  it('csatolás: az API-Sports hiányában a The Odds API szorzója valós piaci árat ad a meccsnek', () => {
    cacheEvent(NOW - 600 * 1000);
    const [m] = attachCachedRealOddsToMatches([match()], NOW);
    expect(m.realOdds?.bestOdds.home?.odd).toBe(1.72);
    expect(m.odds.home).toBe(1.72);
    expect(m.probabilitySource).toBe('market');
    expect(m.realOdds?.isExpired).toBe(false);
  });

  it('csak a következő 48 órás, friss szorzó nélküli ligákat kéri', () => {
    const matches = [match(), match({ id: 'x', leagueId: 'laliga' })];
    expect(selectOddsApiLeagues(matches, NOW, () => false).sort()).toEqual(['soccer_epl', 'soccer_spain_la_liga']);
    expect(selectOddsApiLeagues(matches, NOW, (k) => k === 'soccer_epl')).toEqual(['soccer_spain_la_liga']);
    expect(ODDS_API_TTL_MS).toBe(3 * 3600 * 1000);
  });
});
