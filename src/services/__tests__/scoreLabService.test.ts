import { describe, it, expect } from 'vitest';
import {
  getDixonColesScoreMatrix,
  calculateFormPoints,
  getTeamComparisonStats,
} from '../scoreLabService';
import { Match } from '../../types/football';

describe('scoreLabService - ScoreLab Mátrix & H2H Szolgáltatás', () => {
  const dummyMatch: Match = {
    id: 'test-m-1',
    leagueId: 'pl',
    leagueName: 'Premier League',
    leagueCountry: 'Anglia',
    leagueFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    kickoffTime: '20:00',
    kickoffDate: '2026-10-19',
    status: 'UPCOMING',
    homeTeam: {
      id: 'arsenal',
      name: 'Arsenal',
      shortName: 'ARS',
      logo: 'https://media.api-sports.io/football/teams/42.png',
      rank: 2,
      form: ['W', 'W', 'W', 'D', 'W'],
      xgAvg: 2.1,
      goalsScoredAvg: 2.2,
      goalsConcededAvg: 0.8,
    },
    awayTeam: {
      id: 'aston-villa',
      name: 'Aston Villa',
      shortName: 'AVL',
      logo: 'https://media.api-sports.io/football/teams/66.png',
      rank: 5,
      form: ['W', 'L', 'W', 'D', 'W'],
      xgAvg: 1.3,
      goalsScoredAvg: 1.6,
      goalsConcededAvg: 1.4,
    },
    probabilities: {
      homeWin: 60,
      draw: 22,
      awayWin: 18,
      bttsYes: 54,
      over15: 82,
      over25: 58,
      over35: 32,
      fhOver05: 72,
    },
    odds: {
      home: 1.65,
      draw: 4.2,
      away: 5.1,
      bttsYes: 1.8,
      over25: 1.7,
    },
    h2h: [
      { date: '2026-04-14', homeScore: 0, awayScore: 2, homeWinner: false },
      { date: '2025-12-09', homeScore: 1, awayScore: 0, homeWinner: true },
      { date: '2025-02-18', homeScore: 4, awayScore: 2, homeWinner: true },
    ],
  };

  describe('Dixon-Coles Poisson Gólmátrix (getDixonColesScoreMatrix)', () => {
    it('5x5 méretű aggregált mátrixot ad vissza valid cellákkal', () => {
      const report = getDixonColesScoreMatrix(dummyMatch);

      expect(report.matrix5x5.length).toBe(5);
      expect(report.matrix5x5[0].length).toBe(5);

      // Minden cella valószínűsége 0 és 1 közötti
      let totalProb = 0;
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          const cell = report.matrix5x5[i][j];
          expect(cell.probability).toBeGreaterThanOrEqual(0);
          expect(cell.fairOdds).toBeGreaterThanOrEqual(1.0);
          expect(['home', 'draw', 'away']).toContain(cell.zone);
          totalProb += cell.probability;
        }
      }

      // A teljes 5x5 mátrix összege 1.0 (100%)
      expect(totalProb).toBeCloseTo(1.0, 4);
    });

    it('a legvalószínűbb végeredmények (topScores) csökkenő sorrendben vannak', () => {
      const report = getDixonColesScoreMatrix(dummyMatch);

      expect(report.topScores.length).toBe(6);
      for (let i = 0; i < report.topScores.length - 1; i++) {
        expect(report.topScores[i].probabilityPct).toBeGreaterThanOrEqual(
          report.topScores[i + 1].probabilityPct
        );
      }
    });

    it('a kimeneteli zónák (hazai + döntetlen + vendég) összege 100%', () => {
      const report = getDixonColesScoreMatrix(dummyMatch);
      const sumZones =
        report.outcomeZones.homeWinPct +
        report.outcomeZones.drawPct +
        report.outcomeZones.awayWinPct;

      expect(sumZones).toBe(100);
    });

    it('a gólszám-eloszlás sávok összege 100%', () => {
      const report = getDixonColesScoreMatrix(dummyMatch);
      const sumDist =
        report.goalsDistribution.under15Pct +
        report.goalsDistribution.mid23Pct +
        report.goalsDistribution.over35Pct;

      expect(sumDist).toBe(100);
    });
  });

  describe('Forma és H2H Statisztikák (calculateFormPoints & getTeamComparisonStats)', () => {
    it('helyesen számolja a forma pontszámát és százalékát', () => {
      const form1: ('W' | 'D' | 'L')[] = ['W', 'W', 'W', 'W', 'W']; // 5 * 3 = 15 pont = 100%
      expect(calculateFormPoints(form1)).toEqual({ points: 15, pct: 100 });

      const form2: ('W' | 'D' | 'L')[] = ['L', 'L', 'L', 'L', 'L']; // 0 pont = 0%
      expect(calculateFormPoints(form2)).toEqual({ points: 0, pct: 0 });

      const form3: ('W' | 'D' | 'L')[] = ['W', 'D', 'L']; // 3 + 1 + 0 = 4 / 9 = 44%
      expect(calculateFormPoints(form3)).toEqual({ points: 4, pct: 44 });
    });

    it('feldolgozza a H2H mérkőzéseket és kiszámítja a győzelmeket és gólátlagokat', () => {
      const stats = getTeamComparisonStats(dummyMatch);

      expect(stats.h2h.hasHistory).toBe(true);
      expect(stats.h2h.totalMatches).toBe(3);
      expect(stats.h2h.homeWins).toBe(2);
      expect(stats.h2h.awayWins).toBe(1);
      expect(stats.h2h.draws).toBe(0);
      expect(stats.h2h.avgTotalGoals).toBe(3.0); // (0+2 + 1+0 + 4+2) = 9 / 3 = 3.0
      expect(stats.h2h.bttsMatches).toBe(1); // 4-2 volt mindkettő lőtt gólt
      expect(stats.modelVerdict.advantage).toBe('home');
    });

    it('kezeli, ha nincs rögzített H2H múlt', () => {
      const matchNoH2H: Match = {
        ...dummyMatch,
        h2h: undefined,
      };

      const stats = getTeamComparisonStats(matchNoH2H);
      expect(stats.h2h.hasHistory).toBe(false);
      expect(stats.h2h.totalMatches).toBe(0);
      expect(stats.h2h.matches.length).toBe(0);
      expect(stats.h2h.avgTotalGoals).toBeGreaterThan(0);
    });
  });
});
