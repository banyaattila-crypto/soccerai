import {
  Match,
  MatchStatus,
  FixtureRealOdds,
  BookmakerOddsItem,
} from '../types/football';
import {
  calculateMarketProbabilities,
  buildMatchQuantAndPick,
} from './predictionEngine';
import { formatLocalDate, parseIsoToLocalDateAndTime } from '../utils/dateUtils';
import {
  computeExpectedGoalsFromModel,
  loadLeagueModel,
  saveLeagueModel,
  fitDixonColesModel,
  FinishedMatchResult,
} from './dixonColesFitting';

export const API_SPORTS_DEFAULT_KEY = '';
const CACHE_KEY = 'soccerai_apisports_fixtures_cache_v2';
const FIXTURE_LOOKUP_KEY = 'soccerai_fixture_lookup_v1';
const ODDS_CACHE_PREFIX = 'soccerai_odds_cache_';
export const CACHE_TTL_MS = 45 * 60 * 1000; // 45 perces intelligens gyorsítótár
export const ODDS_CACHE_TTL_MS = 60 * 60 * 1000; // 60 perces odds gyorsítótár

export interface ApiSportsLeagueConfig {
  id: number;
  internalId: string;
  name: string;
  country: string;
  flag: string;
  priority: number;
  avgHomeGoals: number;
  avgAwayGoals: number;
}

// Bajnokság-specifikus valós történelmi gólátlagok (a charCodeAt heurisztika helyett)
export const SUPPORTED_SECONDARY_LEAGUES: Record<number, ApiSportsLeagueConfig> = {
  // Nemzetközi Kupák (UEFA)
  2: {
    id: 2,
    internalId: 'ucl',
    name: 'Bajnokok Ligája',
    country: 'Európa',
    flag: '⭐',
    priority: 5,
    avgHomeGoals: 1.74,
    avgAwayGoals: 1.34,
  },
  3: {
    id: 3,
    internalId: 'uel',
    name: 'Európa Liga',
    country: 'Európa',
    flag: '🏆',
    priority: 6,
    avgHomeGoals: 1.66,
    avgAwayGoals: 1.30,
  },
  848: {
    id: 848,
    internalId: 'uecl',
    name: 'Konferencia Liga',
    country: 'Európa',
    flag: '🟢',
    priority: 7,
    avgHomeGoals: 1.62,
    avgAwayGoals: 1.26,
  },

  // Első osztályok & nemzetközi ligák
  94: {
    id: 94,
    internalId: 'primeira_liga',
    name: 'Primeira Liga',
    country: 'Portugália',
    flag: '🇵🇹',
    priority: 8,
    avgHomeGoals: 1.48,
    avgAwayGoals: 1.14,
  },
  271: {
    id: 271,
    internalId: 'nbi',
    name: 'NB I (OTP Bank Liga)',
    country: 'Magyarország',
    flag: '🇭🇺',
    priority: 9,
    avgHomeGoals: 1.54,
    avgAwayGoals: 1.24,
  },
  144: {
    id: 144,
    internalId: 'jupiler',
    name: 'Jupiler Pro League',
    country: 'Belgium',
    flag: '🇧🇪',
    priority: 13,
    avgHomeGoals: 1.62,
    avgAwayGoals: 1.32,
  },
  203: {
    id: 203,
    internalId: 'superlig',
    name: 'Süper Lig',
    country: 'Törökország',
    flag: '🇹🇷',
    priority: 14,
    avgHomeGoals: 1.58,
    avgAwayGoals: 1.22,
  },
  218: {
    id: 218,
    internalId: 'austria_bundesliga',
    name: 'Tipico Bundesliga',
    country: 'Ausztria',
    flag: '🇦🇹',
    priority: 15,
    avgHomeGoals: 1.56,
    avgAwayGoals: 1.30,
  },
  207: {
    id: 207,
    internalId: 'swiss_superleague',
    name: 'Super League',
    country: 'Svájc',
    flag: '🇨🇭',
    priority: 16,
    avgHomeGoals: 1.65,
    avgAwayGoals: 1.35,
  },
  179: {
    id: 179,
    internalId: 'scot_prem',
    name: 'Scottish Premiership',
    country: 'Skócia',
    flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    priority: 17,
    avgHomeGoals: 1.52,
    avgAwayGoals: 1.18,
  },
  106: {
    id: 106,
    internalId: 'ekstraklasa',
    name: 'Ekstraklasa',
    country: 'Lengyelország',
    flag: '🇵🇱',
    priority: 18,
    avgHomeGoals: 1.44,
    avgAwayGoals: 1.16,
  },
  197: {
    id: 197,
    internalId: 'superleague_greece',
    name: 'Super League 1',
    country: 'Görögország',
    flag: '🇬🇷',
    priority: 19,
    avgHomeGoals: 1.40,
    avgAwayGoals: 1.05,
  },
  253: {
    id: 253,
    internalId: 'mls',
    name: 'Major League Soccer (MLS)',
    country: 'USA',
    flag: '🇺🇸',
    priority: 20,
    avgHomeGoals: 1.66,
    avgAwayGoals: 1.28,
  },

  // Másodosztályok
  141: {
    id: 141,
    internalId: 'laliga2',
    name: 'LaLiga 2',
    country: 'Spanyolország',
    flag: '🇪🇸',
    priority: 21,
    avgHomeGoals: 1.32,
    avgAwayGoals: 0.96,
  },
  136: {
    id: 136,
    internalId: 'serieb',
    name: 'Serie B',
    country: 'Olaszország',
    flag: '🇮🇹',
    priority: 22,
    avgHomeGoals: 1.36,
    avgAwayGoals: 1.06,
  },
  79: {
    id: 79,
    internalId: 'bundesliga2',
    name: '2. Bundesliga',
    country: 'Németország',
    flag: '🇩🇪',
    priority: 23,
    avgHomeGoals: 1.68,
    avgAwayGoals: 1.38,
  },
  62: {
    id: 62,
    internalId: 'ligue2',
    name: 'Ligue 2',
    country: 'Franciaország',
    flag: '🇫🇷',
    priority: 24,
    avgHomeGoals: 1.38,
    avgAwayGoals: 1.08,
  },
};

interface ApiSportsFixtureItem {
  fixture: {
    id: number;
    date: string;
    venue?: {
      name?: string;
      city?: string;
    };
    status?: {
      short?: string;
    };
  };
  league: {
    id: number;
    name: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score?: {
    halftime?: { home: number | null; away: number | null };
    fulltime?: { home: number | null; away: number | null };
  };
}

interface ApiSportsFixturesResponse {
  response?: ApiSportsFixtureItem[];
}

interface ApiSportsOddValue {
  value: string;
  odd: string;
}

interface ApiSportsBetMarket {
  name: string;
  values?: ApiSportsOddValue[];
}

interface ApiSportsBookmaker {
  name: string;
  bets?: ApiSportsBetMarket[];
}

interface ApiSportsOddsResponse {
  response?: {
    bookmakers?: ApiSportsBookmaker[];
  }[];
}

/**
 * Tisztítja a korábbi napokról megmaradt API-Sports gyorsítótárakat és elavult odds-cache bejegyzéseket,
 * megelőzve a böngésző 5 MB-os localStorage kvótájának kimerülését.
 */
export function pruneOldApiSportsCache(keepDateStr: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const keysToRemove: string[] = [];
    const keepKey = `${CACHE_KEY}_${keepDateStr}`;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Korábbi napok meccscache-ének törlése
      if (key.startsWith(CACHE_KEY) && key !== keepKey) {
        keysToRemove.push(key);
      }

      // 24 óránál régebbi odds cache-ek törlése
      if (key.startsWith('api_sports_odds_')) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (typeof parsed.timestamp === 'number' && parsed.timestamp < oneDayAgo) {
              keysToRemove.push(key);
            }
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.warn('Nem sikerült törölni az elavult API-Sports cache-t:', err);
  }
}

/**
 * Lekéri a másodosztályú (LaLiga 2, Ligue 2, Serie B, 2. Bundesliga, NB I) meccseket
 * az API-Sports v3 API-ról szigorú napi kvóta-védelemmel (100 req/day limit).
 */
export async function fetchApiSportsMatches(
  apiKey: string = API_SPORTS_DEFAULT_KEY,
  targetDate?: string,
  forceRefresh: boolean = false
): Promise<Match[]> {
  const dateStr = targetDate || formatLocalDate();
  const cacheKeyWithDate = `${CACHE_KEY}_${dateStr}`;

  // Elavult régebbi napok gyorsítótárának automatikus ürítése a kvótaszakadás megelőzésére
  pruneOldApiSportsCache(dateStr);

  // 1. Gyorsítótár ellenőrzése (0 API hívás!)
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(cacheKeyWithDate);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS && Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {
      // cache hiba esetén folytatjuk
    }
  }

  // 2. Végpontok: szerveroldali proxy (és közvetlen API csak saját kulcs megadásakor)
  const endpoints = [`/api/apisports?date=${dateStr}`];
  if (apiKey.trim()) {
    endpoints.push(`https://v3.football.api-sports.io/fixtures?date=${dateStr}`);
  }

  let rawData: ApiSportsFixturesResponse | null = null;
  let lastError: Error | null = null;

  for (const url of endpoints) {
    try {
      const headers: Record<string, string> = {};
      if (apiKey.trim()) {
        headers['x-apisports-key'] = apiKey.trim();
      }
      const res = await fetch(url, { headers });

      if (res.ok) {
        const parsed: ApiSportsFixturesResponse = await res.json();
        if (parsed && Array.isArray(parsed.response)) {
          rawData = parsed;
          break;
        }
      } else {
        lastError = new Error(`HTTP ${res.status} válasz az API-Sports végponttól`);
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error('Hálózati hiba');
    }
  }

  if (!rawData || !rawData.response) {
    console.warn('API-Sports meccsek lekérése sikertelen:', lastError?.message);
    return [];
  }

  // Csapatnév -> API-Sports Fixture ID keresőtérkép mentése (ingyenes illesztés más ligákhoz)
  try {
    const lookup: Record<string, number> = {};
    for (const item of rawData.response) {
      if (item.teams?.home?.name && item.teams?.away?.name && item.fixture?.id) {
        const key = `${normalizeTeamName(item.teams.home.name)}_${normalizeTeamName(item.teams.away.name)}`;
        lookup[key] = item.fixture.id;
      }
    }
    localStorage.setItem(FIXTURE_LOOKUP_KEY, JSON.stringify(lookup));
  } catch {
    // böngészős tárolási hiba esetén csendben folytatjuk
  }

  // 3. Csak a támogatott ligák szűrése
  const targetLeagueIds = new Set(Object.keys(SUPPORTED_SECONDARY_LEAGUES).map(Number));
  const rawFixtures = rawData.response.filter((f) =>
    targetLeagueIds.has(f.league?.id)
  );

  // 3.5 Befejezett meccsekből Dixon-Coles modellek illesztése/frissítése
  for (const lid of targetLeagueIds) {
    const finishedForLeague: FinishedMatchResult[] = rawFixtures
      .filter(
        (f) =>
          f.league.id === lid &&
          ['FT', 'AET', 'PEN'].includes(f.fixture.status?.short || '') &&
          f.goals.home !== null &&
          f.goals.away !== null
      )
      .map((f) => ({
        homeTeam: f.teams.home.name,
        awayTeam: f.teams.away.name,
        homeGoals: f.goals.home!,
        awayGoals: f.goals.away!,
        date: f.fixture.date ? f.fixture.date.split('T')[0] : undefined,
      }));

    if (finishedForLeague.length >= 6) {
      const fitted = fitDixonColesModel(finishedForLeague, `apisports_${lid}`);
      saveLeagueModel(fitted);
    }
  }

  // 4. Konvertálás a belső Match formátumra & Dixon-Coles modellezés
  const matches: Match[] = rawFixtures.map((f) => {
    const lConfig = SUPPORTED_SECONDARY_LEAGUES[f.league.id];
    const { kickoffDate, kickoffTime } = parseIsoToLocalDateAndTime(f.fixture.date);

    // Meccs státusz
    let status: MatchStatus = 'UPCOMING';
    const statusShort = f.fixture.status?.short || '';
    if (['1H', '2H', 'HT', 'ET', 'P', 'BT'].includes(statusShort)) {
      status = 'LIVE';
    } else if (['FT', 'AET', 'PEN'].includes(statusShort)) {
      status = 'FINISHED';
    }

    const homeTeamName = f.teams.home.name;
    const awayTeamName = f.teams.away.name;

    // Dixon-Coles modellből származó xG vagy liga-szintű bázis
    const leagueModel = loadLeagueModel(`apisports_${lConfig.id}`);
    const { homeXg, awayXg, isFitted, homeRating, awayRating } =
      computeExpectedGoalsFromModel(
        leagueModel,
        homeTeamName,
        awayTeamName,
        lConfig.avgHomeGoals,
        lConfig.avgAwayGoals
      );

    // Piaci valószínűségek Poisson/Dixon-Coles alapján a becsült rho korrekcióval
    const probabilities = calculateMarketProbabilities(
      homeXg,
      awayXg,
      1.0,
      leagueModel?.rho || -0.13
    );

    // Szimulált piaci szorzók (fair odds + 5.5% árrés)
    const margin = 1.055;
    const oddsHome = Math.max(
      1.18,
      Math.round(((1 / (probabilities.homeWin / 100)) / margin) * 100) / 100
    );
    const oddsDraw = Math.max(
      2.6,
      Math.round(((1 / (probabilities.draw / 100)) / margin) * 100) / 100
    );
    const oddsAway = Math.max(
      1.25,
      Math.round(((1 / (probabilities.awayWin / 100)) / margin) * 100) / 100
    );
    const oddsBtts = Math.max(
      1.38,
      Math.round(((1 / (probabilities.bttsYes / 100)) / margin) * 100) / 100
    );
    const oddsOver25 = Math.max(
      1.35,
      Math.round(((1 / (probabilities.over25 / 100)) / margin) * 100) / 100
    );
    const oddsUnder25 = Math.max(
      1.35,
      Math.round(
        ((1 / (Math.max(10, 100 - probabilities.over25) / 100)) / margin) * 100
      ) / 100
    );

    const { aiPick, quantAnalysis } = buildMatchQuantAndPick({
      homeTeamName,
      awayTeamName,
      homeXg,
      awayXg,
      probabilities,
      odds: {
        home: oddsHome,
        draw: oddsDraw,
        away: oddsAway,
        bttsYes: oddsBtts,
        over25: oddsOver25,
        under25: oddsUnder25,
      },
      dataQuality: isFitted ? 'B' : 'C',
      leagueLabel: isFitted
        ? `${lConfig.name} (Valós Dixon–Coles illesztés)`
        : `${lConfig.name} (ligaátlag xG bázis)`,
      isSimulatedOdds: true,
      dixonColesRatings: isFitted && homeRating && awayRating
        ? {
            homeAttack: homeRating.attack,
            homeDefense: homeRating.defense,
            awayAttack: awayRating.attack,
            awayDefense: awayRating.defense,
            homeAdvantage: leagueModel?.homeAdvantage || 1.2,
            rho: leagueModel?.rho || -0.13,
            isEmpiricallyFitted: true,
            sampleSize: leagueModel?.sampleSize,
          }
        : undefined,
    });

    return {
      id: `apisports-${f.fixture.id}`,
      leagueId: lConfig.internalId,
      leagueName: lConfig.name,
      leagueCountry: lConfig.country,
      leagueFlag: lConfig.flag,
      kickoffTime,
      kickoffDate,
      utcDate: f.fixture.date,
      status,
      homeScore: f.goals.home ?? undefined,
      awayScore: f.goals.away ?? undefined,
      homeHalfTimeScore: f.score?.halftime?.home ?? undefined,
      awayHalfTimeScore: f.score?.halftime?.away ?? undefined,
      homeTeam: {
        id: String(f.teams.home.id),
        name: homeTeamName,
        shortName: homeTeamName.substring(0, 3).toUpperCase(),
        logo: f.teams.home.logo,
        xgAvg: homeXg,
        goalsScoredAvg: homeRating ? homeRating.attack : 1.0,
        goalsConcededAvg: homeRating ? homeRating.defense : 1.0,
      },
      awayTeam: {
        id: String(f.teams.away.id),
        name: awayTeamName,
        shortName: awayTeamName.substring(0, 3).toUpperCase(),
        logo: f.teams.away.logo,
        xgAvg: awayXg,
        goalsScoredAvg: awayRating ? awayRating.attack : 1.0,
        goalsConcededAvg: awayRating ? awayRating.defense : 1.0,
      },
      probabilities,
      odds: {
        home: oddsHome,
        draw: oddsDraw,
        away: oddsAway,
        bttsYes: oddsBtts,
        over25: oddsOver25,
      },
      aiPick,
      quantAnalysis,
      venue: f.fixture.venue?.name
        ? `${f.fixture.venue.name}, ${f.fixture.venue.city || ''}`
        : undefined,
      apiSportsFixtureId: f.fixture.id,
    };
  });

  // Mentés a gyorsítótárba
  try {
    localStorage.setItem(
      cacheKeyWithDate,
      JSON.stringify({ timestamp: Date.now(), data: matches })
    );
  } catch (err) {
    console.warn('Nem sikerült elmenteni az API-Sports cache-t:', err);
  }

  return matches;
}

/**
 * Normalizálja a csapatnevet diakritikus jelek és klub előtagok/utótagok nélkül a pontos párosításhoz.
 */
export function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^(fc|afc|cf|sc|rc|ac|as|ss|bv|sv|vfb|vfl|rb|ud|ca)\s+/i, '')
    .replace(/\s+(fc|cf|sc|afc|cd|sad)$/i, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Megkeresi egy meccshez tartozó API-Sports Fixture ID-t (ha van).
 */
export function resolveApiSportsFixtureId(match: Match): number | null {
  if (match.apiSportsFixtureId) return match.apiSportsFixtureId;
  if (match.id.startsWith('apisports-')) {
    const num = Number(match.id.replace('apisports-', ''));
    if (!isNaN(num) && num > 0) return num;
  }
  try {
    const raw = localStorage.getItem(FIXTURE_LOOKUP_KEY);
    if (raw) {
      const lookup = JSON.parse(raw);
      const key = `${normalizeTeamName(match.homeTeam.name)}_${normalizeTeamName(match.awayTeam.name)}`;
      if (lookup[key]) return lookup[key];
    }
  } catch {
    // csendben folytatjuk
  }
  return null;
}

/**
 * Lekéri a valós bukmékeri oddsokat (Pinnacle, Bet365, William Hill stb.) egy adott mérkőzéshez.
 * 60 perces helyi gyorsítótárral védve a napi 100 API kéréses kvótát.
 */
export async function fetchFixtureOdds(
  fixtureId: number,
  apiKey: string = API_SPORTS_DEFAULT_KEY,
  forceRefresh = false
): Promise<FixtureRealOdds | null> {
  const cacheKey = `${ODDS_CACHE_PREFIX}${fixtureId}`;

  // 1. Gyorsítótár ellenőrzése (0 API hívás!)
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        const age = Date.now() - (typeof timestamp === 'number' ? timestamp : 0);
        if (age < ODDS_CACHE_TTL_MS && data) {
          const remainingMinutes = Math.max(0, Math.floor((ODDS_CACHE_TTL_MS - age) / 60000));
          return {
            ...data,
            expiresAt: new Date(timestamp + ODDS_CACHE_TTL_MS).toISOString(),
            ttlMinutes: remainingMinutes,
            isExpired: false,
          };
        }
      }
    } catch {
      // cache olvasási hiba esetén folytatjuk
    }
  }

  // 2. Végpontok: szerveroldali proxy (és közvetlen API csak saját kulcs megadásakor)
  const endpoints = [`/api/apisports?fixture=${fixtureId}`];
  if (apiKey.trim()) {
    endpoints.push(`https://v3.football.api-sports.io/odds?fixture=${fixtureId}`);
  }

  let rawData: ApiSportsOddsResponse | null = null;
  let lastError: Error | null = null;

  for (const url of endpoints) {
    try {
      const headers: Record<string, string> = {};
      if (apiKey.trim()) {
        headers['x-apisports-key'] = apiKey.trim();
      }
      const res = await fetch(url, { headers });

      if (res.ok) {
        const parsed: ApiSportsOddsResponse = await res.json();
        if (parsed && Array.isArray(parsed.response)) {
          rawData = parsed;
          break;
        }
      } else {
        lastError = new Error(`HTTP ${res.status}`);
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error('Hálózati hiba');
    }
  }

  if (!rawData || !rawData.response || rawData.response.length === 0) {
    console.warn(`Nem található bukmékeri odds a ${fixtureId} meccshez:`, lastError?.message);
    return null;
  }

  const fixtureResp = rawData.response[0];
  const rawBookmakers = fixtureResp.bookmakers || [];
  if (rawBookmakers.length === 0) {
    return null;
  }

  // 3. Bukmékerek és piacok feldolgozása
  const parsedBookmakers: BookmakerOddsItem[] = [];

  for (const b of rawBookmakers) {
    const mw = b.bets?.find((x) => x.name === 'Match Winner');
    const ou = b.bets?.find((x) => x.name === 'Goals Over/Under');
    const btts = b.bets?.find((x) => x.name === 'Both Teams Score');

    const homeVal = mw?.values?.find((v) => v.value === 'Home')?.odd;
    const drawVal = mw?.values?.find((v) => v.value === 'Draw')?.odd;
    const awayVal = mw?.values?.find((v) => v.value === 'Away')?.odd;

    const home = homeVal ? Number(homeVal) : undefined;
    const draw = drawVal ? Number(drawVal) : undefined;
    const away = awayVal ? Number(awayVal) : undefined;

    const over25Val = ou?.values?.find((v) => v.value === 'Over 2.5')?.odd;
    const under25Val = ou?.values?.find((v) => v.value === 'Under 2.5')?.odd;
    const over25 = over25Val ? Number(over25Val) : undefined;
    const under25 = under25Val ? Number(under25Val) : undefined;

    const bttsYesVal = btts?.values?.find((v) => v.value === 'Yes')?.odd;
    const bttsNoVal = btts?.values?.find((v) => v.value === 'No')?.odd;
    const bttsYes = bttsYesVal ? Number(bttsYesVal) : undefined;
    const bttsNo = bttsNoVal ? Number(bttsNoVal) : undefined;

    let margin: number | undefined = undefined;
    if (home && draw && away) {
      margin = Math.round(((1 / home + 1 / draw + 1 / away) - 1) * 1000) / 10;
    }

    parsedBookmakers.push({
      name: b.name,
      home,
      draw,
      away,
      over25,
      under25,
      bttsYes,
      bttsNo,
      margin,
    });
  }

  // Kiemelt bukmékerek kinyerése (Pinnacle & Bet365)
  const pinnacle = parsedBookmakers.find((b) =>
    b.name.toLowerCase().includes('pinnacle')
  );
  const bet365 = parsedBookmakers.find((b) =>
    b.name.toLowerCase().includes('bet365')
  );

  // Legjobb elérhető szorzók kiválasztása
  let bestHome: { odd: number; bookmaker: string } | undefined;
  let bestDraw: { odd: number; bookmaker: string } | undefined;
  let bestAway: { odd: number; bookmaker: string } | undefined;
  let bestOver25: { odd: number; bookmaker: string } | undefined;
  let bestUnder25: { odd: number; bookmaker: string } | undefined;
  let bestBttsYes: { odd: number; bookmaker: string } | undefined;

  for (const b of parsedBookmakers) {
    if (b.home && (!bestHome || b.home > bestHome.odd))
      bestHome = { odd: b.home, bookmaker: b.name };
    if (b.draw && (!bestDraw || b.draw > bestDraw.odd))
      bestDraw = { odd: b.draw, bookmaker: b.name };
    if (b.away && (!bestAway || b.away > bestAway.odd))
      bestAway = { odd: b.away, bookmaker: b.name };
    if (b.over25 && (!bestOver25 || b.over25 > bestOver25.odd))
      bestOver25 = { odd: b.over25, bookmaker: b.name };
    if (b.under25 && (!bestUnder25 || b.under25 > bestUnder25.odd))
      bestUnder25 = { odd: b.under25, bookmaker: b.name };
    if (b.bttsYes && (!bestBttsYes || b.bttsYes > bestBttsYes.odd))
      bestBttsYes = { odd: b.bttsYes, bookmaker: b.name };
  }

  const result: FixtureRealOdds = {
    fixtureId,
    updatedAt: new Date().toLocaleTimeString('hu-HU', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    bookmakers: parsedBookmakers,
    pinnacle,
    bet365,
    bestOdds: {
      home: bestHome,
      draw: bestDraw,
      away: bestAway,
      over25: bestOver25,
      under25: bestUnder25,
      bttsYes: bestBttsYes,
    },
  };

  const nowMs = Date.now();
  const expiresAt = new Date(nowMs + ODDS_CACHE_TTL_MS).toISOString();
  result.expiresAt = expiresAt;
  result.ttlMinutes = 60;
  result.isExpired = false;

  // Mentés a gyorsítótárba
  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ timestamp: nowMs, data: result })
    );
  } catch (err) {
    console.warn('Nem sikerült elmenteni az odds cache-t:', err);
  }

  return result;
}

/**
 * Lekéri a gyorsítótárazott valós oddsot, lejárati (TTL) metaadatokkal kiegészítve.
 */
export function getCachedFixtureOdds(
  fixtureId: number,
  nowMs: number = Date.now()
): FixtureRealOdds | null {
  const cacheKey = `${ODDS_CACHE_PREFIX}${fixtureId}`;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    const { timestamp, data } = JSON.parse(raw);
    if (!data) return null;

    const age = nowMs - (typeof timestamp === 'number' ? timestamp : 0);
    const isExpired = age >= ODDS_CACHE_TTL_MS;
    const remainingMinutes = Math.max(0, Math.floor((ODDS_CACHE_TTL_MS - age) / 60000));
    const expiresAt = new Date((typeof timestamp === 'number' ? timestamp : nowMs) + ODDS_CACHE_TTL_MS).toISOString();

    return {
      ...data,
      expiresAt,
      ttlMinutes: remainingMinutes,
      isExpired,
    };
  } catch {
    return null;
  }
}

/**
 * Megállapítja, hogy egy valós odds adat lejárt-e (TTL túllépés vagy explicit flag).
 */
export function isOddsExpired(
  realOdds: FixtureRealOdds | undefined | null,
  nowMs: number = Date.now()
): boolean {
  if (!realOdds) return true;
  if (realOdds.isExpired === true) return true;
  if (realOdds.expiresAt) {
    return new Date(realOdds.expiresAt).getTime() <= nowMs;
  }
  return false;
}

/**
 * Kinyeri a lejárati és bukméker státuszt a nézetek számára.
 */
export function getOddsTtlStatus(
  realOdds: FixtureRealOdds | undefined | null,
  nowMs: number = Date.now()
): {
  isReal: boolean;
  isExpired: boolean;
  remainingMinutes: number;
  bookmakerName?: string;
  expiresAt?: string;
} {
  if (!realOdds || !realOdds.bestOdds) {
    return { isReal: false, isExpired: true, remainingMinutes: 0 };
  }
  const expired = isOddsExpired(realOdds, nowMs);
  let remainingMinutes = 0;
  if (realOdds.expiresAt) {
    remainingMinutes = Math.max(0, Math.floor((new Date(realOdds.expiresAt).getTime() - nowMs) / 60000));
  } else if (typeof realOdds.ttlMinutes === 'number') {
    remainingMinutes = realOdds.ttlMinutes;
  }
  const primaryBookie =
    realOdds.pinnacle?.name ||
    realOdds.bet365?.name ||
    realOdds.bestOdds.home?.bookmaker ||
    realOdds.bestOdds.over25?.bookmaker ||
    'Bukméker';

  return {
    isReal: true,
    isExpired: expired,
    remainingMinutes,
    bookmakerName: primaryBookie,
    expiresAt: realOdds.expiresAt,
  };
}

/**
 * Hozzáfűzi a helyi gyorsítótárban lévő valós oddsokat a mérkőzésekhez.
 * Ha létezik érvényes (nem lejárt) valós bukmékeri odds, frissíti a match.odds és match.aiPick értékeket is.
 * Ha az odds szimulált vagy lejárt, a Value (+EV%) és Kelly tét automatikusan le lesz tiltva (0).
 */
export function attachCachedRealOddsToMatches(
  matches: Match[],
  nowMs: number = Date.now()
): Match[] {
  return matches.map((match) => {
    const fId = match.apiSportsFixtureId || resolveApiSportsFixtureId(match);
    if (!fId) {
      if (match.aiPick) {
        match.aiPick.isSimulatedOdds = true;
        match.aiPick.expectedValue = 0;
        match.aiPick.quarterKellyPct = 0;
      }
      return match;
    }

    const cached = getCachedFixtureOdds(fId, nowMs);
    if (!cached) {
      if (match.aiPick) {
        match.aiPick.isSimulatedOdds = true;
        match.aiPick.expectedValue = 0;
        match.aiPick.quarterKellyPct = 0;
      }
      return match;
    }

    match.realOdds = cached;

    if (!cached.isExpired) {
      // Valós bukmékeri odds érvényes! Frissítjük a piaci oddsokat
      if (cached.bestOdds.home?.odd) match.odds.home = cached.bestOdds.home.odd;
      if (cached.bestOdds.draw?.odd) match.odds.draw = cached.bestOdds.draw.odd;
      if (cached.bestOdds.away?.odd) match.odds.away = cached.bestOdds.away.odd;
      if (cached.bestOdds.over25?.odd) match.odds.over25 = cached.bestOdds.over25.odd;
      if (cached.bestOdds.under25?.odd) match.odds.under25 = cached.bestOdds.under25.odd;
      if (cached.bestOdds.bttsYes?.odd) match.odds.bttsYes = cached.bestOdds.bttsYes.odd;

      const ttlStatus = getOddsTtlStatus(cached, nowMs);

      // Újraszámoljuk az aiPick-et valós oddsszal (isSimulatedOdds: false)
      const { aiPick, quantAnalysis } = buildMatchQuantAndPick({
        homeTeamName: match.homeTeam.name,
        awayTeamName: match.awayTeam.name,
        homeXg: match.homeTeam.xgAvg || 1.45,
        awayXg: match.awayTeam.xgAvg || 1.15,
        probabilities: match.probabilities,
        odds: {
          home: match.odds.home,
          draw: match.odds.draw,
          away: match.odds.away,
          bttsYes: match.odds.bttsYes,
          over25: match.odds.over25,
          under25: match.odds.under25 ?? Math.max(1.35, Math.round(((1 / (Math.max(10, 100 - match.probabilities.over25) / 100)) / 1.05) * 100) / 100),
        },
        dataQuality: match.quantAnalysis?.dataQuality || 'B',
        leagueLabel: match.leagueName,
        isSimulatedOdds: false,
        dixonColesRatings: match.quantAnalysis?.dixonColesRatings,
      });

      if (aiPick) {
        aiPick.bookmakerName = ttlStatus.bookmakerName;
        aiPick.oddsExpiresAt = ttlStatus.expiresAt;
        aiPick.ttlMinutes = ttlStatus.remainingMinutes;
        aiPick.isOddsExpired = false;
        match.aiPick = aiPick;
      }
      if (quantAnalysis) {
        match.quantAnalysis = {
          ...match.quantAnalysis,
          ...quantAnalysis,
        };
      }
    } else {
      // Lejárt az odds -> letiltjuk a Value/Kelly kijelzést
      if (match.aiPick) {
        match.aiPick.isSimulatedOdds = true;
        match.aiPick.isOddsExpired = true;
        match.aiPick.ttlMinutes = 0;
        match.aiPick.expectedValue = 0;
        match.aiPick.quarterKellyPct = 0;
      }
      if (match.quantAnalysis) {
        match.quantAnalysis.quarterKellyPct = 0;
      }
    }

    return match;
  });
}
