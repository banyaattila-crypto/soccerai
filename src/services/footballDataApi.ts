import { Match, MatchStatus } from '../types/football';
import {
  calculateMarketProbabilities,
  buildMatchQuantAndPick,
} from './predictionEngine';
import { getRelativeDateStr, parseIsoToLocalDateAndTime } from '../utils/dateUtils';
import {
  fitDixonColesModel,
  computeExpectedGoalsFromModel,
  loadLeagueModel,
  saveLeagueModel,
  FittedDixonColesModel,
  FinishedMatchResult,
} from './dixonColesFitting';
import {
  checkFootballDataQuota,
  recordFootballDataCall,
} from './quotaService';

interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday: number;
  stage: string;
  homeTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  awayTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  score: {
    winner: string | null;
    duration: string;
    fullTime: {
      home: number | null;
      away: number | null;
    };
    halfTime: {
      home: number | null;
      away: number | null;
    };
  };
  competition: {
    id: number;
    name: string;
    code: string;
    type: string;
    emblem: string;
  };
  area: {
    id: number;
    name: string;
    code: string;
    flag: string;
  };
}

interface FootballDataResponse {
  resultSet: {
    count: number;
    competitions: string;
    first: string;
    last: string;
    played: number;
  };
  matches: FootballDataMatch[];
}

// Bajnokság metaadatok magyarul és belső azonosítókkal
export const COMPETITION_MAP: Record<
  string,
  { id: string; name: string; country: string; flag: string; priority: number }
> = {
  PL: { id: 'pl', name: 'Premier League', country: 'Anglia', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', priority: 1 },
  PD: { id: 'laliga', name: 'La Liga', country: 'Spanyolország', flag: '🇪🇸', priority: 2 },
  SA: { id: 'seriea', name: 'Serie A', country: 'Olaszország', flag: '🇮🇹', priority: 3 },
  BL1: { id: 'bundesliga', name: 'Bundesliga', country: 'Németország', flag: '🇩🇪', priority: 4 },
  CL: { id: 'ucl', name: 'Bajnokok Ligája', country: 'Európa', flag: '⭐', priority: 5 },
  EL: { id: 'uel', name: 'Európa Liga', country: 'Európa', flag: '🏆', priority: 6 },
  EC: { id: 'uecl', name: 'Konferencia Liga', country: 'Európa', flag: '🟢', priority: 7 },
  ELC: { id: 'championship', name: 'Championship', country: 'Anglia', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', priority: 8 },
  FL1: { id: 'ligue1', name: 'Ligue 1', country: 'Franciaország', flag: '🇫🇷', priority: 9 },
  DED: { id: 'eredivisie', name: 'Eredivisie', country: 'Hollandia', flag: '🇳🇱', priority: 10 },
  BSA: { id: 'seriea_brazil', name: 'Série A Brasil', country: 'Brazília', flag: '🇧🇷', priority: 11 },
  PPL: { id: 'primeira_liga', name: 'Primeira Liga', country: 'Portugália', flag: '🇵🇹', priority: 12 },
};


const CACHE_KEY = 'soccerai_live_matches_cache_v4';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 perces gyorsítótár

/**
 * Lekéri az élő mérkőzéseket a football-data.org API-ról okos gyorsítótárral,
 * tegnap-ma-holnap (dateFrom..dateTo) ablakra szűrve.
 */
export async function fetchLiveMatches(
  apiKey: string = '',
  forceRefresh: boolean = false
): Promise<Match[]> {
  // 1. Gyorsítótár vagy kvótagyorsítótár ellenőrzése
  const quota = checkFootballDataQuota();
  if (!forceRefresh || quota.isRateLimited) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        // Friss cache, VAGY aktív kvótakorlát miatti stale cache fallback
        if ((Date.now() - timestamp < CACHE_TTL_MS || quota.isRateLimited) && Array.isArray(data) && data.length > 0) {
          if (quota.isRateLimited) {
            console.warn(`Football-Data kvótakorlát aktív (${quota.retryAfterSeconds}s), meglévő gyorsítótárazott adatok használata.`);
          }
          return data;
        }
      }
    } catch {
      // cache hiba esetén folytatjuk az API hívással
    }
  }

  // Explicit 3 napos időablak (Tegnap -> Holnap este lezárásáig), hogy az összes valós meccs és kupa átjöjjön
  const dateFrom = getRelativeDateStr(-1);
  const dateTo = getRelativeDateStr(2);
  const query = `?dateFrom=${dateFrom}&dateTo=${dateTo}`;

  const endpoints = [`/api/matches${query}`];
  if (apiKey.trim()) {
    endpoints.push(`https://api.football-data.org/v4/matches${query}`);
  }

  let rawData: FootballDataResponse | null = null;
  let lastError: Error | null = null;

  for (const url of endpoints) {
    try {
      const headers: Record<string, string> = {};
      if (apiKey.trim()) {
        headers['X-Auth-Token'] = apiKey.trim();
      }

      const res = await fetch(url, { headers });
      recordFootballDataCall(res.status, res.headers);

      if (res.ok) {
        rawData = await res.json();
        break;
      } else {
        lastError = new Error(`HTTP ${res.status} válasz a szervertől`);
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error('Hálózati lekérési hiba');
    }
  }

  if (!rawData || !Array.isArray(rawData.matches)) {
    // Stale cache megmentő fallback: Ha hálózati vagy kvótahiba van, meglévő adatok megmentése
    try {
      const stale = localStorage.getItem(CACHE_KEY);
      if (stale) {
        const { data } = JSON.parse(stale);
        if (Array.isArray(data) && data.length > 0) {
          console.warn('API hiba, de a meglévő gyorsítótár megmentette az adatokat:', lastError?.message);
          return data;
        }
      }
    } catch {
      // ignore
    }

    throw new Error(
      lastError?.message || 'Nem sikerült lekérni a football-data.org adatokat.'
    );
  }

  // Egyedi bajnokságok összegyűjtése és valós Dixon-Coles modell illesztése helyben (0 extra API hívás, kvótavédelem)
  const uniqueCompCodes = Array.from(
    new Set(rawData.matches.map((m) => m.competition.code || 'PL'))
  );

  const leagueModelsMap: Record<string, FittedDixonColesModel | null> = {};
  for (const code of uniqueCompCodes) {
    leagueModelsMap[code] = loadLeagueModel(code);
  }

  // A letöltött befejezett meccsekből helyben illesztjük a modelleket extra hálózati kérések nélkül
  for (const code of uniqueCompCodes) {
    if (!leagueModelsMap[code]) {
      const finishedForComp: FinishedMatchResult[] = rawData.matches
        .filter(
          (m) =>
            (m.competition.code || 'PL') === code &&
            m.status === 'FINISHED' &&
            m.score?.fullTime?.home !== null &&
            m.score?.fullTime?.away !== null
        )
        .map((m) => ({
          homeTeam: m.homeTeam.name,
          awayTeam: m.awayTeam.name,
          homeGoals: m.score.fullTime.home!,
          awayGoals: m.score.fullTime.away!,
          date: m.utcDate ? m.utcDate.split('T')[0] : undefined,
        }));

      if (finishedForComp.length >= 4) {
        const fitted = fitDixonColesModel(finishedForComp, code);
        saveLeagueModel(fitted);
        leagueModelsMap[code] = fitted;
      }
    }
  }

  // Konvertálás a belső Match formátumra
  const matches: Match[] = rawData.matches.map((m) => {
    const compCode = m.competition.code || 'PL';
    const compInfo = COMPETITION_MAP[compCode] || {
      id: compCode.toLowerCase(),
      name: m.competition.name,
      country: m.area.name || 'Nemzetközi',
      flag: '⚽',
      priority: 99,
    };

    // Időpont átalakítás helyi időzónára egységesen
    const { kickoffDate, kickoffTime } = parseIsoToLocalDateAndTime(m.utcDate);

    // Státusz leképezés
    let status: MatchStatus = 'UPCOMING';
    if (m.status === 'IN_PLAY' || m.status === 'PAUSED') {
      status = 'LIVE';
    } else if (m.status === 'FINISHED' || m.status === 'AWARDED') {
      status = 'FINISHED';
    } else if (m.status === 'POSTPONED') {
      status = 'POSTPONED';
    } else if (m.status === 'CANCELLED') {
      status = 'CANCELLED';
    } else if (m.status === 'SUSPENDED') {
      status = 'SUSPENDED';
    }

    const leagueModel = leagueModelsMap[compCode] || null;
    const homeDisplayName = m.homeTeam.shortName || m.homeTeam.name;
    const awayDisplayName = m.awayTeam.shortName || m.awayTeam.name;

    // Valós Dixon-Coles illesztett xG értékek számítása a csapatok alpha (támadás) és beta (védelem) paramétereiből
    const { homeXg, awayXg, isFitted, homeRating, awayRating } =
      computeExpectedGoalsFromModel(
        leagueModel,
        m.homeTeam.name,
        m.awayTeam.name,
        1.45,
        1.15
      );

    // Poisson/Dixon-Coles valószínűségszámítás a becsült rho korrekcióval
    const probabilities = calculateMarketProbabilities(
      homeXg,
      awayXg,
      1.0,
      leagueModel?.rho || -0.13
    );

    // Szimulált piaci szorzók (fair odds + 5% bukmékeri árrés)
    const margin = 1.05;
    const oddsHome = Math.max(
      1.15,
      Math.round(((1 / (probabilities.homeWin / 100)) / margin) * 100) / 100
    );
    const oddsDraw = Math.max(
      2.5,
      Math.round(((1 / (probabilities.draw / 100)) / margin) * 100) / 100
    );
    const oddsAway = Math.max(
      1.2,
      Math.round(((1 / (probabilities.awayWin / 100)) / margin) * 100) / 100
    );
    const oddsBtts = Math.max(
      1.35,
      Math.round(((1 / (probabilities.bttsYes / 100)) / margin) * 100) / 100
    );
    const oddsOver25 = Math.max(
      1.3,
      Math.round(((1 / (probabilities.over25 / 100)) / margin) * 100) / 100
    );
    const oddsUnder25 = Math.max(
      1.3,
      Math.round(
        ((1 / (Math.max(10, 100 - probabilities.over25) / 100)) / margin) * 100
      ) / 100
    );

    const isTopTier = ['PL', 'PD', 'SA', 'BL1', 'CL', 'EL', 'EC'].includes(compCode);
    const dataQuality: 'A' | 'B' | 'C' = isFitted
      ? 'A'
      : isTopTier
      ? 'B'
      : 'C';

    const { aiPick, quantAnalysis } = buildMatchQuantAndPick({
      homeTeamName: homeDisplayName,
      awayTeamName: awayDisplayName,
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
      dataQuality,
      leagueLabel: isFitted
        ? `${compInfo.name} (Valós Dixon–Coles illesztés, ${leagueModel?.sampleSize} meccs)`
        : `${compInfo.name} (ligaátlag bázis)`,
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
      id: `fd-${m.id}`,
      leagueId: compInfo.id || compCode.toLowerCase(),
      leagueName: compInfo.name,
      leagueCountry: compInfo.country,
      leagueFlag: compInfo.flag,
      kickoffTime,
      kickoffDate,
      utcDate: m.utcDate,
      status,
      homeTeam: {
        id: String(m.homeTeam.id),
        name: homeDisplayName,
        shortName: m.homeTeam.tla || homeDisplayName.substring(0, 3).toUpperCase(),
        logo: m.homeTeam.crest || `https://crests.football-data.org/${m.homeTeam.id}.png`,
        xgAvg: homeXg,
        goalsScoredAvg: homeRating ? homeRating.attack : 1.0,
        goalsConcededAvg: homeRating ? homeRating.defense : 1.0,
      },
      awayTeam: {
        id: String(m.awayTeam.id),
        name: awayDisplayName,
        shortName: m.awayTeam.tla || awayDisplayName.substring(0, 3).toUpperCase(),
        logo: m.awayTeam.crest || `https://crests.football-data.org/${m.awayTeam.id}.png`,
        xgAvg: awayXg,
        goalsScoredAvg: awayRating ? awayRating.attack : 1.0,
        goalsConcededAvg: awayRating ? awayRating.defense : 1.0,
      },
      homeScore: m.score?.fullTime?.home ?? undefined,
      awayScore: m.score?.fullTime?.away ?? undefined,
      homeHalfTimeScore: m.score?.halfTime?.home ?? undefined,
      awayHalfTimeScore: m.score?.halfTime?.away ?? undefined,
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
      venue: `${m.homeTeam.name} Stadion`,
    };
  });

  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ timestamp: Date.now(), data: matches })
    );
  } catch {
    // quota hiba esetén csendben továbblép
  }

  return matches;
}
