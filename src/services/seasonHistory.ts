/**
 * Szezon-előzmény lekérése a Dixon–Coles illesztéshez.
 *
 * Az illesztéshez csapatonként legalább néhány tucat meccs kell. A korábbi, "tegnap–+2 nap" ablak
 * ligánként 0–10 mérkőzést adott, ami az auditban rosszabb esélyeket eredményezett, mint a ligaátlag.
 * Itt a teljes aktuális szezon (és ha kevés, az előző szezon) lejátszott meccseit kérjük le
 * ligánként a /api/matches?competition=XX&status=FINISHED&season=YYYY végponton (24 órás edge-cache),
 * a 10 kérés/perc korlát betartásával.
 */

import {
  FinishedMatchResult,
  FittedDixonColesModel,
  fitDixonColesModel,
  loadLeagueModel,
  saveLeagueModel,
} from './dixonColesFitting';
import { checkFootballDataQuota, recordFootballDataCall } from './quotaService';

/** Ennyi meccs alatt nem illesztünk modellt: a ligaátlag a jobb becslés (lásd audit-szimuláció). */
export const MIN_FIT_MATCHES = 60;
/** Ha az aktuális szezonból ennyi alatt van, az előző szezont is lekérjük. */
export const TARGET_HISTORY_MATCHES = 180;

export interface FootballDataScore {
  duration?: string;
  fullTime?: { home: number | null; away: number | null };
  regularTime?: { home: number | null; away: number | null };
}

export interface FootballDataHistoryMatch {
  utcDate: string;
  status: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  score?: FootballDataScore;
}

/**
 * A szezon kezdőéve a football-data `season` paraméteréhez.
 * Európai szezon: július után kezdődik; a brazil bajnokság naptári évet követ.
 */
export function getSeasonStartYear(code: string, now: Date = new Date()): number {
  const year = now.getFullYear();
  if (code === 'BSA') return year;
  return now.getMonth() >= 6 ? year : year - 1;
}

/**
 * 90 perces (rendes játékidős) gólok. A fogadási piacok (1X2, BTTS, Over/Under) a rendes játékidőre
 * szólnak, a `fullTime` viszont hosszabbításnál/tizenegyeseknél nem az. [A mezőt élő API-n ellenőrizni kell.]
 */
export function getRegularTimeGoals(
  score: FootballDataScore | undefined
): { home: number; away: number } | null {
  if (!score) return null;
  const reg = score.regularTime;
  if (
    score.duration &&
    score.duration !== 'REGULAR' &&
    reg &&
    typeof reg.home === 'number' &&
    typeof reg.away === 'number'
  ) {
    return { home: reg.home, away: reg.away };
  }
  const ft = score.fullTime;
  if (ft && typeof ft.home === 'number' && typeof ft.away === 'number') {
    return { home: ft.home, away: ft.away };
  }
  return null;
}

export function toFinishedResults(matches: FootballDataHistoryMatch[]): FinishedMatchResult[] {
  const out: FinishedMatchResult[] = [];
  for (const m of matches) {
    if (m.status !== 'FINISHED') continue;
    const goals = getRegularTimeGoals(m.score);
    if (!goals) continue;
    out.push({
      homeTeam: m.homeTeam.name,
      awayTeam: m.awayTeam.name,
      homeGoals: goals.home,
      awayGoals: goals.away,
      date: m.utcDate ? m.utcDate.split('T')[0] : undefined,
    });
  }
  return out;
}

async function fetchSeason(
  code: string,
  season: number,
  apiKey: string
): Promise<FootballDataHistoryMatch[] | null> {
  const proxyUrl = `/api/matches?competition=${encodeURIComponent(code)}&status=FINISHED&season=${season}`;
  const endpoints = [proxyUrl];
  if (apiKey.trim()) {
    endpoints.push(
      `https://api.football-data.org/v4/competitions/${encodeURIComponent(code)}/matches?status=FINISHED&season=${season}`
    );
  }

  for (const url of endpoints) {
    if (checkFootballDataQuota().isRateLimited) return null;
    try {
      const headers: Record<string, string> = {};
      if (apiKey.trim()) headers['X-Auth-Token'] = apiKey.trim();
      const res = await fetch(url, { headers });
      recordFootballDataCall(res.status, res.headers);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.matches)) return data.matches as FootballDataHistoryMatch[];
      }
    } catch {
      // hálózati hiba: próbáljuk a következő végpontot
    }
  }
  return null;
}

export interface CompetitionHistory {
  results: FinishedMatchResult[];
  /** true, ha a kvóta vagy hiba miatt nem sikerült minden szükséges szezont lekérni */
  partial: boolean;
}

/**
 * Egy bajnokság lejátszott meccsei: aktuális szezon, és ha kevés, az előző is.
 * Üres eredmény esetén a hívó ligaátlag-becslésre esik vissza.
 */
export async function fetchCompetitionHistory(
  code: string,
  apiKey: string = '',
  now: Date = new Date()
): Promise<CompetitionHistory> {
  const current = getSeasonStartYear(code, now);
  let results: FinishedMatchResult[] = [];
  let partial = false;

  const cur = await fetchSeason(code, current, apiKey);
  if (cur) results = results.concat(toFinishedResults(cur));
  else partial = true;

  if (results.length < TARGET_HISTORY_MATCHES && !partial) {
    const prev = await fetchSeason(code, current - 1, apiKey);
    if (prev) results = results.concat(toFinishedResults(prev));
    else partial = true;
  }

  return { results, partial };
}

// ---------------------------------------------------------------------------
// Modell-előkészítés ligánként (cache + hibacache + időkeret)
// ---------------------------------------------------------------------------

const FAIL_PREFIX = 'soccerai_dc_history_fail_v1_';
const FAIL_TTL_MS = 6 * 60 * 60 * 1000;

function isFailureCached(code: string, nowMs: number): boolean {
  try {
    const raw = localStorage.getItem(`${FAIL_PREFIX}${code}`);
    return raw !== null && nowMs - Number(raw) < FAIL_TTL_MS;
  } catch {
    return false;
  }
}

function cacheFailure(code: string, nowMs: number): void {
  try {
    localStorage.setItem(`${FAIL_PREFIX}${code}`, String(nowMs));
  } catch {
    // tárolási hiba esetén csendben továbblépünk
  }
}

/**
 * Biztosítja, hogy a megadott bajnokságokhoz legyen szezon-alapú Dixon–Coles modell.
 * - A 24 órán belül illesztett modellt újrahasznosítja (0 API-hívás).
 * - Sorban, a kvótát és az időkeretet (budgetMs) betartva tölt le; ami nem fér bele, a következő frissítéskor készül el.
 * - Az érdemi mintát nem adó ligákat (pl. nem elérhető az ingyenes csomagban) 6 órára hibacache-eli.
 */
export async function ensureLeagueModels(
  codes: string[],
  apiKey: string = '',
  budgetMs: number = 15000
): Promise<Record<string, FittedDixonColesModel | null>> {
  const started = Date.now();
  const models: Record<string, FittedDixonColesModel | null> = {};

  for (const code of codes) {
    const cached = loadLeagueModel(code);
    if (cached && cached.sampleSize >= MIN_FIT_MATCHES) {
      models[code] = cached;
      continue;
    }
    models[code] = null;

    if (isFailureCached(code, started)) continue;
    if (Date.now() - started > budgetMs) continue;
    if (checkFootballDataQuota().isRateLimited) continue;

    const { results, partial } = await fetchCompetitionHistory(code, apiKey);
    if (results.length >= MIN_FIT_MATCHES) {
      const fitted = fitDixonColesModel(results, code);
      saveLeagueModel(fitted);
      models[code] = fitted;
    } else if (!partial || !checkFootballDataQuota().isRateLimited) {
      // Nem kvóta-probléma: a liga nem ad elég mintát (vagy nem elérhető), ne próbálkozzunk újra azonnal
      cacheFailure(code, Date.now());
    }
  }

  return models;
}
