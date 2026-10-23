import type { FixtureRealOdds, Match } from '../types/football';
import { getMatchKickoffTimestamp } from './predictionAuditService';
import {
  findOddsApiEvent,
  parseOddsApiEvent,
  type OddsApiEvent,
  type ParsedOddsApiEvent,
} from './oddsApiParsing';

/**
 * The Odds API (ingyenes csomag: 500 kredit / hónap). Második, az API-Sports-tól független szorzóforrás.
 * Egy liga lekérése 2 kredit (h2h + totals), ezért napi keretet és hosszú (3 órás) gyorsítótárat használunk:
 * 5 liga / nap * 2 kredit * 30 nap = 300 kredit, a maradék 200 a tartalék (több eszköz, kézi frissítés). A szerveroldali proxy (api/oddsapi.ts) rejti az élő kulcsot.
 */

export const ODDS_API_CACHE_PREFIX = 'soccerai_oddsapi_v1_';
export const ODDS_API_TTL_MS = 3 * 60 * 60 * 1000;
export const ODDS_API_DAILY_LEAGUE_BUDGET = 5;
/** Az ingyenes csomag havi kerete (kredit) */
export const ODDS_API_MONTHLY_CREDITS = 500;
/** Ennyi hátralévő kredit alatt már nem kérünk le újat (hónap végi tartalék) */
export const ODDS_API_MIN_REMAINING = 30;
const BUDGET_KEY = 'soccerai_oddsapi_budget_v1';
const REMAINING_KEY = 'soccerai_oddsapi_remaining_v1';
const LEDGER_KEY = 'soccerai_oddsapi_ledger_v1';
const LEDGER_MAX = 120;
const HORIZON_MS = 48 * 60 * 60 * 1000;

/** Belső liga-azonosító -> The Odds API sportkulcs (csak a ténylegesen kínált ligák). */
export const ODDS_API_SPORT_KEYS: Record<string, string> = {
  pl: 'soccer_epl',
  championship: 'soccer_efl_champ',
  laliga: 'soccer_spain_la_liga',
  laliga2: 'soccer_spain_segunda_division',
  seriea: 'soccer_italy_serie_a',
  serieb: 'soccer_italy_serie_b',
  bundesliga: 'soccer_germany_bundesliga',
  bundesliga2: 'soccer_germany_bundesliga2',
  ligue1: 'soccer_france_ligue_one',
  ligue2: 'soccer_france_ligue_two',
  eredivisie: 'soccer_netherlands_eredivisie',
  primeira_liga: 'soccer_portugal_primeira_liga',
  jupiler: 'soccer_belgium_first_div',
  superlig: 'soccer_turkey_super_league',
  austria_bundesliga: 'soccer_austria_bundesliga',
  swiss_superleague: 'soccer_switzerland_superleague',
  scot_prem: 'soccer_spl',
  ekstraklasa: 'soccer_poland_ekstraklasa',
  superleague_greece: 'soccer_greece_super_league',
  eliteserien: 'soccer_norway_eliteserien',
  allsvenskan: 'soccer_sweden_allsvenskan',
  superliga_dk: 'soccer_denmark_superliga',
  veikkausliiga: 'soccer_finland_veikkausliiga',
  ireland_premier: 'soccer_league_of_ireland',
  j1: 'soccer_japan_j_league',
  liga_mx: 'soccer_mexico_ligamx',
  mls: 'soccer_usa_mls',
  ucl: 'soccer_uefa_champs_league',
  uel: 'soccer_uefa_europa_league',
};

interface CachedLeague {
  timestamp: number;
  events: ParsedOddsApiEvent[];
}

function todayStr(nowMs: number): string {
  const d = new Date(nowMs);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function readCache(sportKey: string): CachedLeague | null {
  try {
    const raw = localStorage.getItem(`${ODDS_API_CACHE_PREFIX}${sportKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedLeague;
    return Array.isArray(parsed.events) && typeof parsed.timestamp === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

export function getOddsApiBudgetUsed(nowMs: number = Date.now()): number {
  try {
    const raw = localStorage.getItem(BUDGET_KEY);
    if (!raw) return 0;
    const p = JSON.parse(raw) as { date?: string; used?: number };
    return p.date === todayStr(nowMs) && typeof p.used === 'number' ? p.used : 0;
  } catch {
    return 0;
  }
}

function addBudgetUsed(nowMs: number): void {
  try {
    localStorage.setItem(BUDGET_KEY, JSON.stringify({ date: todayStr(nowMs), used: getOddsApiBudgetUsed(nowMs) + 1 }));
  } catch {
    // A localStorage nem írható: a futásonkénti korlát így is érvényes
  }
}

export interface OddsApiLedgerEntry {
  /** A lekérés ideje (epoch ms) */
  t: number;
  sport: string;
  /** A szolgáltató által a válaszban jelzett hátralévő és eddig felhasznált kredit */
  remaining?: number;
  used?: number;
}

/** A The Odds API lekérések naplója (a legutóbbi LEDGER_MAX bejegyzés), a keret követéséhez. */
export function getOddsApiLedger(): OddsApiLedgerEntry[] {
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    const parsed = raw ? (JSON.parse(raw) as OddsApiLedgerEntry[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function appendLedger(entry: OddsApiLedgerEntry): void {
  try {
    localStorage.setItem(LEDGER_KEY, JSON.stringify([...getOddsApiLedger(), entry].slice(-LEDGER_MAX)));
  } catch {
    // A napló nem írható: a keretvédelem a fejléces hátralévő értékre és a napi keretre így is támaszkodik
  }
}

export interface OddsApiUsage {
  limit: number;
  /** A szolgáltató szerint hátralévő kredit; null, ha még nem mértük */
  remaining: number | null;
  /** A szolgáltató szerint felhasznált kredit (a fiók összes használatából, a trackerrel és más eszközökkel együtt) */
  used: number | null;
  /** Ezen az eszközön a mai lekérések (liga) száma és a napi keret */
  fetchesToday: number;
  dailyBudget: number;
  lastFetchAt: number | null;
}

export function getOddsApiUsage(nowMs: number = Date.now()): OddsApiUsage {
  const ledger = getOddsApiLedger();
  const last = ledger[ledger.length - 1];
  const remaining = getOddsApiRemainingCredits();
  const used = last?.used ?? (remaining !== null ? ODDS_API_MONTHLY_CREDITS - remaining : null);
  return {
    limit: ODDS_API_MONTHLY_CREDITS,
    remaining,
    used,
    fetchesToday: getOddsApiBudgetUsed(nowMs),
    dailyBudget: ODDS_API_DAILY_LEAGUE_BUDGET,
    lastFetchAt: last?.t ?? null,
  };
}

/** A szolgáltatótól fejlécben kapott hátralévő havi kredit (ha már mértük). */
export function getOddsApiRemainingCredits(): number | null {
  try {
    const v = localStorage.getItem(REMAINING_KEY);
    return v === null ? null : Number(v);
  } catch {
    return null;
  }
}

/** A meccshez tartozó, gyorsítótárazott The Odds API szorzó (0 hívás). */
export function getOddsApiOdds(match: Match, nowMs: number = Date.now()): FixtureRealOdds | null {
  const sportKey = ODDS_API_SPORT_KEYS[match.leagueId];
  if (!sportKey) return null;
  const cached = readCache(sportKey);
  if (!cached) return null;
  const kickoff = getMatchKickoffTimestamp(match);
  if (isNaN(kickoff)) return null;
  const ev = findOddsApiEvent(cached.events, match.homeTeam.name, match.awayTeam.name, kickoff);
  if (!ev) return null;
  const age = nowMs - cached.timestamp;
  return {
    fixtureId: 0,
    updatedAt: new Date(cached.timestamp).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }),
    expiresAt: new Date(cached.timestamp + ODDS_API_TTL_MS).toISOString(),
    ttlMinutes: Math.max(0, Math.floor((ODDS_API_TTL_MS - age) / 60000)),
    isExpired: age >= ODDS_API_TTL_MS,
    bookmakers: ev.bookmakers,
    pinnacle: ev.pinnacle,
    bet365: ev.bet365,
    bestOdds: ev.bestOdds,
  };
}

/** Lekéri egy liga szorzóit a proxyn át és gyorsítótárba menti. Hiba esetén null. */
export async function fetchOddsApiLeague(sportKey: string, nowMs: number = Date.now()): Promise<CachedLeague | null> {
  try {
    const res = await fetch(`/api/oddsapi?sport=${encodeURIComponent(sportKey)}`);
    const remaining = res.headers?.get?.('x-requests-remaining');
    const usedHeader = res.headers?.get?.('x-requests-used');
    const remainingNum = remaining ? Number(remaining) : undefined;
    const usedNum = usedHeader ? Number(usedHeader) : undefined;
    if (remainingNum !== undefined && isFinite(remainingNum)) {
      try {
        localStorage.setItem(REMAINING_KEY, String(remainingNum));
      } catch {
        // nem írható: a kijelzés nélkül is működik
      }
    }
    appendLedger({
      t: nowMs,
      sport: sportKey,
      remaining: remainingNum !== undefined && isFinite(remainingNum) ? remainingNum : undefined,
      used: usedNum !== undefined && isFinite(usedNum) ? usedNum : undefined,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as OddsApiEvent[];
    if (!Array.isArray(data)) return null;
    const entry: CachedLeague = { timestamp: nowMs, events: data.map(parseOddsApiEvent) };
    try {
      localStorage.setItem(`${ODDS_API_CACHE_PREFIX}${sportKey}`, JSON.stringify(entry));
    } catch {
      // helyhiány: a memóriabeli eredménnyel dolgozunk tovább
    }
    return entry;
  } catch {
    return null;
  }
}

/** Azok a ligák, amelyeknek van a következő 48 órában kezdődő meccsük és friss szorzó hiányzik, súly szerint. */
export function selectOddsApiLeagues(matches: Match[], nowMs: number, isFresh: (sportKey: string) => boolean): string[] {
  const weights = new Map<string, number>();
  for (const m of matches) {
    const sportKey = ODDS_API_SPORT_KEYS[m.leagueId];
    if (!sportKey || m.status !== 'UPCOMING') continue;
    const kickoff = getMatchKickoffTimestamp(m);
    if (isNaN(kickoff) || kickoff <= nowMs || kickoff > nowMs + HORIZON_MS) continue;
    weights.set(sportKey, (weights.get(sportKey) ?? 0) + (m.aiPick?.isTopPick ? 3 : 1));
  }
  return [...weights.entries()]
    .filter(([key]) => !isFresh(key))
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);
}

/** Napi keretből frissíti a hiányzó ligák szorzóit. Visszaadja a ténylegesen lekért ligák számát. */
export async function refreshOddsApi(matches: Match[], nowMs: number = Date.now()): Promise<number> {
  const remaining = getOddsApiRemainingCredits();
  if (remaining !== null && remaining < ODDS_API_MIN_REMAINING) return 0;
  let budget = ODDS_API_DAILY_LEAGUE_BUDGET - getOddsApiBudgetUsed(nowMs);
  if (budget <= 0) return 0;
  const todo = selectOddsApiLeagues(matches, nowMs, (key) => {
    const c = readCache(key);
    return !!c && nowMs - c.timestamp < ODDS_API_TTL_MS;
  });
  let fetched = 0;
  for (const key of todo) {
    if (budget <= 0) break;
    budget--;
    addBudgetUsed(nowMs);
    if (await fetchOddsApiLeague(key, nowMs)) fetched++;
  }
  return fetched;
}
