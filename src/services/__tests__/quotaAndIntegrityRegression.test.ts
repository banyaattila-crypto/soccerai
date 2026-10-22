import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkFootballDataQuota,
  recordFootballDataCall,
  checkApiSportsQuota,
  recordApiSportsCall,
  getOverallQuotaSummary,
  resetQuotaStateForTesting,
} from '../quotaService';
import {
  importAuditLogFromJson,
  computeRecordHash,
  saveAuditLog,
  getAuditLog,
  AUDIT_BASE_STAKE,
} from '../predictionAuditService';
import { importBetsFromJson, getTrackedBets, saveTrackedBets, getInitialBankroll } from '../bankrollService';
import { getItemInvalidReason } from '../../components/BetSlipDrawer';
import { BetSlipItem, PredictionAuditRecord } from '../../types/football';

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

if (typeof window === 'undefined') {
  (globalThis as any).window = globalThis;
}

describe('Quota Management & Rate Limiting (quotaService)', () => {
  beforeEach(() => {
    resetQuotaStateForTesting();
    localStorage.clear();
  });

  it('allows requests within Football-Data sliding window (10 req/min) and blocks 11th', () => {
    // 10 hívás rögzítése
    for (let i = 0; i < 10; i++) {
      const check = checkFootballDataQuota();
      expect(check.isRateLimited).toBe(false);
      recordFootballDataCall(200);
    }

    // 11. hívás blokkolva kell legyen
    const blockedCheck = checkFootballDataQuota();
    expect(blockedCheck.isRateLimited).toBe(true);
    expect(blockedCheck.retryAfterSeconds).toBeGreaterThan(0);
    expect(blockedCheck.lastErrorNotice).toContain('10 lekérés/perc');
  });

  it('respects manual backoff periods on 429 rate limit responses', () => {
    // 60 másodperces backoff beállítása 429 esetén
    recordFootballDataCall(429, { 'Retry-After': '60' });

    const check = checkFootballDataQuota();
    expect(check.isRateLimited).toBe(true);
    expect(check.retryAfterSeconds).toBeGreaterThanOrEqual(58);
  });

  it('tracks API-Sports daily quota limit (100 req/day) and enforces limits', () => {
    const initialCheck = checkApiSportsQuota();
    expect(initialCheck.isRateLimited).toBe(false);
    expect(initialCheck.dailyRemaining).toBe(100);

    // 5 hívás
    for (let i = 0; i < 5; i++) {
      recordApiSportsCall(200);
    }

    const checkAfter5 = checkApiSportsQuota();
    expect(checkAfter5.dailyRemaining).toBe(95);

    // API-Sports 429 backoff
    recordApiSportsCall(429);
    const checkAfterBackoff = checkApiSportsQuota();
    expect(checkAfterBackoff.isRateLimited).toBe(true);
    expect(checkAfterBackoff.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('provides an overall quota summary for status banners and diagnostics', () => {
    recordFootballDataCall(200);
    recordFootballDataCall(200);
    recordApiSportsCall(200);

    const summary = getOverallQuotaSummary();
    expect(summary.footballData.requestsRemaining).toBe(8);
    expect(summary.apiSports.dailyRemaining).toBe(99);
    expect(summary.hasActiveRateLimit).toBe(false);
  });
});

describe('Audit Log Cryptographic Import & Tamper Resistance (predictionAuditService)', () => {
  beforeEach(() => {
    saveAuditLog([]);
    localStorage.clear();
  });

  it('successfully imports valid pre-match records with verified hash signatures', () => {
    const kickoffMs = Date.now() + 86400000;
    const hash = computeRecordHash({
      matchId: 'match-101',
      kickoffTimestamp: kickoffMs,
      loggedAt: '2026-10-21T10:00:00.000Z',
      market: 'HOME_WIN',
      probability: 68,
      odds: 1.85,
    });

    const validRecord: PredictionAuditRecord = {
      id: 'audit-match-101',
      matchId: 'match-101',
      leagueId: 'pl',
      leagueName: 'Premier League',
      homeTeam: { name: 'Arsenal' },
      awayTeam: { name: 'Chelsea' },
      kickoffDate: '2026-10-21',
      kickoffTime: '18:00',
      kickoffTimestamp: kickoffMs,
      loggedAt: '2026-10-21T10:00:00.000Z',
      provenance: 'VERIFIED_PRE_MATCH',
      auditHash: hash,
      settled: false,
      status: 'PENDING',
      profit: 0,
      roi: 0,
      pick: {
        market: 'HOME_WIN',
        marketLabel: 'Arsenal (1)',
        odds: 1.85,
        probability: 68,
        expectedValue: 25.8,
      },
    };

    const importResult = importAuditLogFromJson(JSON.stringify([validRecord]));
    expect(importResult.success).toBe(true);
    expect(importResult.importedCount).toBe(1);
    expect(importResult.rejectedCount).toBe(0);

    const log = getAuditLog();
    expect(log.length).toBe(1);
    expect(log[0].matchId).toBe('match-101');
  });

  it('rejects tampered records where odds, probability, or results were modified without valid hash', () => {
    const kickoffMs = Date.now() + 86400000;
    const legitimateHash = computeRecordHash({
      matchId: 'match-102',
      kickoffTimestamp: kickoffMs,
      loggedAt: '2026-10-21T10:00:00.000Z',
      market: 'HOME_WIN',
      probability: 55,
      odds: 1.80,
    });

    // Csalási kísérlet: az odds-ot 1.80-ról 3.50-re írták át utólag a jobb ROI hazudásához
    const tamperedRecord: PredictionAuditRecord = {
      id: 'audit-match-102',
      matchId: 'match-102',
      leagueId: 'pl',
      leagueName: 'Premier League',
      homeTeam: { name: 'Liverpool' },
      awayTeam: { name: 'Everton' },
      kickoffDate: '2026-10-21',
      kickoffTime: '18:00',
      kickoffTimestamp: kickoffMs,
      loggedAt: '2026-10-21T10:00:00.000Z',
      provenance: 'VERIFIED_PRE_MATCH',
      auditHash: legitimateHash, // Régi hash nem egyezik az új odds-szal!
      settled: false,
      status: 'PENDING',
      profit: 0,
      roi: 0,
      pick: {
        market: 'HOME_WIN',
        marketLabel: 'Liverpool (1)',
        odds: 3.50, // HAMISÍTVA
        probability: 55,
        expectedValue: 92.5,
      },
    };

    const importResult = importAuditLogFromJson(JSON.stringify([tamperedRecord]));
    expect(importResult.success).toBe(false);
    expect(importResult.importedCount).toBe(0);
    expect(importResult.rejectedCount).toBe(1);
    expect(importResult.errors.length).toBeGreaterThan(0);
  });

  it('preserves settlement scores and results when importing settled records into pending log', () => {
    const kickoffMs = Date.now() + 86400000;
    const hash = computeRecordHash({
      matchId: 'match-update-1',
      kickoffTimestamp: kickoffMs,
      loggedAt: '2026-10-21T10:00:00.000Z',
      market: 'HOME_WIN',
      probability: 60,
      odds: 1.90,
    });

    const pendingRecord: PredictionAuditRecord = {
      id: 'audit-match-update-1',
      matchId: 'match-update-1',
      leagueId: 'pl',
      leagueName: 'Premier League',
      homeTeam: { name: 'Man City' },
      awayTeam: { name: 'Newcastle' },
      kickoffDate: '2026-10-21',
      kickoffTime: '20:00',
      kickoffTimestamp: kickoffMs,
      loggedAt: '2026-10-21T10:00:00.000Z',
      provenance: 'VERIFIED_PRE_MATCH',
      auditHash: hash,
      settled: false,
      status: 'PENDING',
      profit: 0,
      roi: 0,
      pick: {
        market: 'HOME_WIN',
        marketLabel: 'Man City (1)',
        odds: 1.90,
        probability: 60,
        expectedValue: 14.0,
      },
    };

    // Kezdetben csak a pending van a naplóban
    saveAuditLog([pendingRecord]);
    expect(getAuditLog()[0].settled).toBe(false);

    // Importáljuk a lezárt változatot (meccs befejeződött 2-1 eredménnyel, NYERT)
    const settledImportRecord: PredictionAuditRecord = {
      ...pendingRecord,
      settled: true,
      settledAt: '2026-10-21T22:00:00.000Z',
      homeScore: 2,
      awayScore: 1,
      status: 'WON',
      profit: 900,
      roi: 90,
    };

    const result = importAuditLogFromJson(JSON.stringify([settledImportRecord]));
    expect(result.success).toBe(true);
    expect(result.importedCount).toBe(1);

    const updatedLog = getAuditLog();
    expect(updatedLog.length).toBe(1);
    expect(updatedLog[0].settled).toBe(true);
    expect(updatedLog[0].homeScore).toBe(2);
    expect(updatedLog[0].awayScore).toBe(1);
    expect(updatedLog[0].status).toBe('WON');
  });

  it('neutralizes forged settlement status and profit on import by re-evaluating actual match scores', () => {
    const kickoffMs = Date.now() - 3600000;
    const hash = computeRecordHash({
      matchId: 'match-tamper-fraud',
      kickoffTimestamp: kickoffMs,
      loggedAt: '2026-10-21T10:00:00.000Z',
      market: 'OVER_25',
      probability: 60,
      odds: 2.10,
    });

    // Csalási kísérlet: 0-0-s meccsre a felhasználó Over 2.5 tippet adott,
    // és a JSON-ben status: 'WON' és profit: 500000-et hazudik
    const forgedSettledRecord: PredictionAuditRecord = {
      id: 'audit-match-tamper-fraud',
      matchId: 'match-tamper-fraud',
      leagueId: 'pl',
      leagueName: 'Premier League',
      homeTeam: { name: 'Man City' },
      awayTeam: { name: 'Arsenal' },
      kickoffDate: '2026-10-21',
      kickoffTime: '15:00',
      kickoffTimestamp: kickoffMs,
      loggedAt: '2026-10-21T10:00:00.000Z',
      provenance: 'VERIFIED_PRE_MATCH',
      auditHash: hash, // Érvényes pre-match aláírás!
      settled: true,
      homeScore: 0,
      awayScore: 0,
      status: 'WON', // <-- CSALÁS
      profit: 500000, // <-- CSALÁS
      roi: 5000, // <-- CSALÁS
      pick: {
        market: 'OVER_25',
        marketLabel: '2.5 gól felett',
        odds: 2.10,
        probability: 60,
        expectedValue: 26.0,
      },
    };

    const res = importAuditLogFromJson(JSON.stringify([forgedSettledRecord]));
    expect(res.success).toBe(true);

    const log = getAuditLog();
    const imported = log.find((r) => r.id === 'audit-match-tamper-fraud');
    expect(imported).toBeDefined();
    // A rendszer felülbírálta a csalási kísérletet: a tényleges gólok (0-0) alapján a státusz LOST
    expect(imported?.status).toBe('LOST');
    // A profit szigorúan -10 000 Ft (AUDIT_BASE_STAKE), nem pedig az importált 500 000 Ft!
    expect(imported?.profit).toBe(-AUDIT_BASE_STAKE);
    expect(imported?.roi).toBe(-100);
  });

  it('reverts settled status to PENDING if imported record lacks valid numerical match scores', () => {
    const kickoffMs = Date.now() - 3600000;
    const hash = computeRecordHash({
      matchId: 'match-no-scores',
      kickoffTimestamp: kickoffMs,
      loggedAt: '2026-10-21T10:00:00.000Z',
      market: '1',
      probability: 65,
      odds: 1.80,
    });

    const invalidScoreRecord: PredictionAuditRecord = {
      id: 'audit-match-no-scores',
      matchId: 'match-no-scores',
      leagueId: 'pl',
      leagueName: 'Premier League',
      homeTeam: { name: 'Chelsea' },
      awayTeam: { name: 'Spurs' },
      kickoffDate: '2026-10-21',
      kickoffTime: '15:00',
      kickoffTimestamp: kickoffMs,
      loggedAt: '2026-10-21T10:00:00.000Z',
      provenance: 'VERIFIED_PRE_MATCH',
      auditHash: hash,
      settled: true,
      homeScore: undefined,
      awayScore: undefined,
      status: 'WON',
      profit: 8000,
      roi: 80,
      pick: {
        market: '1',
        marketLabel: 'Chelsea (1)',
        odds: 1.80,
        probability: 65,
        expectedValue: 17.0,
      },
    };

    const res = importAuditLogFromJson(JSON.stringify([invalidScoreRecord]));
    expect(res.success).toBe(true);

    const log = getAuditLog();
    const imported = log.find((r) => r.id === 'audit-match-no-scores');
    expect(imported).toBeDefined();
    expect(imported?.settled).toBe(false);
    expect(imported?.status).toBe('PENDING');
    expect(imported?.profit).toBe(0);
  });
});

describe('Bankroll JSON Import Strict Validation (bankrollService)', () => {
  beforeEach(() => {
    saveTrackedBets([]);
    localStorage.clear();
  });

  it('accepts both wrapped object and raw array JSON formats with valid schema', () => {
    const sampleBet = {
      id: 'bet-valid-1',
      createdAt: '2026-10-20T12:00:00.000Z',
      stake: 5000,
      totalOdds: 2.10,
      potentialWin: 10500,
      status: 'PENDING',
      items: [
        {
          matchId: 'm1',
          matchTitle: 'Real Madrid - Barcelona',
          marketLabel: 'Real Madrid (1)',
          odds: 2.10,
          probability: 55,
        },
      ],
    };

    // 1. Csomagolt objektum
    const wrappedJson = JSON.stringify({
      version: '1.6.0',
      initialBankroll: 75000,
      bets: [sampleBet],
    });

    const res1 = importBetsFromJson(wrappedJson);
    expect(res1).toBe(true);
    expect(getTrackedBets().length).toBe(1);
    expect(getInitialBankroll()).toBe(75000);

    // 2. Közvetlen tömb
    const arrayJson = JSON.stringify([
      {
        ...sampleBet,
        id: 'bet-valid-2',
      },
    ]);
    const res2 = importBetsFromJson(arrayJson);
    expect(res2).toBe(true);
    expect(getTrackedBets().length).toBe(1);
  });

  it('rejects malformed bets with negative stake, invalid odds, or missing items', () => {
    const invalidBets = [
      {
        id: 'bad-1',
        createdAt: '2026-10-20T12:00:00.000Z',
        stake: -1000, // negatív tét
        totalOdds: 2.0,
        potentialWin: 0,
        status: 'PENDING',
        items: [{ matchId: 'm1', marketLabel: '1', odds: 2.0 }],
      },
      {
        id: 'bad-2',
        createdAt: '2026-10-20T12:00:00.000Z',
        stake: 1000,
        totalOdds: 0.8, // érvénytelen odds (< 1.0)
        potentialWin: 800,
        status: 'PENDING',
        items: [{ matchId: 'm1', marketLabel: '1', odds: 0.8 }],
      },
      {
        id: 'bad-3',
        createdAt: '2026-10-20T12:00:00.000Z',
        stake: 1000,
        totalOdds: 2.0,
        potentialWin: 2000,
        status: 'PENDING',
        items: [], // üres eseménylista
      },
    ];

    const res = importBetsFromJson(JSON.stringify({ bets: invalidBets }));
    expect(res).toBe(false);
    expect(getTrackedBets().length).toBe(0);
  });
});

describe('Bet Slip Item Status & Integrity Validation (getItemInvalidReason)', () => {
  it('identifies finished, live, postponed, cancelled, and suspended matches as invalid', () => {
    const baseItem: BetSlipItem = {
      matchId: 'm-test',
      matchTitle: 'Team A - Team B',
      marketLabel: 'Team A (1)',
      odds: 1.95,
      probability: 55,
      kickoffDate: '2026-10-25',
      kickoffTime: '20:00',
    };

    expect(getItemInvalidReason({ ...baseItem, matchStatus: 'FINISHED' })).toContain('befejeződött');
    expect(getItemInvalidReason({ ...baseItem, matchStatus: 'LIVE' })).toContain('élő');
    expect(getItemInvalidReason({ ...baseItem, matchStatus: 'POSTPONED' })).toContain('elhalasztva');
    expect(getItemInvalidReason({ ...baseItem, matchStatus: 'CANCELLED' })).toContain('törölve');
    expect(getItemInvalidReason({ ...baseItem, matchStatus: 'SUSPENDED' })).toContain('félbeszakadt');
  });

  it('identifies matches whose kickoff time has already passed as invalid', () => {
    const pastItem: BetSlipItem = {
      matchId: 'm-past',
      matchTitle: 'Past Match',
      marketLabel: 'Over 2.5',
      odds: 1.80,
      probability: 60,
      matchStatus: 'UPCOMING',
      kickoffDate: '2020-01-01', // Múltbeli dátum
      kickoffTime: '12:00',
    };

    const reason = getItemInvalidReason(pastItem);
    expect(reason).toContain('elkezdődött');
  });

  it('allows future UPCOMING pre-match selections without errors', () => {
    const futureItem: BetSlipItem = {
      matchId: 'm-future',
      matchTitle: 'Future Match',
      marketLabel: 'Over 2.5',
      odds: 1.85,
      probability: 58,
      matchStatus: 'UPCOMING',
      kickoffDate: '2030-10-25', // Jövőbeli dátum
      kickoffTime: '20:45',
    };

    expect(getItemInvalidReason(futureItem)).toBeNull();
  });
});

describe('audit ellenőrző összeg formátuma', () => {
  it('az új összeg SHA-256 alapú (audit2-, 64 hex), a régi formátumú rekord továbbra is ellenőrizhető', async () => {
    const { computeRecordHash, verifyRecordHash } = await import('../predictionAuditService');
    const data = { matchId: 'm1', kickoffTimestamp: 1790000000000, loggedAt: '2026-10-22T10:00:00.000Z', market: '1X2_HOME', probability: 0.5, odds: 2.1 };
    const h = computeRecordHash(data);
    expect(h).toMatch(/^audit2-[0-9a-f]{64}$/);
    expect(verifyRecordHash(data, h)).toBe(true);
    expect(verifyRecordHash({ ...data, odds: 2.2 }, h)).toBe(false);
    // 53 bites, régi formátum (v1.32.0 előtti rekord): elfogadott, de módosításra érvénytelen
    const legacy = 'audit-' + '0'.repeat(14);
    expect(verifyRecordHash(data, legacy)).toBe(false);
  });
});
