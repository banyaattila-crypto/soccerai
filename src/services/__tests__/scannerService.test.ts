import { describe, it, expect } from 'vitest';
import { marketFairFromBookmakers } from '../marketBlend';
import {
  extractOpportunitiesFromMatches,
  filterAndSortOpportunities,
  computeLeagueRadarStats,
} from '../scannerService';
import { Match } from '../../types/football';

describe('scannerService - Kvantitatív Értékkereső & Radar', () => {
  const dummyMatches: Match[] = [
    {
      id: 'm1',
      leagueId: 'pl',
      leagueName: 'Premier League',
      leagueCountry: 'Anglia',
      leagueFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      kickoffTime: '16:00',
      kickoffDate: '2026-10-19',
      status: 'UPCOMING',
      homeTeam: {
        id: 'arsenal',
        name: 'Arsenal',
        shortName: 'ARS',
        logo: '',
        xgAvg: 2.2,
      },
      awayTeam: {
        id: 'chelsea',
        name: 'Chelsea',
        shortName: 'CHE',
        logo: '',
        xgAvg: 1.4,
      },
      probabilities: {
        homeWin: 62,
        draw: 22,
        awayWin: 16,
        bttsYes: 58,
        over15: 84,
        over25: 64,
        over35: 35,
        fhOver05: 75,
      },
      odds: {
        home: 1.85, // legjobb szorzó; az EV a Pinnacle fair valószínűséghez mér
        draw: 3.8,
        away: 5.5,
        bttsYes: 1.75,
        over25: 1.7,
      },
      realOdds: {
        fixtureId: 101,
        updatedAt: '12:00',
        // Pinnacle = piaci referencia; a Bet365 jobb hazai szorzót ad (ár-előny)
        bookmakers: [
          { name: 'Pinnacle', home: 1.78, draw: 4.0, away: 5.0 },
          { name: 'Bet365', home: 1.85, draw: 3.8, away: 4.8 },
        ],
        bestOdds: {
          home: { odd: 1.85, bookmaker: 'Bet365' },
        },
      },
      aiPick: {
        market: '1',
        marketLabel: 'Arsenal Győzelem (1)',
        probability: 62,
        odds: 1.85,
        confidence: 8.8,
        expectedValue: 14.7,
        reasoning: 'Erős hazai dominancia.',
      },
    },
    {
      id: 'm2',
      leagueId: 'bl1',
      leagueName: 'Bundesliga',
      leagueCountry: 'Németország',
      leagueFlag: '🇩🇪',
      kickoffTime: '18:30',
      kickoffDate: '2026-10-19',
      status: 'UPCOMING',
      homeTeam: {
        id: 'bayern',
        name: 'Bayern München',
        shortName: 'FCB',
        logo: '',
        xgAvg: 2.8,
      },
      awayTeam: {
        id: 'dortmund',
        name: 'Dortmund',
        shortName: 'BVB',
        logo: '',
        xgAvg: 1.9,
      },
      probabilities: {
        homeWin: 55,
        draw: 22,
        awayWin: 23,
        bttsYes: 72,
        over15: 90,
        over25: 78,
        over35: 52,
        fhOver05: 82,
      },
      odds: {
        home: 1.8,
        draw: 4.2,
        away: 4.0,
        bttsYes: 1.5,
        over25: 1.45,
      },
      aiPick: {
        market: 'OVER_25',
        marketLabel: '2.5 Gól Felett',
        probability: 78,
        odds: 1.45,
        confidence: 9.2,
        expectedValue: 13.1,
        reasoning: 'Gólgazdag összecsapás.',
      },
    },
  ];

  it('kinyeri a lehetséges fogadási piacokat mindegyik meccsből', () => {
    const opps = extractOpportunitiesFromMatches(dummyMatches);

    expect(opps.length).toBeGreaterThan(10);
    // Valós bukmékeri odds (m1_1 Pinnacle)
    const m1Home = opps.find((o) => o.id === 'm1_1');
    expect(m1Home).toBeDefined();
    expect(m1Home?.isRealOdds).toBe(true);
    // EV = legjobb szorzó · Pinnacle fair valószínűség − 1 (nem a nyers modell: az +14,7% lett volna)
    const fair = marketFairFromBookmakers(dummyMatches[0].realOdds!.bookmakers);
    expect(m1Home?.expectedValue).toBeCloseTo((fair.p1x2![0] * 1.85 - 1) * 100, 1);
    expect(m1Home?.quarterKellyPct).toBeGreaterThan(0);

    // Szimulált árképzésű mérkőzés (m2_1): szigorúan 0 EV és Kelly!
    const m2Home = opps.find((o) => o.id === 'm2_1');
    expect(m2Home).toBeDefined();
    expect(m2Home?.isRealOdds).toBe(false);
    expect(m2Home?.expectedValue).toBe(0);
    expect(m2Home?.quarterKellyPct).toBe(0);
  });

  it('szűri és rangsorolja a lehetőségeket a presetek alapján', () => {
    const opps = extractOpportunitiesFromMatches(dummyMatches);

    // Csak Over 2.5
    const over25List = filterAndSortOpportunities(opps, {
      preset: 'over_25',
      sortBy: 'prob',
    });
    expect(over25List.every((o) => o.market === 'OVER_25')).toBe(true);
    expect(over25List[0].probability).toBe(78); // Bayern meccs elöl

    // Csak BTTS
    const bttsList = filterAndSortOpportunities(opps, {
      preset: 'btts',
      sortBy: 'prob',
    });
    expect(bttsList.every((o) => o.market === 'BTTS_YES')).toBe(true);
    expect(bttsList[0].probability).toBe(72);

    // Kiemelt AI Pickek
    const aiPicks = filterAndSortOpportunities(opps, {
      preset: 'ai_picks',
      sortBy: 'ev',
    });
    expect(aiPicks.length).toBe(2);
  });

  it('kiszámítja a ligák kvantitatív radar statisztikáit', () => {
    const radar = computeLeagueRadarStats(dummyMatches);

    expect(radar.length).toBe(2);
    // Bundesliga több várható góllal rendelkezik mint a PL
    expect(radar[0].leagueId).toBe('bl1');
    expect(radar[0].avgExpectedGoals).toBeCloseTo(4.7, 1); // 2.8 + 1.9 = 4.7
    expect(radar[0].avgOver25Prob).toBe(78);
    expect(radar[0].avgBttsProb).toBe(72);
  });
});
