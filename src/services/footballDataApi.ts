import { Match, MatchStatus } from '../types/football';
import {
  calculateMarketProbabilities,
  buildMatchQuantAndPick,
} from './predictionEngine';
import { getRelativeDateStr, parseIsoToLocalDateAndTime } from '../utils/dateUtils';

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
  ELC: { id: 'championship', name: 'Championship', country: 'Anglia', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', priority: 6 },
  FL1: { id: 'ligue1', name: 'Ligue 1', country: 'Franciaország', flag: '🇫🇷', priority: 7 },
  DED: { id: 'eredivisie', name: 'Eredivisie', country: 'Hollandia', flag: '🇳🇱', priority: 8 },
  BSA: { id: 'seriea_brazil', name: 'Série A Brasil', country: 'Brazília', flag: '🇧🇷', priority: 9 },
};

// Becsült csapat erősségi xG bázisok a népszerűbb klubokra
const TEAM_POWER: Record<string, { attack: number; defense: number }> = {
  // Premier League
  Arsenal: { attack: 2.15, defense: 0.85 },
  'Manchester City': { attack: 2.35, defense: 0.9 },
  Liverpool: { attack: 2.25, defense: 0.95 },
  Chelsea: { attack: 1.85, defense: 1.2 },
  'Aston Villa': { attack: 1.75, defense: 1.25 },
  Tottenham: { attack: 1.9, defense: 1.35 },
  'Manchester United': { attack: 1.55, defense: 1.4 },
  Newcastle: { attack: 1.7, defense: 1.25 },
  // La Liga
  'Real Madrid': { attack: 2.3, defense: 0.85 },
  Barcelona: { attack: 2.4, defense: 1.0 },
  'Atlético Madrid': { attack: 1.85, defense: 0.85 },
  // Serie A
  'Inter Milan': { attack: 2.15, defense: 0.85 },
  Juventus: { attack: 1.65, defense: 0.75 },
  'AC Milan': { attack: 1.85, defense: 1.15 },
  Napoli: { attack: 1.9, defense: 1.0 },
  // Bundesliga
  'Bayern München': { attack: 2.55, defense: 1.0 },
  'Bayer Leverkusen': { attack: 2.2, defense: 1.1 },
  'Borussia Dortmund': { attack: 2.05, defense: 1.35 },
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
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS && Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {
      // cache hiba esetén folytatjuk az API hívással
    }
  }

  // Explicit 3 napos időablak (Tegnap -> Holnap), hogy a Tegnap / Ma / Holnap fülek pontosak legyenek
  const dateFrom = getRelativeDateStr(-1);
  const dateTo = getRelativeDateStr(1);
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
    throw new Error(
      lastError?.message || 'Nem sikerült lekérni a football-data.org adatokat.'
    );
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
    }

    const homePower =
      TEAM_POWER[m.homeTeam.shortName] ||
      TEAM_POWER[m.homeTeam.name] || { attack: 1.55, defense: 1.25 };
    const awayPower =
      TEAM_POWER[m.awayTeam.shortName] ||
      TEAM_POWER[m.awayTeam.name] || { attack: 1.3, defense: 1.35 };

    // Hazai várható gólok (mérsékelt hazai pálya faktorral: +8% hazai, nincs duplázás a predictionEngine-ben)
    const homeXg =
      Math.round(homePower.attack * (awayPower.defense / 1.3) * 1.08 * 10) / 10;
    const awayXg =
      Math.round(awayPower.attack * (homePower.defense / 1.3) * 10) / 10;

    // Poisson/Dixon-Coles valószínűségszámítás (homeAdvantageFactor = 1.0, nincs duplázás)
    const probabilities = calculateMarketProbabilities(homeXg, awayXg, 1.0);

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

    const isTopTier = ['PL', 'PD', 'SA', 'BL1', 'CL'].includes(compCode);
    const dataQuality: 'A' | 'B' | 'C' = isTopTier
      ? 'A'
      : ['ELC', 'FL1', 'DED'].includes(compCode)
      ? 'B'
      : 'C';

    const homeDisplayName = m.homeTeam.shortName || m.homeTeam.name;
    const awayDisplayName = m.awayTeam.shortName || m.awayTeam.name;

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
      leagueLabel: compInfo.name,
      isSimulatedOdds: true,
    });

    return {
      id: `fd-${m.id}`,
      leagueId: compInfo.id || compCode.toLowerCase(),
      leagueName: compInfo.name,
      leagueCountry: compInfo.country,
      leagueFlag: compInfo.flag,
      kickoffTime,
      kickoffDate,
      status,
      homeTeam: {
        id: String(m.homeTeam.id),
        name: homeDisplayName,
        shortName: m.homeTeam.tla || homeDisplayName.substring(0, 3).toUpperCase(),
        logo: m.homeTeam.crest || `https://crests.football-data.org/${m.homeTeam.id}.png`,
        xgAvg: homeXg,
        goalsScoredAvg: homePower.attack,
        goalsConcededAvg: homePower.defense,
      },
      awayTeam: {
        id: String(m.awayTeam.id),
        name: awayDisplayName,
        shortName: m.awayTeam.tla || awayDisplayName.substring(0, 3).toUpperCase(),
        logo: m.awayTeam.crest || `https://crests.football-data.org/${m.awayTeam.id}.png`,
        xgAvg: awayXg,
        goalsScoredAvg: awayPower.attack,
        goalsConcededAvg: awayPower.defense,
      },
      homeScore: m.score.fullTime.home ?? undefined,
      awayScore: m.score.fullTime.away ?? undefined,
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
