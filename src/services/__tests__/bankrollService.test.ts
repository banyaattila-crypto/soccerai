import { describe, it, expect, beforeEach } from 'vitest';
import {
  autoEvaluateTrackedBets,
  calculateBankrollSummary,
  createTrackedBet,
} from '../bankrollService';
import { Match, TrackedBet } from '../../types/football';

const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] || null,
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: storageMock,
  writable: true,
});

describe('bankrollService - Szelvény Kiértékelés és Pénzkövetés', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('createTrackedBet', () => {
    it('helyesen hoz létre egy új fogadási szelvényt kumulált oddsszal és nyereménnyel', () => {
      const items = [
        {
          matchId: 'm1',
          matchTitle: 'Arsenal - Chelsea',
          marketLabel: 'Arsenal (1)',
          market: '1' as const,
          odds: 1.80,
          probability: 60,
        },
        {
          matchId: 'm2',
          matchTitle: 'Liverpool - Man City',
          marketLabel: '2.5 gól felett',
          market: 'OVER_25' as const,
          odds: 1.60,
          probability: 65,
        },
      ];

      const bet = createTrackedBet(items, 5000, 'Teszt szelvény');

      expect(bet.id).toBeDefined();
      expect(bet.stake).toBe(5000);
      expect(bet.status).toBe('PENDING');
      // 1.80 * 1.60 = 2.88
      expect(bet.totalOdds).toBeCloseTo(2.88, 2);
      // 5000 * 2.88 = 14400
      expect(bet.potentialWin).toBe(14400);
      expect(bet.items.length).toBe(2);
      expect(bet.notes).toBe('Teszt szelvény');
    });
  });

  describe('autoEvaluateTrackedBets', () => {
    it('lezárt meccs esetén (Arsenal (1) 2-1) nyertesre zárja az egyes kötést és menti az eredményt', () => {
      const pendingBet: TrackedBet = {
        id: 'bet-single-1',
        createdAt: new Date().toISOString(),
        stake: 10000,
        totalOdds: 1.85,
        potentialWin: 18500,
        status: 'PENDING',
        items: [
          {
            matchId: 'm-arsenal-chelsea',
            matchTitle: 'Arsenal - Chelsea',
            marketLabel: 'Arsenal (1)', // Csapatnév + (1) formátum
            market: '1',
            odds: 1.85,
            probability: 62,
          },
        ],
      };

      const finishedMatch: Match = {
        id: 'm-arsenal-chelsea',
        leagueId: 'pl',
        leagueName: 'Premier League',
        leagueCountry: 'Anglia',
        leagueFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        kickoffTime: '20:00',
        kickoffDate: '2026-10-18',
        status: 'FINISHED',
        homeTeam: { id: 't1', name: 'Arsenal', shortName: 'ARS', logo: '' },
        awayTeam: { id: 't2', name: 'Chelsea', shortName: 'CHE', logo: '' },
        homeScore: 2,
        awayScore: 1,
        homeHalfTimeScore: 1,
        awayHalfTimeScore: 0,
        probabilities: { homeWin: 62, draw: 22, awayWin: 16, bttsYes: 55, over15: 80, over25: 58, over35: 35, fhOver05: 70 },
        odds: { home: 1.85, draw: 3.5, away: 4.5, bttsYes: 1.8, over25: 1.85 },
      };

      const result = autoEvaluateTrackedBets([pendingBet], [finishedMatch]);

      expect(result.updatedCount).toBe(1);
      const evaluated = result.updatedBets[0];
      expect(evaluated.status).toBe('WON');
      expect(evaluated.netProfit).toBe(8500); // 18500 - 10000
      expect(evaluated.settledAt).toBeDefined();

      // Ellenőrizzük, hogy a félidős és végeredmény rögzítésre került az itemben
      expect(evaluated.items[0].isWon).toBe(true);
      expect(evaluated.items[0].homeScore).toBe(2);
      expect(evaluated.items[0].awayScore).toBe(1);
      expect(evaluated.items[0].homeHalfTimeScore).toBe(1);
      expect(evaluated.items[0].awayHalfTimeScore).toBe(0);
    });

    it('többes kötésnél (kombi) ha az egyik elem elmegy, az egész szelvény LOST státuszú', () => {
      const parlayBet: TrackedBet = {
        id: 'bet-parlay-1',
        createdAt: new Date().toISOString(),
        stake: 4000,
        totalOdds: 3.6,
        potentialWin: 14400,
        status: 'PENDING',
        items: [
          {
            matchId: 'm1',
            matchTitle: 'Arsenal - Chelsea',
            marketLabel: 'Arsenal (1)',
            market: '1',
            odds: 1.8,
            probability: 60,
          },
          {
            matchId: 'm2',
            matchTitle: 'Real Madrid - Barcelona',
            marketLabel: '2.5 gól felett',
            market: 'OVER_25',
            odds: 2.0,
            probability: 55,
          },
        ],
      };

      const matches: Match[] = [
        {
          id: 'm1',
          leagueId: 'pl',
          leagueName: 'Premier League',
          leagueCountry: 'Anglia',
          leagueFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
          kickoffTime: '20:00',
          kickoffDate: '2026-10-18',
          status: 'FINISHED',
          homeTeam: { id: 't1', name: 'Arsenal', shortName: 'ARS', logo: '' },
          awayTeam: { id: 't2', name: 'Chelsea', shortName: 'CHE', logo: '' },
          homeScore: 2,
          awayScore: 1, // Arsenal nyert -> WON
          probabilities: { homeWin: 60, draw: 22, awayWin: 18, bttsYes: 55, over15: 80, over25: 58, over35: 35, fhOver05: 70 },
          odds: { home: 1.8, draw: 3.5, away: 4.5, bttsYes: 1.8, over25: 1.85 },
        },
        {
          id: 'm2',
          leagueId: 'laliga',
          leagueName: 'La Liga',
          leagueCountry: 'Spanyolország',
          leagueFlag: '🇪🇸',
          kickoffTime: '21:00',
          kickoffDate: '2026-10-18',
          status: 'FINISHED',
          homeTeam: { id: 't3', name: 'Real Madrid', shortName: 'RMA', logo: '' },
          awayTeam: { id: 't4', name: 'Barcelona', shortName: 'FCB', logo: '' },
          homeScore: 1,
          awayScore: 0, // 1-0 -> Under 2.5 -> LOST
          probabilities: { homeWin: 45, draw: 25, awayWin: 30, bttsYes: 60, over15: 85, over25: 65, over35: 40, fhOver05: 75 },
          odds: { home: 2.1, draw: 3.4, away: 3.2, bttsYes: 1.7, over25: 2.0 },
        },
      ];

      const result = autoEvaluateTrackedBets([parlayBet], matches);

      expect(result.updatedCount).toBe(1);
      const evaluated = result.updatedBets[0];
      expect(evaluated.status).toBe('LOST');
      expect(evaluated.netProfit).toBe(-4000);
      expect(evaluated.items[0].isWon).toBe(true);
      expect(evaluated.items[1].isWon).toBe(false);
    });

    it('ha egy mérkőzés még nem fejeződött be, a szelvény PENDING marad', () => {
      const parlayBet: TrackedBet = {
        id: 'bet-pending-parlay',
        createdAt: new Date().toISOString(),
        stake: 2000,
        totalOdds: 3.0,
        potentialWin: 6000,
        status: 'PENDING',
        items: [
          {
            matchId: 'm1',
            matchTitle: 'Arsenal - Chelsea',
            marketLabel: 'Arsenal (1)',
            market: '1',
            odds: 1.5,
            probability: 68,
          },
          {
            matchId: 'm2',
            matchTitle: 'Liverpool - Everton',
            marketLabel: 'Liverpool (1)',
            market: '1',
            odds: 2.0,
            probability: 55,
          },
        ],
      };

      const matches: Match[] = [
        {
          id: 'm1',
          leagueId: 'pl',
          leagueName: 'Premier League',
          leagueCountry: 'Anglia',
          leagueFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
          kickoffTime: '20:00',
          kickoffDate: '2026-10-18',
          status: 'FINISHED',
          homeTeam: { id: 't1', name: 'Arsenal', shortName: 'ARS', logo: '' },
          awayTeam: { id: 't2', name: 'Chelsea', shortName: 'CHE', logo: '' },
          homeScore: 3,
          awayScore: 0,
          probabilities: { homeWin: 68, draw: 20, awayWin: 12, bttsYes: 50, over15: 80, over25: 60, over35: 35, fhOver05: 70 },
          odds: { home: 1.5, draw: 4.0, away: 6.0, bttsYes: 1.9, over25: 1.8 },
        },
        {
          id: 'm2',
          leagueId: 'pl',
          leagueName: 'Premier League',
          leagueCountry: 'Anglia',
          leagueFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
          kickoffTime: '17:30',
          kickoffDate: '2026-10-18',
          status: 'UPCOMING', // Még nem zárult le!
          homeTeam: { id: 't5', name: 'Liverpool', shortName: 'LIV', logo: '' },
          awayTeam: { id: 't6', name: 'Everton', shortName: 'EVE', logo: '' },
          probabilities: { homeWin: 55, draw: 25, awayWin: 20, bttsYes: 52, over15: 78, over25: 55, over35: 30, fhOver05: 68 },
          odds: { home: 2.0, draw: 3.5, away: 3.8, bttsYes: 1.85, over25: 1.9 },
        },
      ];

      const result = autoEvaluateTrackedBets([parlayBet], matches);

      expect(result.updatedCount).toBe(0);
      expect(result.updatedBets[0].status).toBe('PENDING');
      expect(result.updatedBets[0].items[0].isWon).toBe(true);
      expect(result.updatedBets[0].items[1].isWon).toBeUndefined();
    });
  });

  describe('calculateBankrollSummary', () => {
    it('helyesen számolja ki a bankroll statisztikákat (ROI, találati arány, nettó profit)', () => {
      const bets: TrackedBet[] = [
        {
          id: 'b1',
          createdAt: '2026-10-16',
          stake: 5000,
          totalOdds: 2.0,
          potentialWin: 10000,
          status: 'WON',
          netProfit: 5000,
          items: [],
        },
        {
          id: 'b2',
          createdAt: '2026-10-17',
          stake: 5000,
          totalOdds: 2.0,
          potentialWin: 10000,
          status: 'LOST',
          netProfit: -5000,
          items: [],
        },
        {
          id: 'b3',
          createdAt: '2026-10-18',
          stake: 10000,
          totalOdds: 1.8,
          potentialWin: 18000,
          status: 'WON',
          netProfit: 8000,
          items: [],
        },
      ];

      const summary = calculateBankrollSummary(bets, 50000);

      expect(summary.initialBankroll).toBe(50000);
      expect(summary.totalBets).toBe(3);
      expect(summary.wonBets).toBe(2);
      expect(summary.lostBets).toBe(1);
      expect(summary.pendingBets).toBe(0);

      // Winrate: 2 / 3 = 66.7%
      expect(summary.winRate).toBeCloseTo(66.7, 1);
      // Net profit: 5000 - 5000 + 8000 = 8000 Ft
      expect(summary.netProfit).toBe(8000);
      // Current bankroll: 50000 + 8000 = 58000 Ft
      expect(summary.currentBankroll).toBe(58000);
      // Total staked: 5000 + 5000 + 10000 = 20000 Ft
      expect(summary.totalStaked).toBe(20000);
      // ROI: 8000 / 20000 * 100 = 40%
      expect(summary.roiPct).toBe(40);
    });
  });
});
