import { describe, it, expect } from 'vitest';
import { SUPPORTED_SECONDARY_LEAGUES } from '../apiSportsClient';
import { COMPETITION_MAP } from '../footballDataApi';
import { calculateMarketProbabilities } from '../predictionEngine';
import { extractOpportunitiesFromMatches, computeLeagueRadarStats } from '../scannerService';
import { marketFairFromBookmakers } from '../marketBlend';
import { Match } from '../../types/football';

describe('Cup Competitions Support (UCL, UEL, UECL)', () => {
  describe('API-Sports Supported Competitions', () => {
    it('should include UEFA Champions League (id 2) with correct metadata and goal averages', () => {
      const ucl = SUPPORTED_SECONDARY_LEAGUES[2];
      expect(ucl).toBeDefined();
      expect(ucl.id).toBe(2);
      expect(ucl.internalId).toBe('ucl');
      expect(ucl.name).toBe('Bajnokok Ligája');
      expect(ucl.country).toBe('Európa');
      expect(ucl.flag).toBe('⭐');
      expect(ucl.priority).toBe(5);
      expect(ucl.avgHomeGoals).toBeGreaterThan(1.6);
      expect(ucl.avgAwayGoals).toBeGreaterThan(1.2);
    });

    it('should include UEFA Europa League (id 3) with correct metadata and goal averages', () => {
      const uel = SUPPORTED_SECONDARY_LEAGUES[3];
      expect(uel).toBeDefined();
      expect(uel.id).toBe(3);
      expect(uel.internalId).toBe('uel');
      expect(uel.name).toBe('Európa Liga');
      expect(uel.country).toBe('Európa');
      expect(uel.flag).toBe('🏆');
      expect(uel.priority).toBe(6);
      expect(uel.avgHomeGoals).toBeGreaterThan(1.5);
      expect(uel.avgAwayGoals).toBeGreaterThan(1.1);
    });

    it('should include UEFA Conference League (id 848) with correct metadata and goal averages', () => {
      const uecl = SUPPORTED_SECONDARY_LEAGUES[848];
      expect(uecl).toBeDefined();
      expect(uecl.id).toBe(848);
      expect(uecl.internalId).toBe('uecl');
      expect(uecl.name).toBe('Konferencia Liga');
      expect(uecl.country).toBe('Európa');
      expect(uecl.flag).toBe('🟢');
      expect(uecl.priority).toBe(7);
      expect(uecl.avgHomeGoals).toBeGreaterThan(1.5);
      expect(uecl.avgAwayGoals).toBeGreaterThan(1.1);
    });
  });

  describe('Football-Data.org Competition Map', () => {
    it('should map CL, EL, and EC to internal cup representations', () => {
      expect(COMPETITION_MAP['CL']).toEqual({
        id: 'ucl',
        name: 'Bajnokok Ligája',
        country: 'Európa',
        flag: '⭐',
        priority: 5,
      });

      expect(COMPETITION_MAP['EL']).toEqual({
        id: 'uel',
        name: 'Európa Liga',
        country: 'Európa',
        flag: '🏆',
        priority: 6,
      });

      expect(COMPETITION_MAP['EC']).toEqual({
        id: 'uecl',
        name: 'Konferencia Liga',
        country: 'Európa',
        flag: '🟢',
        priority: 7,
      });
    });
  });

  describe('Cup Match Probabilities & Market Modeling', () => {
    it('should calculate realistic high-scoring market probabilities for top-tier UCL matchups', () => {
      // UCL match with high attacking output (Bernabéu: Real Madrid vs Bayern)
      const probs = calculateMarketProbabilities(2.25, 1.70, 1.0, -0.13);

      expect(probs.homeWin).toBeGreaterThan(45);
      expect(probs.over25).toBeGreaterThan(60);
      expect(probs.bttsYes).toBeGreaterThan(55);
      expect(probs.fhOver05).toBeGreaterThan(70);
    });
  });

  describe('Scanner Integration for Cup Matches', () => {
    const mockUclMatch: Match = {
      id: 'test-ucl-1',
      leagueId: 'ucl',
      leagueName: 'Bajnokok Ligája',
      leagueCountry: 'Európa',
      leagueFlag: '⭐',
      kickoffTime: '21:00',
      kickoffDate: '2026-10-19',
      status: 'UPCOMING',
      homeTeam: {
        id: 'rma',
        name: 'Real Madrid',
        shortName: 'RMA',
        logo: '',
        xgAvg: 2.35,
      },
      awayTeam: {
        id: 'bay',
        name: 'Bayern München',
        shortName: 'BAY',
        logo: '',
        xgAvg: 2.20,
      },
      probabilities: {
        homeWin: 52,
        draw: 24,
        awayWin: 24,
        bttsYes: 68,
        over15: 86,
        over25: 72,
        over35: 48,
        fhOver05: 78,
      },
      odds: {
        home: 2.15,
        draw: 3.75,
        away: 3.20,
        bttsYes: 1.55,
        over25: 1.50,
      },
      realOdds: {
        fixtureId: 999,
        updatedAt: '12:00',
        // Pinnacle a piaci referencia (fair); a Bet365 jobb árat ad (ár-előny)
        bookmakers: [
          { name: 'Pinnacle', home: 2.05, draw: 3.6, away: 3.6, over25: 1.5, under25: 2.65 },
          { name: 'Bet365', home: 2.15, draw: 3.5, away: 3.5, over25: 1.58, under25: 2.4 },
        ],
        bestOdds: {
          home: { odd: 2.15, bookmaker: 'Bet365' },
          over25: { odd: 1.58, bookmaker: 'Bet365' },
        },
      },
    };

    it('should extract scanner opportunities and detect positive expected values in UCL match', () => {
      const opps = extractOpportunitiesFromMatches([mockUclMatch]);
      expect(opps.length).toBeGreaterThanOrEqual(5);

      const homeOpp = opps.find((o) => o.market === '1');
      expect(homeOpp).toBeDefined();
      expect(homeOpp?.probability).toBe(52);
      // Az EV a Pinnacle fair valószínűséghez mér (nem a nyers modellhez): ár-előny a legjobb szorzón
      const fair = marketFairFromBookmakers(mockUclMatch.realOdds!.bookmakers);
      expect(homeOpp?.expectedValue).toBeCloseTo((fair.p1x2![0] * 2.15 - 1) * 100, 1);
      expect(homeOpp?.expectedValue).toBeGreaterThan(0);
      expect(homeOpp?.expectedValue).toBeLessThan(5);

      const o25Opp = opps.find((o) => o.market === 'OVER_25');
      expect(o25Opp).toBeDefined();
      expect(o25Opp?.expectedValue).toBeCloseTo((fair.pOver25! * 1.58 - 1) * 100, 1);
    });

    it('should compute league radar statistics for international cup leagues', () => {
      const radar = computeLeagueRadarStats([mockUclMatch]);
      expect(radar.length).toBe(1);
      expect(radar[0].leagueId).toBe('ucl');
      expect(radar[0].leagueName).toBe('Bajnokok Ligája');
      expect(radar[0].avgExpectedGoals).toBeCloseTo(4.55, 1);
      expect(radar[0].avgOver25Prob).toBe(72);
      expect(radar[0].avgBttsProb).toBe(68);
    });
  });
});
