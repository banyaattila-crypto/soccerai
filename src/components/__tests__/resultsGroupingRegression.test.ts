import { describe, it, expect, beforeEach } from 'vitest';
import {
  MAX_ARCHIVED_MATCHES,
  persistFinishedMatchesToHistory,
  getArchivedFinishedMatches,
  clearArchivedFinishedMatches,
} from '../../services/historyService';
import { MAX_AUDIT_RECORDS } from '../../services/predictionAuditService';
import { Match } from '../../types/football';

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

describe('Results View & History Retention Regression Test Suite', () => {
  beforeEach(() => {
    clearArchivedFinishedMatches();
  });

  it('verifies that MAX_ARCHIVED_MATCHES is 300 and matches MAX_AUDIT_RECORDS for 60-90 days retention', () => {
    expect(MAX_ARCHIVED_MATCHES).toBe(300);
    expect(MAX_AUDIT_RECORDS).toBe(300);
  });

  it('persists and stores up to 300 finished matches in history archive', () => {
    const fakeMatches: Match[] = Array.from({ length: 320 }, (_, idx) => ({
      id: `match-history-${idx}`,
      leagueId: 'PL',
      leagueName: 'Premier League',
      leagueCountry: 'Anglia',
      leagueFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      homeTeam: { id: `home-${idx}`, name: `Team H ${idx}`, shortName: 'TH', logo: '', rank: 1, form: [], xgAvg: 1.5, goalsScoredAvg: 1.5, goalsConcededAvg: 1.0 },
      awayTeam: { id: `away-${idx}`, name: `Team A ${idx}`, shortName: 'TA', logo: '', rank: 2, form: [], xgAvg: 1.2, goalsScoredAvg: 1.2, goalsConcededAvg: 1.2 },
      kickoffDate: `2026-08-${String((idx % 28) + 1).padStart(2, '0')}`,
      kickoffTime: '18:00',
      status: 'FINISHED',
      homeScore: (idx % 3) + 1,
      awayScore: idx % 2,
      probabilities: { homeWin: 45, draw: 27, awayWin: 28, over15: 75, over25: 52, over35: 30, bttsYes: 54, fhOver05: 70 },
      odds: { home: 2.1, draw: 3.4, away: 3.6, over25: 1.8, under25: 2.0, bttsYes: 1.75 },
    }));

    const saved = persistFinishedMatchesToHistory(fakeMatches);
    expect(saved.length).toBe(300);

    const reloaded = getArchivedFinishedMatches();
    expect(reloaded.length).toBe(300);
    expect(reloaded[0].status).toBe('FINISHED');
  });

  it('correctly sorts matches in chronological descending order', () => {
    const m1: Match = {
      id: 'm-old',
      leagueId: 'PL',
      leagueName: 'Premier League',
      leagueCountry: 'Anglia',
      leagueFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      homeTeam: { id: 'h1', name: 'Team A', shortName: 'TA', logo: '', rank: 1, form: [], xgAvg: 1, goalsScoredAvg: 1, goalsConcededAvg: 1 },
      awayTeam: { id: 'a1', name: 'Team B', shortName: 'TB', logo: '', rank: 2, form: [], xgAvg: 1, goalsScoredAvg: 1, goalsConcededAvg: 1 },
      kickoffDate: '2026-10-10',
      kickoffTime: '15:00',
      status: 'FINISHED',
      homeScore: 1,
      awayScore: 0,
      probabilities: { homeWin: 45, draw: 27, awayWin: 28, over15: 75, over25: 52, over35: 30, bttsYes: 54, fhOver05: 70 },
      odds: { home: 2.0, draw: 3.2, away: 3.5, over25: 1.8, under25: 2.0, bttsYes: 1.8 },
    };

    const m2: Match = {
      ...m1,
      id: 'm-new',
      kickoffDate: '2026-10-21',
      kickoffTime: '20:45',
    };

    const saved = persistFinishedMatchesToHistory([m1, m2]);
    expect(saved[0].id).toBe('m-new');
    expect(saved[1].id).toBe('m-old');
  });
});
