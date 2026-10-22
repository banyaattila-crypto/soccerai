import { describe, it, expect, vi } from 'vitest';
import {
  getSeasonStartYear,
  ensureLeagueModels,
  getRegularTimeGoals,
  toFinishedResults,
  FootballDataHistoryMatch,
} from '../seasonHistory';
import { calculateMarketProbabilities, buildMatchQuantAndPick } from '../predictionEngine';

describe('getSeasonStartYear', () => {
  it('európai szezon: július után az aktuális év, előtte az előző', () => {
    expect(getSeasonStartYear('PL', new Date('2026-10-22'))).toBe(2026);
    expect(getSeasonStartYear('PL', new Date('2027-03-10'))).toBe(2026);
    expect(getSeasonStartYear('PD', new Date('2026-06-30'))).toBe(2025);
  });

  it('a brazil bajnokság naptári évet követ', () => {
    expect(getSeasonStartYear('BSA', new Date('2026-03-10'))).toBe(2026);
    expect(getSeasonStartYear('BSA', new Date('2026-11-10'))).toBe(2026);
  });
});

describe('getRegularTimeGoals', () => {
  it('rendes játékidős mérkőzésnél a fullTime', () => {
    expect(
      getRegularTimeGoals({ duration: 'REGULAR', fullTime: { home: 2, away: 1 } })
    ).toEqual({ home: 2, away: 1 });
  });

  it('hosszabbításnál/tizenegyesnél a regularTime (90 perc), ha van', () => {
    expect(
      getRegularTimeGoals({
        duration: 'EXTRA_TIME',
        fullTime: { home: 3, away: 2 },
        regularTime: { home: 2, away: 2 },
      })
    ).toEqual({ home: 2, away: 2 });
  });

  it('regularTime hiányában a fullTime-ra esik vissza, hiányzó adatra null', () => {
    expect(
      getRegularTimeGoals({ duration: 'PENALTY_SHOOTOUT', fullTime: { home: 1, away: 1 } })
    ).toEqual({ home: 1, away: 1 });
    expect(getRegularTimeGoals({ fullTime: { home: null, away: null } })).toBeNull();
    expect(getRegularTimeGoals(undefined)).toBeNull();
  });
});

describe('toFinishedResults', () => {
  const mk = (status: string, h: number | null, a: number | null): FootballDataHistoryMatch => ({
    utcDate: '2026-09-01T18:30:00Z',
    status,
    homeTeam: { name: 'A' },
    awayTeam: { name: 'B' },
    score: { duration: 'REGULAR', fullTime: { home: h, away: a } },
  });

  it('csak a lezárt, érvényes eredményű meccseket veszi át, dátummal', () => {
    const out = toFinishedResults([mk('FINISHED', 2, 0), mk('POSTPONED', null, null), mk('FINISHED', null, null)]);
    expect(out).toEqual([
      { homeTeam: 'A', awayTeam: 'B', homeGoals: 2, awayGoals: 0, date: '2026-09-01' },
    ]);
  });
});

describe('Kerekítetlen valószínűség az EV-hez', () => {
  it('a calculateMarketProbabilities exact mezője egyezik az egész százalékokkal (±1)', () => {
    const p = calculateMarketProbabilities(1.7, 1.1, 1.0, -0.13);
    expect(p.exact).toBeDefined();
    expect(Math.abs(p.exact!.homeWin - p.homeWin)).toBeLessThanOrEqual(1);
    expect(Math.abs(p.exact!.over25 - p.over25)).toBeLessThanOrEqual(1.01);
    expect(p.exact!.homeWin + p.exact!.draw + p.exact!.awayWin).toBeCloseTo(100, 1);
  });

  it('valós oddsnál az EV a kerekítetlen valószínűségből jön, nem az egész %-ból', () => {
    const homeXg = 1.9;
    const awayXg = 1.0;
    const probabilities = calculateMarketProbabilities(homeXg, awayXg, 1.0, -0.13);
    const { aiPick } = buildMatchQuantAndPick({
      homeTeamName: 'H',
      awayTeamName: 'A',
      homeXg,
      awayXg,
      probabilities,
      odds: { home: 2.0, draw: 3.6, away: 4.5, bttsYes: 1.9, over25: 1.95, under25: 1.9 },
      dataQuality: 'A',
      leagueLabel: 'T',
      isSimulatedOdds: false,
      rho: -0.13,
    });
    expect(aiPick).toBeDefined();
    const exactByMarket: Record<string, number | undefined> = {
      '1': probabilities.exact?.homeWin,
      '2': probabilities.exact?.awayWin,
      OVER_25: probabilities.exact?.over25,
      BTTS_YES: probabilities.exact?.bttsYes,
    };
    const exact = exactByMarket[aiPick!.market];
    if (exact !== undefined) {
      const expected = Math.round((exact / 100 * aiPick!.odds - 1) * 1000) / 10;
      expect(aiPick!.expectedValue).toBeCloseTo(expected, 1);
    }
  });
});

describe('ensureLeagueModels (mockolt fetch)', () => {
  const teams = Array.from({ length: 12 }, (_, i) => `Csapat ${i}`);
  const history: FootballDataHistoryMatch[] = [];
  for (let i = 0; i < 12; i++) {
    for (let j = 0; j < 12; j++) {
      if (i === j) continue;
      history.push({
        utcDate: '2026-09-01T18:30:00Z',
        status: 'FINISHED',
        homeTeam: { name: teams[i] },
        awayTeam: { name: teams[j] },
        score: { duration: 'REGULAR', fullTime: { home: (i + j) % 4, away: (i * j) % 3 } },
      });
    }
  }

  it('szezon-előzményből modellt illeszt, és az aktuális + előző szezont kéri le', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      calls.push(String(url));
      return { ok: true, status: 200, headers: new Headers(), json: async () => ({ matches: history }) };
    });
    const models = await ensureLeagueModels(['PL'], '', 5000);
    vi.unstubAllGlobals();

    expect(models.PL).not.toBeNull();
    expect(models.PL!.sampleSize).toBe(history.length * 2); // 132 < 180 -> az előző szezon is kell
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain('competition=PL');
    expect(calls[0]).toContain('status=FINISHED');
    expect(calls[0]).toMatch(/season=\d{4}/);
  });

  it('elérhetetlen liga (403) esetén null modell, nincs kivétel', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 403, headers: new Headers(), json: async () => ({}) }));
    const models = await ensureLeagueModels(['EL'], '', 5000);
    vi.unstubAllGlobals();
    expect(models.EL).toBeNull();
  });
});
