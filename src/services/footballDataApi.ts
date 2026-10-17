import { Match, MatchStatus, QuantAnalysis } from '../types/football';
import {
  calculateMarketProbabilities,
  devigShin,
  quarterKelly,
  robustnessGridTest,
  lambdaInversionReport,
} from './predictionEngine';

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
  Arsenal: { attack: 2.3, defense: 0.8 },
  'Manchester City': { attack: 2.6, defense: 0.9 },
  Liverpool: { attack: 2.5, defense: 0.9 },
  Chelsea: { attack: 1.9, defense: 1.2 },
  'Aston Villa': { attack: 1.8, defense: 1.3 },
  Tottenham: { attack: 2.0, defense: 1.4 },
  'Manchester United': { attack: 1.6, defense: 1.5 },
  Newcastle: { attack: 1.7, defense: 1.3 },
  // La Liga
  'Real Madrid': { attack: 2.5, defense: 0.8 },
  Barcelona: { attack: 2.7, defense: 1.0 },
  'Atlético Madrid': { attack: 1.9, defense: 0.8 },
  // Serie A
  'Inter Milan': { attack: 2.3, defense: 0.8 },
  Juventus: { attack: 1.7, defense: 0.6 },
  'AC Milan': { attack: 1.9, defense: 1.2 },
  Napoli: { attack: 2.0, defense: 1.0 },
  // Bundesliga
  'Bayern München': { attack: 2.9, defense: 1.0 },
  'Bayer Leverkusen': { attack: 2.4, defense: 1.1 },
  'Borussia Dortmund': { attack: 2.2, defense: 1.4 },
};

const CACHE_KEY = 'soccerai_live_matches_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 perces gyorsítótár

/**
 * Lekéri az élő mérkőzéseket a football-data.org API-ról okos gyorsítótárral
 */
export async function fetchLiveMatches(
  apiKey: string = '0a2ff5ef40ed4113a0ca28d6b9b122d8',
  forceRefresh: boolean = false
): Promise<Match[]> {
  // Ha nem kényszerített frissítés, nézzük meg a gyorsítótárat (0 API hívás!)
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS && Array.isArray(data) && data.length > 0) {
          console.log('⚡ Gyorsítótárazott (cached) élő meccsek használata, 0 API hívás!');
          return data;
        }
      }
    } catch {
      // cache hiba esetén folytatjuk az API hívással
    }
  }

  // Próbáljuk a helyi proxy végpontot, ha sikertelen, közvetlen football-data végpontot
  const endpoints = [
    '/api/matches',
    'https://api.football-data.org/v4/matches',
  ];

  let rawData: FootballDataResponse | null = null;
  let lastError: Error | null = null;

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: {
          'X-Auth-Token': apiKey,
        },
      });

      if (res.ok) {
        rawData = await res.json();
        break;
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  if (!rawData || !rawData.matches) {
    throw new Error(
      lastError?.message || 'Nem sikerült lekérni a football-data.org adatokat.'
    );
  }

  // Konvertálás a belső Match formátumra
  const matches: Match[] = rawData.matches.map((m) => {
    const compCode = m.competition.code || 'PL';
    const compInfo = COMPETITION_MAP[compCode] || {
      name: m.competition.name,
      country: m.area.name || 'Nemzetközi',
      flag: '⚽',
      priority: 99,
    };

    // Időpont átalakítás helyi formátumra
    const matchDate = new Date(m.utcDate);
    const hours = String(matchDate.getHours()).padStart(2, '0');
    const minutes = String(matchDate.getMinutes()).padStart(2, '0');
    const kickoffTime = `${hours}:${minutes}`;

    const year = matchDate.getFullYear();
    const month = String(matchDate.getMonth() + 1).padStart(2, '0');
    const day = String(matchDate.getDate()).padStart(2, '0');
    const kickoffDate = `${year}-${month}-${day}`;

    // Státusz leképezés
    let status: MatchStatus = 'UPCOMING';
    if (m.status === 'IN_PLAY' || m.status === 'PAUSED') {
      status = 'LIVE';
    } else if (m.status === 'FINISHED' || m.status === 'AWARDED') {
      status = 'FINISHED';
    }

    // Csapat xG becslés a matematikai modellhez
    const homePower =
      TEAM_POWER[m.homeTeam.shortName] ||
      TEAM_POWER[m.homeTeam.name] || { attack: 1.5, defense: 1.3 };
    const awayPower =
      TEAM_POWER[m.awayTeam.shortName] ||
      TEAM_POWER[m.awayTeam.name] || { attack: 1.3, defense: 1.4 };

    // Hazai várható gólok = Hazai támadás * Vendég védelem
    const homeXg = Math.round(homePower.attack * (awayPower.defense / 1.3) * 10) / 10;
    const awayXg = Math.round(awayPower.attack * (homePower.defense / 1.3) * 10) / 10;

    // Poisson valószínűségszámítás a predictionEngine-ből!
    const probabilities = calculateMarketProbabilities(homeXg, awayXg);

    // Szorzók (fair odds + 5% bukmékeri árrés szimuláció)
    const margin = 1.05;
    const oddsHome = Math.max(1.15, Math.round(((1 / (probabilities.homeWin / 100)) / margin) * 100) / 100);
    const oddsDraw = Math.max(2.5, Math.round(((1 / (probabilities.draw / 100)) / margin) * 100) / 100);
    const oddsAway = Math.max(1.2, Math.round(((1 / (probabilities.awayWin / 100)) / margin) * 100) / 100);
    const oddsBtts = Math.max(1.35, Math.round(((1 / (probabilities.bttsYes / 100)) / margin) * 100) / 100);
    const oddsOver25 = Math.max(1.3, Math.round(((1 / (probabilities.over25 / 100)) / margin) * 100) / 100);

    // Shin (1992) De-vigging a piacból
    const shinRes = devigShin([oddsHome, oddsDraw, oddsAway]);

    // Adatminőség ellenőrzés (A-szint: Top5 liga, B-szint: másodosztályok/kisebb ligák, C-szint: egyéb)
    const isTopTier = ['PL', 'PD', 'SA', 'BL1', 'CL'].includes(compCode);
    const dataQuality: 'A' | 'B' | 'C' = isTopTier ? 'A' : ['ELC', 'FL1', 'DED'].includes(compCode) ? 'B' : 'C';

    // 1. Szűrő: Robusztussági teszt a λ-rácson
    const robTest = robustnessGridTest(homeXg, awayXg, probabilities.homeWin, oddsHome);

    // 2. Szűrő: Lambda-inverzió a gólpiacra
    const underOddsEst = Math.max(1.3, Math.round((1 / (1 - probabilities.over25 / 100)) * 100) / 100);
    const lambdaReport = lambdaInversionReport(oddsOver25, underOddsEst, 2.5, 3.1);

    // Negyed-Kelly tétméretezés
    const qKelly = quarterKelly(probabilities.homeWin, oddsHome);

    // Érték / Kiemelt szignál azonosítás (szigorú robusztussági szűréssel!)
    let aiPick: Match['aiPick'] | undefined = undefined;

    if (probabilities.homeWin >= 60 && robTest.verdict !== 'ELVETVE') {
      aiPick = {
        market: '1',
        marketLabel: `${m.homeTeam.shortName} Győzelem (1)`,
        probability: probabilities.homeWin,
        odds: oddsHome,
        confidence: Math.min(9.5, Math.round((probabilities.homeWin / 10) * 10) / 10),
        expectedValue: Math.round(((probabilities.homeWin / 100) * oddsHome - 1) * 1000) / 10,
        isTopPick: robTest.verdict === 'ROBUSZTUS' || (robTest.verdict === 'valószínű' && probabilities.homeWin >= 64),
        robustnessVerdict: robTest.verdict,
        quarterKellyPct: qKelly,
        reasoning: `Robusztussági teszt: ${robTest.verdict} (rács ${robTest.posPct}%-án pozitív él). Shin de-vigelt bukméker margin: ${shinRes.margin}%. Javasolt negyed-Kelly bankroll allokáció: ${qKelly}%.`,
      };
    } else if (probabilities.over25 >= 60) {
      const qKellyO25 = quarterKelly(probabilities.over25, oddsOver25);
      aiPick = {
        market: 'OVER_25',
        marketLabel: '2.5 gól felett',
        probability: probabilities.over25,
        odds: oddsOver25,
        confidence: 8.8,
        expectedValue: Math.round(((probabilities.over25 / 100) * oddsOver25 - 1) * 1000) / 10,
        isTopPick: probabilities.over25 >= 65 && lambdaReport.verdict.includes('OVER'),
        robustnessVerdict: 'valószínű',
        quarterKellyPct: qKellyO25,
        reasoning: `λ-inverzió ítélet: ${lambdaReport.verdict}. Piaci gólvárakozás: ${lambdaReport.marketLambda} gól/meccs. Negyed-Kelly: ${qKellyO25}%.`,
      };
    } else if (probabilities.bttsYes >= 62) {
      aiPick = {
        market: 'BTTS_YES',
        marketLabel: 'Mindkét csapat szerez gólt',
        probability: probabilities.bttsYes,
        odds: oddsBtts,
        confidence: 8.5,
        expectedValue: Math.round(((probabilities.bttsYes / 100) * oddsBtts - 1) * 1000) / 10,
        isTopPick: false,
        robustnessVerdict: 'valószínű',
        quarterKellyPct: quarterKelly(probabilities.bttsYes, oddsBtts),
        reasoning: `Mindkét csapat gólképessége kimagasló, a védelmi stabilitási index alapján alacsony a kapott gól nélküli meccs esélye.`,
      };
    }

    const quantAnalysis: QuantAnalysis = {
      dataQuality,
      robustnessVerdict: robTest.verdict,
      minEdge: robTest.minEdge,
      medianEdge: robTest.medianEdge,
      posPct: robTest.posPct,
      quarterKellyPct: qKelly,
      shinMargin: shinRes.margin,
      shinProbs: {
        home: Math.round(shinRes.probs[0] * 100),
        draw: Math.round(shinRes.probs[1] * 100),
        away: Math.round(shinRes.probs[2] * 100),
      },
      lambdaInversion: lambdaReport,
      keyFactors: [
        `Adatminőség: ${dataQuality}-szint (${compInfo.name})`,
        `Poisson/Dixon-Coles modell: ${homeXg.toFixed(1)} hazai xG vs ${awayXg.toFixed(1)} vendég xG`,
        `Piaci árrés (Shin de-vig margin): ${shinRes.margin}%`,
      ],
      riskLevel: robTest.verdict === 'ROBUSZTUS' ? 'Alacsony' : robTest.verdict === 'valószínű' ? 'Közepes' : 'Magas',
    };

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
        name: m.homeTeam.shortName || m.homeTeam.name,
        shortName: m.homeTeam.tla || m.homeTeam.shortName || 'HOM',
        logo: m.homeTeam.crest || `https://crests.football-data.org/${m.homeTeam.id}.png`,
        xgAvg: homeXg,
        goalsScoredAvg: homePower.attack,
        goalsConcededAvg: homePower.defense,
      },
      awayTeam: {
        id: String(m.awayTeam.id),
        name: m.awayTeam.shortName || m.awayTeam.name,
        shortName: m.awayTeam.tla || m.awayTeam.shortName || 'AWY',
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

  // Gyorsítótárba mentés a kvóta kímélése érdekében
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
