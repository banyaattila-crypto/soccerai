import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  selectPrefetchTargets,
  selectClosingTargets,
  refreshOddsForTracking,
  getBudgetUsed,
  ODDS_TRACKING_DAILY_BUDGET,
  PREFETCH_MAX_PER_RUN,
  CLOSING_REFRESH_MAX_PER_RUN,
  CLOSING_MIN_AGE_MS,
  type TargetDeps,
} from '../oddsPrefetch';
import { ODDS_CACHE_TTL_MS } from '../apiSportsClient';
import type { Match, PredictionAuditRecord } from '../../types/football';

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
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
  },
  configurable: true,
  writable: true,
});

const NOW = Date.parse('2026-10-23T12:00:00Z');
const MIN = 60 * 1000;
const HOUR = 60 * MIN;

const match = (id: string, kickInMs: number, over: Partial<Match> = {}): Match =>
  ({
    id,
    status: 'UPCOMING',
    utcDate: new Date(NOW + kickInMs).toISOString(),
    kickoffDate: '2026-10-23',
    kickoffTime: '14:00',
    aiPick: { market: '1', probability: 60, odds: 1.8, isTopPick: false },
    ...over,
  }) as unknown as Match;

const fixtureIds: Record<string, number> = {};
const cacheAges: Record<number, number | null> = {};
const deps: TargetDeps = {
  fixtureId: (m) => fixtureIds[m.id] ?? null,
  cachedAgeMs: (id) => (id in cacheAges ? cacheAges[id] : null),
};

beforeEach(() => {
  localStorage.clear();
  for (const k of Object.keys(fixtureIds)) delete fixtureIds[k];
  for (const k of Object.keys(cacheAges)) delete cacheAges[Number(k)];
});

describe('selectPrefetchTargets', () => {
  it('csak a kezdés előtti, tippel és fixture-azonosítóval rendelkező, szorzó nélküli meccseket választja', () => {
    const ms = [
      match('a', 5 * HOUR),
      match('noPick', 5 * HOUR, { aiPick: undefined }),
      match('noId', 5 * HOUR),
      match('live', 5 * HOUR, { status: 'LIVE' }),
      match('past', -1 * HOUR),
      match('tooFar', 40 * HOUR),
      match('tooSoon', 5 * MIN), // a záró ablakon belül: nem előzetes lekérés
      match('fresh', 5 * HOUR),
    ];
    fixtureIds.a = 1;
    fixtureIds.noPick = 2;
    fixtureIds.live = 4;
    fixtureIds.past = 5;
    fixtureIds.tooFar = 6;
    fixtureIds.tooSoon = 7;
    fixtureIds.fresh = 8;
    cacheAges[8] = 10 * MIN; // friss szorzó van
    const t = selectPrefetchTargets(ms, NOW, deps);
    expect(t.map((x) => x.match.id)).toEqual(['a']);
  });

  it('a lejárt gyorsítótárat újra lekéri; a top tipp és a magasabb esély előre kerül; max korlát', () => {
    const ms = Array.from({ length: 10 }, (_, i) =>
      match(`m${i}`, 3 * HOUR, { aiPick: { market: '1', probability: 50 + i, odds: 1.8, isTopPick: i === 2 } as never })
    );
    ms.forEach((m, i) => (fixtureIds[m.id] = 100 + i));
    cacheAges[105] = ODDS_CACHE_TTL_MS + MIN; // lejárt: jelölt
    const t = selectPrefetchTargets(ms, NOW, deps);
    expect(t).toHaveLength(PREFETCH_MAX_PER_RUN);
    expect(t[0].match.id).toBe('m2'); // top tipp
    expect(t[1].match.id).toBe('m9'); // legmagasabb esély
    expect(t.map((x) => x.match.id)).toContain('m5');
  });
});

describe('selectClosingTargets', () => {
  const record = (matchId: string, kickInMs: number, over: Partial<PredictionAuditRecord> = {}): PredictionAuditRecord =>
    ({
      id: `r-${matchId}`,
      matchId,
      kickoffTimestamp: NOW + kickInMs,
      pick: { market: '1', odds: 2, isSimulatedOdds: false },
      marketAtLog: { fairProb: 47, seenAt: new Date(NOW - HOUR).toISOString() },
      settled: false,
      ...over,
    }) as unknown as PredictionAuditRecord;

  it('csak a záró ablakban lévő, valós szorzós, lezáratlan rekordokat, elég régi gyorsítótárral', () => {
    const ms = ['a', 'b', 'c', 'd', 'e', 'f'].map((id, i) => {
      fixtureIds[id] = i + 1;
      return match(id, 60 * MIN);
    });
    const recs = [
      record('a', 60 * MIN), // jó
      record('b', 5 * MIN), // túl közel a kezdéshez
      record('c', 5 * HOUR), // túl messze
      record('d', 60 * MIN, { settled: true }),
      record('e', 60 * MIN, { pick: { market: '1', odds: 2, isSimulatedOdds: true } as never }),
      record('f', 60 * MIN),
    ];
    cacheAges[6] = CLOSING_MIN_AGE_MS - MIN; // friss: nem kell újra
    const t = selectClosingTargets(recs, ms, NOW, deps);
    expect(t.map((x) => x.match.id)).toEqual(['a']);
  });

  it('a közelebbi kezdés előre, legfeljebb a futásonkénti korlát', () => {
    const ids = Array.from({ length: 8 }, (_, i) => `m${i}`);
    const ms = ids.map((id, i) => {
      fixtureIds[id] = 50 + i;
      return match(id, 60 * MIN);
    });
    const recs = ids.map((id, i) => record(id, (100 - i * 5) * MIN));
    const t = selectClosingTargets(recs, ms, NOW, deps);
    expect(t).toHaveLength(CLOSING_REFRESH_MAX_PER_RUN);
    expect(t[0].match.id).toBe('m7');
  });
});

describe('refreshOddsForTracking', () => {
  const okQuota = { isRateLimited: false, dailyRemaining: 80 };

  it('lekéri a jelölteket (záró: kényszerítve, előzetes: nem), és számolja a keretet', async () => {
    fixtureIds.p = 11;
    fixtureIds.c = 12;
    const ms = [match('p', 4 * HOUR), match('c', 60 * MIN)];
    const recs = [
      {
        id: 'r',
        matchId: 'c',
        kickoffTimestamp: NOW + 60 * MIN,
        pick: { market: '1', odds: 2, isSimulatedOdds: false },
        marketAtLog: { fairProb: 47, seenAt: new Date(NOW - HOUR).toISOString() },
        settled: false,
      } as unknown as PredictionAuditRecord,
    ];
    const calls: [number, boolean][] = [];
    const res = await refreshOddsForTracking(ms, recs, {
      nowMs: NOW,
      deps,
      quota: okQuota,
      fetchOdds: async (id, force) => {
        calls.push([id, force]);
        return { ok: true };
      },
    });
    expect(res.fetched).toBe(2);
    expect(calls).toEqual([
      [12, true],
      [11, false],
    ]);
    expect(getBudgetUsed(NOW)).toBe(2);
  });

  it('kvótapihenőnél, kevés napi tartaléknál és elfogyott keretnél nem kér semmit', async () => {
    fixtureIds.p = 11;
    const ms = [match('p', 4 * HOUR)];
    const fetchOdds = vi.fn(async () => ({}));
    expect((await refreshOddsForTracking(ms, [], { nowMs: NOW, deps, quota: { isRateLimited: true }, fetchOdds })).fetched).toBe(0);
    expect(
      (await refreshOddsForTracking(ms, [], { nowMs: NOW, deps, quota: { isRateLimited: false, dailyRemaining: 5 }, fetchOdds })).reason
    ).toBe('napi kvóta tartalék');
    localStorage.setItem(
      'soccerai_odds_tracking_budget_v1',
      JSON.stringify({ date: '2026-10-23', used: ODDS_TRACKING_DAILY_BUDGET })
    );
    expect((await refreshOddsForTracking(ms, [], { nowMs: NOW, deps, quota: okQuota, fetchOdds })).reason).toBe('napi keret elfogyott');
    expect(fetchOdds).not.toHaveBeenCalled();
  });

  it('egy hiba nem állítja meg a többit; másnap a keret nullázódik', async () => {
    fixtureIds.a = 1;
    fixtureIds.b = 2;
    const ms = [match('a', 4 * HOUR), match('b', 4 * HOUR)];
    const res = await refreshOddsForTracking(ms, [], {
      nowMs: NOW,
      deps,
      quota: okQuota,
      fetchOdds: async (id) => {
        if (id === 1) throw new Error('hálózati hiba');
        return { ok: true };
      },
    });
    expect(res.fetched).toBe(1);
    expect(getBudgetUsed(NOW)).toBe(2);
    expect(getBudgetUsed(NOW + 24 * HOUR)).toBe(0);
  });
});
