import type { Match } from '../types/football';
import { eventBus } from '../utils/eventBus';
import { checkApiSportsQuota, getApiSportsUsage } from './quotaService';
import { resolveApiSportsFixtureId } from './apiSportsClient';
import { teamNamesMatch } from './oddsApiParsing';
import { evaluateMatchPick } from './bettingProtocol';
import { getMatchKickoffTimestamp } from './predictionAuditService';

/**
 * Meccs-kontextus: hiányzó játékosok és a kezdőfelállás (API-Sports `injuries` és `fixtures/lineups`).
 *
 * Miért: a modell és a piaci ár a hiányzókat és a felállást csak késve vagy egyáltalán nem tükrözi; ugyanakkor az
 * ingyenes csomag napi 100 kérésébe nem fér bele minden meccs. Ezért CSAK a protokoll-tippekhez kér adatot, napi
 * kerettel, és csak ha az API-Sports fiók él és van tartalék kvóta. A jelzés tájékoztató: a modell valószínűségét nem
 * módosítja; a hatás mérésére a protokoll-statisztika később szegmentálható.
 */

export const CONTEXT_CACHE_PREFIX = 'soccerai_context_v1_';
export const CONTEXT_DAILY_BUDGET = 8;
/** Ennyi napi API-Sports kérés alatt nem kérünk meccs-kontextust (a menetrendnek és a szorzóknak van elsőbbsége) */
export const CONTEXT_MIN_REMAINING = 30;
export const INJURIES_TTL_MS = 3 * 60 * 60 * 1000;
export const LINEUPS_TTL_MS = 15 * 60 * 1000;
/** A hiányzókat ettől kezdve kérjük (a kezdés előtt), a felállást a kezdés előtt ~75 perccel */
export const INJURIES_HORIZON_MS = 24 * 60 * 60 * 1000;
export const LINEUPS_HORIZON_MS = 75 * 60 * 1000;
const BUDGET_KEY = 'soccerai_context_budget_v1';

export interface AbsentPlayer {
  name: string;
  /** pl. "Missing Fixture" (biztos kiesés) vagy "Questionable" (kétséges) */
  type: string;
  reason?: string;
}

export interface MatchContext {
  fetchedAt: number;
  injuriesAt?: number;
  lineupsAt?: number;
  homeAbsent: AbsentPlayer[];
  awayAbsent: AbsentPlayer[];
  lineups?: { home?: string; away?: string };
}

interface InjuryItem {
  player?: { name?: string; type?: string; reason?: string };
  team?: { name?: string };
}

interface LineupItem {
  team?: { name?: string };
  formation?: string;
  startXI?: unknown[];
}

/** Az `injuries` válasz szétosztása hazai és vendég hiányzókra (csapatnév alapján); ismeretlen csapatot eldob. */
export function parseInjuries(json: unknown, homeName: string, awayName: string): { home: AbsentPlayer[]; away: AbsentPlayer[] } {
  const items = ((json as { response?: InjuryItem[] } | null)?.response ?? []) as InjuryItem[];
  const home: AbsentPlayer[] = [];
  const away: AbsentPlayer[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    const name = it.player?.name;
    const team = it.team?.name;
    if (!name || !team) continue;
    const key = `${team}|${name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const entry: AbsentPlayer = { name, type: it.player?.type ?? '', reason: it.player?.reason };
    if (teamNamesMatch(team, homeName)) home.push(entry);
    else if (teamNamesMatch(team, awayName)) away.push(entry);
  }
  return { home, away };
}

/** A `fixtures/lineups` válasz: csak a teljes (11 fős) kezdőcsapatot tekintjük megerősített felállásnak. */
export function parseLineups(json: unknown, homeName: string, awayName: string): { home?: string; away?: string } {
  const items = ((json as { response?: LineupItem[] } | null)?.response ?? []) as LineupItem[];
  const out: { home?: string; away?: string } = {};
  for (const it of items) {
    if (!it.team?.name || !Array.isArray(it.startXI) || it.startXI.length < 11) continue;
    const formation = it.formation || 'ismeretlen';
    if (teamNamesMatch(it.team.name, homeName)) out.home = formation;
    else if (teamNamesMatch(it.team.name, awayName)) out.away = formation;
  }
  return out;
}

/** A kezdés előtti kiesők számának összefoglalója a megjelenítéshez: csak a biztos kiesők ("Missing Fixture") számítanak. */
export function countConfirmedAbsent(players: AbsentPlayer[]): number {
  return players.filter((p) => /missing/i.test(p.type)).length;
}

export function getCachedMatchContext(fixtureId: number): MatchContext | null {
  try {
    const raw = localStorage.getItem(`${CONTEXT_CACHE_PREFIX}${fixtureId}`);
    return raw ? (JSON.parse(raw) as MatchContext) : null;
  } catch {
    return null;
  }
}

function saveContext(fixtureId: number, ctx: MatchContext): void {
  try {
    localStorage.setItem(`${CONTEXT_CACHE_PREFIX}${fixtureId}`, JSON.stringify(ctx));
  } catch {
    // Helyhiány: a jelzés nélkül is működik az app
  }
}

function todayStr(nowMs: number): string {
  const d = new Date(nowMs);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getContextBudgetUsed(nowMs: number = Date.now()): number {
  try {
    const raw = localStorage.getItem(BUDGET_KEY);
    const p = raw ? (JSON.parse(raw) as { date?: string; used?: number }) : null;
    return p && p.date === todayStr(nowMs) && typeof p.used === 'number' ? p.used : 0;
  } catch {
    return 0;
  }
}

function addContextBudget(nowMs: number): void {
  try {
    localStorage.setItem(BUDGET_KEY, JSON.stringify({ date: todayStr(nowMs), used: getContextBudgetUsed(nowMs) + 1 }));
  } catch {
    // A futásonkénti korlát így is érvényes
  }
}

export interface ContextTarget {
  match: Match;
  fixtureId: number;
  needInjuries: boolean;
  needLineups: boolean;
}

/** Mely protokoll-tippekhez kell most hiányzó- vagy felállás-lekérés (tiszta; a hálózatot nem érinti). */
export function selectContextTargets(
  matches: Match[],
  nowMs: number,
  deps: { fixtureId: (m: Match) => number | null; cached: (id: number) => MatchContext | null; isProtocol: (m: Match, nowMs: number) => boolean }
): ContextTarget[] {
  const out: ContextTarget[] = [];
  for (const match of matches) {
    if (match.status !== 'UPCOMING' || !match.aiPick) continue;
    const kickoff = getMatchKickoffTimestamp(match);
    if (isNaN(kickoff) || kickoff <= nowMs) continue;
    if (!deps.isProtocol(match, nowMs)) continue;
    const fixtureId = deps.fixtureId(match);
    if (!fixtureId) continue;
    const cached = deps.cached(fixtureId);
    const needInjuries =
      kickoff - nowMs <= INJURIES_HORIZON_MS && (!cached?.injuriesAt || nowMs - cached.injuriesAt >= INJURIES_TTL_MS);
    const needLineups =
      kickoff - nowMs <= LINEUPS_HORIZON_MS && (!cached?.lineupsAt || nowMs - cached.lineupsAt >= LINEUPS_TTL_MS);
    if (needInjuries || needLineups) out.push({ match, fixtureId, needInjuries, needLineups });
  }
  // a hamarabb kezdődő meccs az elsőbbségi (a felállás időkritikus)
  return out.sort((a, b) => getMatchKickoffTimestamp(a.match) - getMatchKickoffTimestamp(b.match));
}

async function getJson(path: string): Promise<unknown | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const json = await res.json();
    const errors = (json as { errors?: unknown } | null)?.errors;
    if (errors && typeof errors === 'object' && Object.values(errors as object).some(Boolean)) return null;
    return json;
  } catch {
    return null;
  }
}

/**
 * Lekéri a hiányzókat és a felállásokat a protokoll-tippekhez, napi kerettel. Csak élő API-Sports fiókkal és tartalék
 * kvótával fut; a hibát csendben kezeli. Visszaadja a frissített meccsek számát.
 */
export async function refreshMatchContext(matches: Match[], nowMs: number = Date.now()): Promise<number> {
  const usage = getApiSportsUsage(nowMs);
  if (usage.issue) return 0;
  const quota = checkApiSportsQuota(nowMs);
  if (quota.isRateLimited || (quota.dailyRemaining !== undefined && quota.dailyRemaining < CONTEXT_MIN_REMAINING)) return 0;

  const targets = selectContextTargets(matches, nowMs, {
    fixtureId: resolveApiSportsFixtureId,
    cached: getCachedMatchContext,
    isProtocol: (m, t) => evaluateMatchPick(m, getMatchKickoffTimestamp(m), t)?.eligible === true,
  });

  let updated = 0;
  for (const t of targets) {
    let ctx = getCachedMatchContext(t.fixtureId) ?? { fetchedAt: nowMs, homeAbsent: [], awayAbsent: [] };
    let changed = false;
    if (t.needInjuries && getContextBudgetUsed(nowMs) < CONTEXT_DAILY_BUDGET) {
      addContextBudget(nowMs);
      const json = await getJson(`/api/apisports?endpoint=injuries&fixture=${t.fixtureId}`);
      if (json) {
        const parsed = parseInjuries(json, t.match.homeTeam.name, t.match.awayTeam.name);
        ctx = { ...ctx, homeAbsent: parsed.home, awayAbsent: parsed.away, injuriesAt: nowMs };
        changed = true;
      }
    }
    if (t.needLineups && getContextBudgetUsed(nowMs) < CONTEXT_DAILY_BUDGET) {
      addContextBudget(nowMs);
      const json = await getJson(`/api/apisports?endpoint=lineups&fixture=${t.fixtureId}`);
      if (json) {
        ctx = { ...ctx, lineups: parseLineups(json, t.match.homeTeam.name, t.match.awayTeam.name), lineupsAt: nowMs };
        changed = true;
      }
    }
    if (changed) {
      ctx.fetchedAt = nowMs;
      saveContext(t.fixtureId, ctx);
      updated++;
    }
  }
  if (updated > 0) eventBus.emit('odds_cache_updated');
  return updated;
}
