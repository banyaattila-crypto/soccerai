import { describe, it, expect } from 'vitest';
import { runTracker, parseFixtures, parseOddsBooks, apiErrorText, type ApiResponse } from '../trackerRunner';
import { emptyState, budgetUsed, TRACKER_CONFIG } from '../trackerCore';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const T0 = Date.parse('2026-10-23T08:00:00Z');
const KICK = T0 + 5 * HOUR;

const bk = (name: string, h: number, d: number, a: number, o: number, u: number) => ({
  name,
  bets: [
    { name: 'Match Winner', values: [{ value: 'Home', odd: String(h) }, { value: 'Draw', odd: String(d) }, { value: 'Away', odd: String(a) }] },
    { name: 'Goals Over/Under', values: [{ value: 'Over 2.5', odd: String(o) }, { value: 'Under 2.5', odd: String(u) }] },
  ],
});

const oddsJson = (softHome: number) => ({
  response: [
    {
      bookmakers: [
        bk('Pinnacle', 2.0, 3.6, 4.0, 1.95, 1.95),
        bk('Bet365', 1.97, 3.5, 3.9, 1.9, 1.95),
        bk('Unibet', 1.95, 3.5, 3.8, 1.9, 1.9),
        bk('SoftBook', softHome, 3.5, 3.9, 1.9, 1.9),
      ],
    },
  ],
  errors: [],
});

const fixturesJson = (statusShort: string, score?: [number, number], league = 39) => ({
  response: [
    {
      fixture: { id: 777, date: new Date(KICK).toISOString(), timestamp: KICK / 1000, status: { short: statusShort } },
      league: { id: league, name: 'Premier League' },
      teams: { home: { name: 'Hazai' }, away: { name: 'Vendég' } },
      goals: { home: score ? score[0] : null, away: score ? score[1] : null },
      score: { fulltime: { home: score ? score[0] : null, away: score ? score[1] : null } },
    },
  ],
  errors: [],
});

interface FakeApi {
  api: (path: string) => Promise<ApiResponse>;
  calls: string[];
}
function fakeApi(handler: (path: string) => ApiResponse): FakeApi {
  const calls: string[] = [];
  return {
    calls,
    api: async (path) => {
      calls.push(path);
      return handler(path);
    },
  };
}

const leagues = new Set([39]);

describe('parseFixtures / parseOddsBooks / apiErrorText', () => {
  it('a 90 perces végeredményt a score.fulltime adja (hosszabbítás után is)', () => {
    const json = {
      response: [
        {
          fixture: { id: 1, timestamp: 1000, status: { short: 'AET' } },
          league: { id: 39, name: 'L' },
          teams: { home: { name: 'A' }, away: { name: 'B' } },
          goals: { home: 3, away: 2 },
          score: { fulltime: { home: 2, away: 2 } },
        },
      ],
    };
    const [f] = parseFixtures(json);
    expect(f.statusShort).toBe('AET');
    expect(f.score).toEqual({ home: 2, away: 2 });
    expect(f.kickoffTs).toBe(1_000_000);
  });

  it('hiányzó azonosítót vagy időpontot átugorja', () => {
    expect(parseFixtures({ response: [{ league: { id: 1 } }, { fixture: { id: 5 }, league: { id: 1 } }] })).toEqual([]);
  });

  it('az odds-válaszból kompakt sorok készülnek, a használhatatlan bukmékert kihagyja', () => {
    const json = oddsJson(2.3);
    json.response[0].bookmakers.push({ name: 'Empty', bets: [] } as never);
    const books = parseOddsBooks(json);
    expect(Object.keys(books)).toEqual(['Pinnacle', 'Bet365', 'Unibet', 'SoftBook']);
    expect(books.SoftBook).toEqual([2.3, 3.5, 3.9, 1.9, 1.9]);
    expect(parseOddsBooks({ response: [] })).toEqual({});
  });

  it('az API 200-as válaszában lévő hibát felismeri', () => {
    expect(apiErrorText({ errors: [] })).toBeNull();
    expect(apiErrorText({ errors: {} })).toBeNull();
    expect(apiErrorText({ errors: { rateLimit: 'Too many requests' } })).toContain('rateLimit');
    expect(apiErrorText(null)).toBeNull();
  });
});

describe('runTracker: teljes életciklus', () => {
  it('felfedezés -> korai pillanatkép és jelölt -> záró pillanatképek -> eredmény és lezárás', async () => {
    const state = emptyState(T0);
    let phase: 'before' | 'after' = 'before';
    const api = fakeApi((path) => {
      if (path.startsWith('/fixtures?date=')) {
        const date = path.split('=')[1];
        // a mérkőzés kezdésének napján adja vissza (és a következő napon is, hogy lássuk a szűrést)
        return {
          status: 200,
          remaining: 80,
          json:
            date === '2026-10-23' || date === '2026-10-24'
              ? phase === 'before'
                ? fixturesJson('NS')
                : fixturesJson('FT', [2, 0])
              : { response: [], errors: [] },
        };
      }
      return { status: 200, remaining: 70, json: oddsJson(2.3) };
    });

    // 1. futás: meccslisták (2) + korai pillanatkép (1)
    const r1 = await runTracker(state, { api: api.api, nowMs: T0, leagueIds: leagues, log: () => undefined });
    expect(r1.calls).toBe(3);
    expect(r1.newCandidates).toBe(1);
    const f = state.fixtures['777'];
    expect(f.candidate?.bookmaker).toBe('SoftBook');
    expect(f.snapshots).toHaveLength(1);
    expect(api.calls.filter((c) => c.startsWith('/fixtures'))).toHaveLength(2);

    // közbeeső futás (nincs ablak): nem hív semmit
    const idle = await runTracker(state, { api: api.api, nowMs: T0 + HOUR, leagueIds: leagues });
    expect(idle.calls).toBe(0);

    // 2. futás: a kezdés előtt 60 perccel -> első záró pillanatkép
    const r2 = await runTracker(state, { api: api.api, nowMs: KICK - 60 * MIN, leagueIds: leagues });
    expect(r2.calls).toBe(1);
    expect(state.fixtures['777'].snapshots.filter((s) => s.kind === 'close')).toHaveLength(1);

    // 3. futás: a kezdés előtt 25 perccel -> második záró pillanatkép
    const r3 = await runTracker(state, { api: api.api, nowMs: KICK - 25 * MIN, leagueIds: leagues });
    expect(r3.calls).toBe(1);
    expect(state.fixtures['777'].snapshots.filter((s) => s.kind === 'close')).toHaveLength(2);

    // 4. futás: a meccs után -> meccslista (eredmény), lezárás
    phase = 'after';
    const r4 = await runTracker(state, { api: api.api, nowMs: KICK + 3 * HOUR, leagueIds: leagues });
    expect(r4.settled).toHaveLength(1);
    const rec = r4.settled[0];
    expect(rec.won).toBe(true);
    expect(rec.profitUnits).toBeCloseTo(1.3, 6);
    expect(rec.clv).not.toBeNull();
    expect(state.fixtures['777']).toBeUndefined();
  });

  it('nem követett liga meccsét nem veszi fel, ezért szorzót sem kér rá', async () => {
    const state = emptyState(T0);
    const api = fakeApi((path) =>
      path.startsWith('/fixtures')
        ? { status: 200, json: fixturesJson('NS', undefined, 999) }
        : { status: 200, json: oddsJson(2.3) }
    );
    const r = await runTracker(state, { api: api.api, nowMs: T0, leagueIds: leagues });
    expect(Object.keys(state.fixtures)).toEqual([]);
    expect(api.calls.every((c) => c.startsWith('/fixtures'))).toBe(true);
    expect(r.calls).toBe(2);
  });
});

describe('runTracker: keret és hibák', () => {
  const discover = (state: ReturnType<typeof emptyState>, n: number) => {
    for (let i = 0; i < n; i++) {
      state.fixtures[String(i)] = {
        id: i,
        leagueId: 39,
        league: 'PL',
        home: 'A',
        away: 'B',
        kickoffTs: T0 + (3 + i) * HOUR,
        status: 'scheduled',
        snapshots: [],
      };
    }
    state.fixtureRefresh['2026-10-23'] = T0;
    state.fixtureRefresh['2026-10-24'] = T0;
  };

  it('a napi keret és a futásonkénti korlát szerint hív', async () => {
    const state = emptyState(T0);
    discover(state, 20);
    const api = fakeApi(() => ({ status: 200, json: oddsJson(2.0) }));
    const r = await runTracker(state, { api: api.api, nowMs: T0, leagueIds: leagues });
    expect(r.calls).toBe(TRACKER_CONFIG.EARLY_PER_RUN);

    const state2 = emptyState(T0);
    discover(state2, 20);
    state2.budget.used = 48;
    const api2 = fakeApi(() => ({ status: 200, json: oddsJson(2.0) }));
    const r2 = await runTracker(state2, { api: api2.api, nowMs: T0, leagueIds: leagues, budgetCap: 50 });
    expect(r2.calls).toBe(2);
    expect(budgetUsed(state2, T0)).toBe(50);
  });

  it('a tartalék alá csökkenő napi kvótánál leáll', async () => {
    const state = emptyState(T0);
    discover(state, 5);
    const api = fakeApi(() => ({ status: 200, remaining: 8, json: oddsJson(2.0) }));
    const r = await runTracker(state, { api: api.api, nowMs: T0, leagueIds: leagues, reserve: 12 });
    expect(r.calls).toBe(1);
    expect(r.stopped).toContain('tartalék');
  });

  it('429 és API-kvótahiba (200-as törzsben) leállítja a futást', async () => {
    const s1 = emptyState(T0);
    discover(s1, 3);
    const a1 = fakeApi(() => ({ status: 429, json: null }));
    const r1 = await runTracker(s1, { api: a1.api, nowMs: T0, leagueIds: leagues });
    expect(r1.calls).toBe(1);
    expect(r1.stopped).toBe('API 429');

    const s2 = emptyState(T0);
    discover(s2, 3);
    const a2 = fakeApi(() => ({ status: 200, json: { errors: { requests: 'You have reached the request limit for the day' } } }));
    const r2 = await runTracker(s2, { api: a2.api, nowMs: T0, leagueIds: leagues });
    expect(r2.calls).toBe(1);
    expect(r2.stopped).toBe('API kvóta-hiba');
  });

  it('üres szorzó-válasznál nem jelölt és nem ismétel végtelenül (oddsMissing)', async () => {
    const state = emptyState(T0);
    discover(state, 1);
    const api = fakeApi(() => ({ status: 200, json: { response: [], errors: [] } }));
    await runTracker(state, { api: api.api, nowMs: T0, leagueIds: leagues });
    await runTracker(state, { api: api.api, nowMs: T0 + 10 * MIN, leagueIds: leagues });
    const r3 = await runTracker(state, { api: api.api, nowMs: T0 + 20 * MIN, leagueIds: leagues });
    expect(state.fixtures['0'].oddsMissing).toBe(2);
    expect(r3.calls).toBe(0);
    expect(state.fixtures['0'].candidate).toBeUndefined();
  });

  it('hálózati hiba után nem folytatja', async () => {
    const state = emptyState(T0);
    discover(state, 3);
    const r = await runTracker(state, {
      api: async () => {
        throw new Error('ECONNRESET');
      },
      nowMs: T0,
      leagueIds: leagues,
    });
    expect(r.calls).toBe(1);
    expect(r.stopped).toBe('hálózati hiba');
  });
});
