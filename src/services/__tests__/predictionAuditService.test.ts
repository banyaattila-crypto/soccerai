import { describe, it, expect, beforeEach } from 'vitest';
import { Match } from '../../types/football';
import {
  recordPreMatchPredictions,
  settleAuditPredictions,
  getAuditLog,
  getVerifiedAuditStats,
  isMatchBeforeKickoff,
} from '../predictionAuditService';

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

describe('predictionAuditService (Kezdés előtti nem felülírható predikciónapló)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const createDummyMatch = (overrides: Partial<Match> = {}): Match => ({
    id: 'test-m-1',
    leagueId: 'pl',
    leagueName: 'Premier League',
    leagueCountry: 'Anglia',
    leagueFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    kickoffTime: '20:45',
    kickoffDate: '2026-10-25',
    utcDate: '2026-10-25T20:45:00.000Z',
    status: 'UPCOMING',
    homeTeam: { id: 'ars', name: 'Arsenal', shortName: 'ARS', logo: '' },
    awayTeam: { id: 'che', name: 'Chelsea', shortName: 'CHE', logo: '' },
    probabilities: {
      homeWin: 60,
      draw: 22,
      awayWin: 18,
      bttsYes: 55,
      over15: 80,
      over25: 58,
      over35: 35,
      fhOver05: 75,
    },
    odds: {
      home: 1.8,
      draw: 3.8,
      away: 4.5,
      bttsYes: 1.75,
      over25: 1.85,
    },
    aiPick: {
      market: '1',
      marketLabel: 'Arsenal (1)',
      probability: 60,
      odds: 1.8,
      confidence: 8,
      expectedValue: 8.0,
      reasoning: 'Erős hazai forma és magas xG előny',
    },
    ...overrides,
  });

  it('helyesen ellenőrzi a kezdés előtti állapotot', () => {
    const futureMatch = createDummyMatch({
      utcDate: '2026-10-25T20:45:00.000Z',
      status: 'UPCOMING',
    });
    const nowMs = new Date('2026-10-25T18:00:00.000Z').getTime();
    expect(isMatchBeforeKickoff(futureMatch, nowMs)).toBe(true);

    // Ha a meccs már LIVE
    const liveMatch = createDummyMatch({
      utcDate: '2026-10-25T20:45:00.000Z',
      status: 'LIVE',
    });
    expect(isMatchBeforeKickoff(liveMatch, nowMs)).toBe(false);

    // Ha a meccs már befejeződött
    const finishedMatch = createDummyMatch({
      utcDate: '2026-10-25T20:45:00.000Z',
      status: 'FINISHED',
    });
    expect(isMatchBeforeKickoff(finishedMatch, nowMs)).toBe(false);

    // Ha az időpont a múltban van
    const pastMatchTime = new Date('2026-10-25T21:00:00.000Z').getTime();
    expect(isMatchBeforeKickoff(futureMatch, pastMatchTime)).toBe(false);
  });

  it('rögzíti a kezdés előtti előrejelzést az audit naplóban', () => {
    const match = createDummyMatch();
    const nowMs = new Date('2026-10-25T15:00:00.000Z').getTime();

    const result = recordPreMatchPredictions([match], nowMs);
    expect(result.added).toBe(1);

    const log = getAuditLog();
    expect(log.length).toBe(1);
    expect(log[0].matchId).toBe('test-m-1');
    expect(log[0].provenance).toBe('VERIFIED_PRE_MATCH');
    expect(log[0].settled).toBe(false);
    expect(log[0].status).toBe('PENDING');
    expect(log[0].pick.market).toBe('1');
    expect(log[0].pick.odds).toBe(1.8);
    expect(log[0].auditHash).toBeDefined();
  });

  it('NEM FELÜLÍRHATÓ: egy már naplózott tippet a későbbi frissítés sem írhat felül', () => {
    const match = createDummyMatch();
    const nowMs = new Date('2026-10-25T15:00:00.000Z').getTime();

    // 1. Első rögzítés: Hazai (1) tippel, 1.80-as odds
    recordPreMatchPredictions([match], nowMs);

    // 2. Későbbi futás: megváltozott odds és megváltozott AI pick a meccshez
    const modifiedMatch = createDummyMatch({
      aiPick: {
        market: 'OVER_25',
        marketLabel: '2.5 gól felett',
        probability: 65,
        odds: 2.1,
        confidence: 9,
        expectedValue: 15.0,
        reasoning: 'Gólzápor várható',
      },
    });

    const secondResult = recordPreMatchPredictions([modifiedMatch], nowMs + 60000);
    expect(secondResult.added).toBe(0); // Nem adott hozzá újat
    expect(secondResult.skipped).toBe(1);

    // Ellenőrzés: A naplóban maradt az eredeti, lepecsételt tipp!
    const log = getAuditLog();
    expect(log.length).toBe(1);
    expect(log[0].pick.market).toBe('1'); // Maradt az eredeti '1'!
    expect(log[0].pick.odds).toBe(1.8);
    expect(log[0].pick.marketLabel).toBe('Arsenal (1)');
  });

  it('elutasítja a kezdés utáni meccsek auditálását', () => {
    const match = createDummyMatch({
      status: 'FINISHED',
      homeScore: 3,
      awayScore: 1,
    });
    const nowMs = new Date('2026-10-25T23:00:00.000Z').getTime();

    const result = recordPreMatchPredictions([match], nowMs);
    expect(result.added).toBe(0);
    expect(result.skipped).toBe(1);
    expect(getAuditLog().length).toBe(0);
  });

  it('lezárja a meccset valós eredménnyel és pontosan számol profitot', () => {
    const match = createDummyMatch();
    const nowMs = new Date('2026-10-25T15:00:00.000Z').getTime();

    recordPreMatchPredictions([match], nowMs);

    // Meccs lezárása: Arsenal nyert 2-0-ra (Hazai győzelem '1' -> WON)
    const finishedMatch = createDummyMatch({
      status: 'FINISHED',
      homeScore: 2,
      awayScore: 0,
    });

    const settleResult = settleAuditPredictions([finishedMatch]);
    expect(settleResult.settledCount).toBe(1);

    const log = getAuditLog();
    expect(log[0].settled).toBe(true);
    expect(log[0].status).toBe('WON');
    expect(log[0].homeScore).toBe(2);
    expect(log[0].awayScore).toBe(0);
    // 10 000 Ft alaptétnél 1.80 odds -> +8 000 Ft profit
    expect(log[0].profit).toBe(8000);
    expect(log[0].roi).toBe(80);
  });

  it('vesztes meccsnél pontos -100% ROI-t és alaptét veszteséget könyvel', () => {
    const match = createDummyMatch();
    const nowMs = new Date('2026-10-25T15:00:00.000Z').getTime();

    recordPreMatchPredictions([match], nowMs);

    // Meccs lezárása: Chelsea nyert 1-2-re -> Arsenal '1' LOST
    const finishedMatch = createDummyMatch({
      status: 'FINISHED',
      homeScore: 1,
      awayScore: 2,
    });

    settleAuditPredictions([finishedMatch]);

    const log = getAuditLog();
    expect(log[0].settled).toBe(true);
    expect(log[0].status).toBe('LOST');
    expect(log[0].profit).toBe(-10000);
    expect(log[0].roi).toBe(-100);
  });

  it('a régi/nem auditált meccseket nem tekinti igazolt eredménynek', () => {
    // 1. Van egy lezárt auditált meccsünk
    const match1 = createDummyMatch({ id: 'm-1' });
    const nowMs = new Date('2026-10-25T15:00:00.000Z').getTime();
    recordPreMatchPredictions([match1], nowMs);

    const finished1 = createDummyMatch({
      id: 'm-1',
      status: 'FINISHED',
      homeScore: 2,
      awayScore: 1,
    });
    settleAuditPredictions([finished1]);

    // 2. Érkezik egy meccs, ami NEM szerepelt a kezdés előtti naplóban (pl. régi API lezárt meccs)
    const unverifiedMatch = createDummyMatch({
      id: 'm-unverified-old',
      status: 'FINISHED',
      homeScore: 5,
      awayScore: 0,
    });
    // Kísérlet a settle-re: mivel nincs a naplóban, nem minősülhet auditáltnak
    const unvResult = settleAuditPredictions([unverifiedMatch]);
    expect(unvResult.settledCount).toBe(0);

    // Statisztikák: csak az 1 darab hitelesített meccset tartalmazza!
    const stats = getVerifiedAuditStats();
    expect(stats.totalAudited).toBe(1);
    expect(stats.settledCount).toBe(1);
    expect(stats.wonCount).toBe(1);
    expect(stats.winRate).toBe(100);
  });
});
