import { parseApiSportsBookmakers, type ApiSportsBookmaker } from '../oddsParsing';
import {
  TRACKER_CONFIG,
  applySnapshot,
  budgetUsed,
  consumeBudget,
  finalizeFixtures,
  mergeFixtures,
  planCloseSnapshots,
  planEarlySnapshots,
  planFixtureRefreshes,
  type ApiFixtureLite,
  type OddsRow,
  type SettledRecord,
  type TrackerState,
} from './trackerCore';

/**
 * A követő egy futása: ütemezés -> API-hívások (keretben) -> állapotfrissítés -> lezárt rekordok kivétele.
 * A hálózat injektált (api), így tesztelhető; a fájlkezelés a scripts/tracker/run.ts dolga.
 */

export interface ApiResponse {
  status: number;
  /** A napi hátralévő kérések száma (x-ratelimit-requests-remaining), ha ismert */
  remaining?: number;
  json: unknown;
}

/** Fiókhiba (pl. felfüggesztés) után ennyi ideig nem hív API-t a követő (a hiba nem múlik el 20 percen belül). */
export const ACCOUNT_HALT_MS = 6 * 60 * 60 * 1000;

export interface RunnerDeps {
  api: (path: string) => Promise<ApiResponse>;
  nowMs: number;
  leagueIds: Set<number>;
  budgetCap?: number;
  reserve?: number;
  log?: (message: string) => void;
}

export interface RunResult {
  calls: number;
  settled: SettledRecord[];
  newCandidates: number;
  stopped?: string;
}

interface FixturesJson {
  response?: {
    fixture?: { id?: number; date?: string; timestamp?: number; status?: { short?: string } };
    league?: { id?: number; name?: string };
    teams?: { home?: { name?: string }; away?: { name?: string } };
    goals?: { home?: number | null; away?: number | null };
    score?: { fulltime?: { home?: number | null; away?: number | null } };
  }[];
  errors?: unknown;
}

interface OddsJson {
  response?: { bookmakers?: ApiSportsBookmaker[] }[];
  errors?: unknown;
}

/** Az API-Sports 200-as válaszában is lehet hiba (kvóta, csomag-korlát): a nem üres "errors" jelzi. */
export function apiErrorText(json: unknown): string | null {
  const errors = (json as { errors?: unknown } | null)?.errors;
  if (!errors) return null;
  if (Array.isArray(errors)) return errors.length > 0 ? JSON.stringify(errors) : null;
  if (typeof errors === 'object') return Object.keys(errors as object).length > 0 ? JSON.stringify(errors) : null;
  return String(errors);
}

export function parseFixtures(json: unknown): ApiFixtureLite[] {
  const items = (json as FixturesJson | null)?.response ?? [];
  const out: ApiFixtureLite[] = [];
  for (const it of items) {
    const id = it.fixture?.id;
    const leagueId = it.league?.id;
    if (!id || !leagueId) continue;
    const ts =
      typeof it.fixture?.timestamp === 'number'
        ? it.fixture.timestamp * 1000
        : it.fixture?.date
        ? Date.parse(it.fixture.date)
        : NaN;
    if (isNaN(ts)) continue;
    const ft = it.score?.fulltime;
    const home = typeof ft?.home === 'number' ? ft.home : it.goals?.home;
    const away = typeof ft?.away === 'number' ? ft.away : it.goals?.away;
    out.push({
      id,
      leagueId,
      league: it.league?.name ?? String(leagueId),
      home: it.teams?.home?.name ?? '?',
      away: it.teams?.away?.name ?? '?',
      kickoffTs: ts,
      statusShort: it.fixture?.status?.short ?? 'NS',
      score: typeof home === 'number' && typeof away === 'number' ? { home, away } : undefined,
    });
  }
  return out;
}

/** Az odds-válasz bukmékerei kompakt alakban (home, draw, away, over25, under25); üres, ha nincs használható szorzó. */
export function parseOddsBooks(json: unknown): Record<string, OddsRow> {
  const raw = (json as OddsJson | null)?.response?.[0]?.bookmakers ?? [];
  const parsed = parseApiSportsBookmakers(raw);
  const books: Record<string, OddsRow> = {};
  for (const b of parsed.bookmakers) {
    const has1x2 = b.home && b.draw && b.away;
    const hasOu = b.over25 && b.under25;
    if (!has1x2 && !hasOu) continue;
    books[b.name] = [b.home ?? 0, b.draw ?? 0, b.away ?? 0, b.over25 ?? 0, b.under25 ?? 0];
  }
  return books;
}

export async function runTracker(state: TrackerState, deps: RunnerDeps): Promise<RunResult> {
  const now = deps.nowMs;
  const cap = deps.budgetCap ?? TRACKER_CONFIG.DAILY_BUDGET;
  const reserve = deps.reserve ?? TRACKER_CONFIG.RESERVE;
  const log = deps.log ?? (() => undefined);
  let calls = 0;
  let stopped: string | undefined;
  let newCandidates = 0;

  if (state.haltedUntil && state.haltedUntil > now) {
    log(`Szünet fiókhiba miatt ${new Date(state.haltedUntil).toISOString()}-ig.`);
    return { calls: 0, settled: [], newCandidates: 0, stopped: 'API fiókhiba (szünet)' };
  }

  const canCall = () => !stopped && budgetUsed(state, now) < cap;

  async function call(path: string): Promise<ApiResponse | null> {
    consumeBudget(state, now);
    calls++;
    let res: ApiResponse;
    try {
      res = await deps.api(path);
    } catch (e) {
      log(`hálózati hiba (${path}): ${e instanceof Error ? e.message : String(e)}`);
      stopped = 'hálózati hiba';
      return null;
    }
    if (res.status === 429) {
      stopped = 'API 429';
      return null;
    }
    if (res.status < 200 || res.status >= 300) {
      log(`HTTP ${res.status} (${path})`);
      return null;
    }
    if (res.remaining !== undefined && res.remaining < reserve) {
      stopped = `napi kvóta tartalék (${res.remaining} maradt)`;
    }
    const err = apiErrorText(res.json);
    if (err) {
      log(`API hiba (${path}): ${err}`);
      if (/rate|limit|request|quota/i.test(err)) stopped = 'API kvóta-hiba';
      // Fiókhiba (felfüggesztés, érvénytelen kulcs): a további hívás értelmetlen és a kvótát is terhelheti
      if (/suspend|access|token|key|account/i.test(err)) {
        stopped = 'API fiókhiba';
        state.haltedUntil = now + ACCOUNT_HALT_MS;
      }
      return null;
    }
    return res;
  }

  async function snapshot(fixtureId: number, kind: 'early' | 'close'): Promise<void> {
    const f = state.fixtures[String(fixtureId)];
    if (!f) return;
    const res = await call(`/odds?fixture=${fixtureId}`);
    if (!res) return;
    const books = parseOddsBooks(res.json);
    if (Object.keys(books).length === 0) {
      f.oddsMissing = (f.oddsMissing ?? 0) + 1;
      log(`nincs szorzó: ${f.home} - ${f.away}`);
      return;
    }
    const hadCandidate = Boolean(f.candidate);
    applySnapshot(f, { ts: now, kind, books });
    if (!hadCandidate && f.candidate) {
      newCandidates++;
      log(`jelölt: ${f.home} - ${f.away} ${f.candidate.market} @${f.candidate.odds} (${f.candidate.bookmaker}, +${f.candidate.edgePct}%)`);
    }
  }

  // A: záró pillanatképek (időkritikusak, ezek mennek előre)
  for (const id of planCloseSnapshots(state, now)) {
    if (!canCall()) break;
    await snapshot(id, 'close');
  }

  // B: meccslisták (elszámolás és felfedezés)
  for (const date of planFixtureRefreshes(state, now)) {
    if (!canCall()) break;
    const res = await call(`/fixtures?date=${date}`);
    // hibánál is rögzítjük a kísérletet, hogy ne ismételje percenként ugyanazt
    state.fixtureRefresh[date] = now;
    if (!res) continue;
    const { added, updated } = mergeFixtures(state, parseFixtures(res.json), deps.leagueIds);
    log(`meccslista ${date}: +${added} új, ${updated} frissítve`);
  }

  // C: korai pillanatképek (a felfedezés után)
  for (const id of planEarlySnapshots(state, now)) {
    if (!canCall()) break;
    await snapshot(id, 'early');
  }

  const settled = finalizeFixtures(state, now);
  state.updatedAt = new Date(now).toISOString();
  return { calls, settled, newCandidates, stopped };
}
