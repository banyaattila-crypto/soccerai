import type { Match, PredictionAuditRecord } from '../types/football';
import {
  fetchFixtureOdds,
  getCachedFixtureOdds,
  resolveApiSportsFixtureId,
  ODDS_CACHE_TTL_MS,
} from './apiSportsClient';
import { checkApiSportsQuota } from './quotaService';
import { getMatchKickoffTimestamp } from './predictionAuditService';

/**
 * Valós szorzók előzetes és záró lekérése a legerősebb tippekhez.
 *
 * Miért: a tippeket csak akkor tudjuk piaci áron naplózni és CLV-vel mérni, ha a kezdés előtt van valós szorzó.
 * Eddig a szorzót csak a meccs részleteinek megnyitásakor kértük le, így a naplózott tippek szinte mind szimulált
 * áron készültek, és nem volt mit mérni. Az API-Sports napi 100 kérése miatt a lekérések napi keretben és
 * futásonként korlátozva történnek.
 */

export const ODDS_TRACKING_DAILY_BUDGET = 15;
export const PREFETCH_MAX_PER_RUN = 6;
export const CLOSING_REFRESH_MAX_PER_RUN = 4;
/** Ennyivel a kezdés előtt (előre) érdemes először lekérni a szorzót */
export const PREFETCH_HORIZON_MS = 30 * 60 * 60 * 1000;
/** A záró frissítés ablaka a kezdés előtt */
export const CLOSING_WINDOW_MIN_MS = 10 * 60 * 1000;
export const CLOSING_WINDOW_MAX_MS = 110 * 60 * 1000;
/** A záró frissítés csak akkor kér újat, ha a gyorsítótárazott szorzó legalább ennyi idős */
export const CLOSING_MIN_AGE_MS = 25 * 60 * 1000;
/** Ennyi napi API-Sports kérést hagyunk tartalékban a menetrendnek */
export const API_DAILY_RESERVE = 15;

const BUDGET_KEY = 'soccerai_odds_tracking_budget_v1';

export interface TargetDeps {
  fixtureId: (match: Match) => number | null;
  /** A gyorsítótárazott szorzó kora ms-ban; null, ha nincs gyorsítótár */
  cachedAgeMs: (fixtureId: number, nowMs: number) => number | null;
}

export interface OddsTarget {
  match: Match;
  fixtureId: number;
}

/** Előzetes lekérés jelöltjei: kezdés előtti, tippel rendelkező meccsek, amelyekhez nincs friss szorzó. */
export function selectPrefetchTargets(
  matches: Match[],
  nowMs: number,
  deps: TargetDeps,
  max: number = PREFETCH_MAX_PER_RUN
): OddsTarget[] {
  const out: (OddsTarget & { top: boolean; prob: number })[] = [];
  for (const match of matches) {
    if (match.status !== 'UPCOMING' || !match.aiPick) continue;
    const kickoff = getMatchKickoffTimestamp(match);
    if (isNaN(kickoff) || kickoff <= nowMs + CLOSING_WINDOW_MIN_MS || kickoff > nowMs + PREFETCH_HORIZON_MS) continue;
    const fixtureId = deps.fixtureId(match);
    if (!fixtureId) continue;
    const age = deps.cachedAgeMs(fixtureId, nowMs);
    if (age !== null && age < ODDS_CACHE_TTL_MS) continue; // friss szorzó már van
    out.push({ match, fixtureId, top: Boolean(match.aiPick.isTopPick), prob: match.aiPick.probability });
  }
  out.sort((a, b) => Number(b.top) - Number(a.top) || b.prob - a.prob);
  return out.slice(0, max).map(({ match, fixtureId }) => ({ match, fixtureId }));
}

/** Záró frissítés jelöltjei: valós szorzón naplózott, még le nem zárt tippek a kezdés előtti ablakban. */
export function selectClosingTargets(
  records: PredictionAuditRecord[],
  matches: Match[],
  nowMs: number,
  deps: TargetDeps,
  max: number = CLOSING_REFRESH_MAX_PER_RUN
): OddsTarget[] {
  const byId = new Map(matches.map((m) => [m.id, m]));
  const due = records
    .filter(
      (r) =>
        !r.settled &&
        r.pick.isSimulatedOdds === false &&
        r.marketAtLog &&
        r.kickoffTimestamp - nowMs >= CLOSING_WINDOW_MIN_MS &&
        r.kickoffTimestamp - nowMs <= CLOSING_WINDOW_MAX_MS
    )
    .sort((a, b) => a.kickoffTimestamp - b.kickoffTimestamp);
  const out: OddsTarget[] = [];
  for (const r of due) {
    const match = byId.get(r.matchId);
    if (!match) continue;
    const fixtureId = deps.fixtureId(match);
    if (!fixtureId) continue;
    const age = deps.cachedAgeMs(fixtureId, nowMs);
    if (age !== null && age < CLOSING_MIN_AGE_MS) continue;
    out.push({ match, fixtureId });
    if (out.length >= max) break;
  }
  return out;
}

function todayStr(nowMs: number): string {
  const d = new Date(nowMs);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getBudgetUsed(nowMs: number = Date.now()): number {
  try {
    const raw = localStorage.getItem(BUDGET_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { date?: string; used?: number };
    return parsed.date === todayStr(nowMs) && typeof parsed.used === 'number' ? parsed.used : 0;
  } catch {
    return 0;
  }
}

function addBudgetUsed(n: number, nowMs: number): void {
  try {
    localStorage.setItem(BUDGET_KEY, JSON.stringify({ date: todayStr(nowMs), used: getBudgetUsed(nowMs) + n }));
  } catch {
    // A localStorage nem írható: a napi keret nem tartós, a futásonkénti korlát így is érvényes
  }
}

const defaultDeps: TargetDeps = {
  fixtureId: resolveApiSportsFixtureId,
  cachedAgeMs: (fixtureId, nowMs) => {
    const cached = getCachedFixtureOdds(fixtureId, nowMs);
    if (!cached?.expiresAt) return cached ? ODDS_CACHE_TTL_MS : null;
    const expires = Date.parse(cached.expiresAt);
    return isNaN(expires) ? ODDS_CACHE_TTL_MS : nowMs - (expires - ODDS_CACHE_TTL_MS);
  },
};

export interface RefreshOptions {
  nowMs?: number;
  deps?: TargetDeps;
  fetchOdds?: (fixtureId: number, force: boolean) => Promise<unknown>;
  /** Az API-Sports napi kvótaállapota (tesztelhetőség); alapértelmezés: a kvóta-szolgáltatás */
  quota?: { isRateLimited: boolean; dailyRemaining?: number };
}

/**
 * Lekéri a hiányzó (előzetes) és a kezdés közeli (záró) valós szorzókat a napi keret és a futásonkénti korlát
 * szerint. Visszaadja a ténylegesen lekért szorzók számát; a hívó ennyi alapján csatolja újra a gyorsítótárat.
 */
export async function refreshOddsForTracking(
  matches: Match[],
  records: PredictionAuditRecord[],
  options: RefreshOptions = {}
): Promise<{ fetched: number; reason?: string }> {
  const nowMs = options.nowMs ?? Date.now();
  const deps = options.deps ?? defaultDeps;
  const quota = options.quota ?? checkApiSportsQuota(nowMs);
  if (quota.isRateLimited) return { fetched: 0, reason: 'kvótapihenő' };
  if (quota.dailyRemaining !== undefined && quota.dailyRemaining < API_DAILY_RESERVE) {
    return { fetched: 0, reason: 'napi kvóta tartalék' };
  }
  let budget = ODDS_TRACKING_DAILY_BUDGET - getBudgetUsed(nowMs);
  if (budget <= 0) return { fetched: 0, reason: 'napi keret elfogyott' };

  const closing = selectClosingTargets(records, matches, nowMs, deps);
  const closingIds = new Set(closing.map((t) => t.fixtureId));
  const prefetch = selectPrefetchTargets(matches, nowMs, deps).filter((t) => !closingIds.has(t.fixtureId));
  const plan: { target: OddsTarget; force: boolean }[] = [
    ...closing.map((target) => ({ target, force: true })),
    ...prefetch.map((target) => ({ target, force: false })),
  ];

  const doFetch = options.fetchOdds ?? ((id: number, force: boolean) => fetchFixtureOdds(id, undefined, force));
  let fetched = 0;
  for (const { target, force } of plan) {
    if (budget <= 0) break;
    budget--;
    addBudgetUsed(1, nowMs);
    try {
      const res = await doFetch(target.fixtureId, force);
      if (res) fetched++;
    } catch {
      // Egy meccs hibája nem akadályozza a többit; a következő futás újrapróbálja
    }
  }
  return { fetched };
}
