import { Match, PickMarket } from '../types/football';
import { calculateExpectedValue, quarterKelly } from './predictionEngine';
import { getRelativeDateStr } from '../utils/dateUtils';

export type ScannerPreset =
  | 'all'
  | 'best_ev'
  | 'ai_picks'
  | 'value_sweetspot'
  | 'over_25'
  | 'btts'
  | 'favorites'
  | 'half_time'
  | 'underdogs';

export type ScannerSortBy = 'ev' | 'prob' | 'odds' | 'kelly' | 'time';

export interface ScannedOpportunity {
  id: string;
  match: Match;
  market: PickMarket;
  marketLabel: string;
  category: '1X2' | 'GOALS' | 'BTTS' | 'HALF_TIME' | 'COMBO';
  probability: number; // 0..100 %
  odds: number;
  expectedValue: number; // pl. +12.5%
  quarterKellyPct: number; // pl. 2.4%
  isRealOdds: boolean;
  bookmakerName?: string;
  robustnessVerdict: 'ROBUSZTUS' | 'valószínű' | 'bizonytalan' | 'ELVETVE';
  reasoning?: string;
}

export interface LeagueRadarStat {
  leagueId: string;
  leagueName: string;
  leagueCountry: string;
  leagueFlag: string;
  matchCount: number;
  avgExpectedGoals: number;
  avgOver25Prob: number;
  avgBttsProb: number;
  avgHomeWinProb: number;
  topOver25Match?: string;
}

export interface ScannerFilterOptions {
  preset: ScannerPreset;
  minProb?: number;
  minOdds?: number;
  leagueId?: string; // 'ALL' vagy konkrét id
  dayFilter?: 'all' | 'today' | 'tomorrow' | 'yesterday';
  statusFilter?: 'open_only' | 'all' | 'finished';
  sortBy?: ScannerSortBy;
  searchQuery?: string;
}

/**
 * Kinyeri az összes fogadási lehetőséget a mérkőzésekből,
 * figyelembe véve a valós Pinnacle/Bet365 bukmékeri szorzókat ha elérhetők.
 */
export function extractOpportunitiesFromMatches(matches: Match[]): ScannedOpportunity[] {
  const opportunities: ScannedOpportunity[] = [];

  for (const m of matches) {
    const p = m.probabilities;
    const real = m.realOdds;
    const quant = m.quantAnalysis;
    const verdict = quant?.robustnessVerdict ?? 'valószínű';

    // 1. Hazai Győzelem (1)
    const homeOdd = real?.bestOdds.home?.odd ?? m.odds.home;
    const homeSource = real?.bestOdds.home?.bookmaker ?? (real ? 'Pinnacle' : undefined);
    const homeEv = calculateExpectedValue(p.homeWin, homeOdd);
    opportunities.push({
      id: `${m.id}_1`,
      match: m,
      market: '1',
      marketLabel: `${m.homeTeam.shortName || m.homeTeam.name} Győzelem (1)`,
      category: '1X2',
      probability: p.homeWin,
      odds: homeOdd,
      expectedValue: homeEv,
      quarterKellyPct: quarterKelly(p.homeWin, homeOdd),
      isRealOdds: Boolean(real?.bestOdds.home?.odd),
      bookmakerName: homeSource,
      robustnessVerdict: verdict,
      reasoning: `Modell esély: ${p.homeWin}%, bukmékeri szorzó: ${homeOdd.toFixed(2)}.`,
    });

    // 2. Döntetlen (X)
    const drawOdd = real?.bestOdds.draw?.odd ?? m.odds.draw;
    const drawSource = real?.bestOdds.draw?.bookmaker;
    const drawEv = calculateExpectedValue(p.draw, drawOdd);
    opportunities.push({
      id: `${m.id}_X`,
      match: m,
      market: 'X',
      marketLabel: 'Döntetlen (X)',
      category: '1X2',
      probability: p.draw,
      odds: drawOdd,
      expectedValue: drawEv,
      quarterKellyPct: quarterKelly(p.draw, drawOdd),
      isRealOdds: Boolean(real?.bestOdds.draw?.odd),
      bookmakerName: drawSource,
      robustnessVerdict: verdict,
      reasoning: `Döntetlen valószínűség: ${p.draw}%, szorzó: ${drawOdd.toFixed(2)}.`,
    });

    // 3. Vendég Győzelem (2)
    const awayOdd = real?.bestOdds.away?.odd ?? m.odds.away;
    const awaySource = real?.bestOdds.away?.bookmaker;
    const awayEv = calculateExpectedValue(p.awayWin, awayOdd);
    opportunities.push({
      id: `${m.id}_2`,
      match: m,
      market: '2',
      marketLabel: `${m.awayTeam.shortName || m.awayTeam.name} Győzelem (2)`,
      category: '1X2',
      probability: p.awayWin,
      odds: awayOdd,
      expectedValue: awayEv,
      quarterKellyPct: quarterKelly(p.awayWin, awayOdd),
      isRealOdds: Boolean(real?.bestOdds.away?.odd),
      bookmakerName: awaySource,
      robustnessVerdict: verdict,
      reasoning: `Modell esély: ${p.awayWin}%, bukmékeri szorzó: ${awayOdd.toFixed(2)}.`,
    });

    // 4. 2.5 Gól Felett (Over 2.5)
    const o25Odd = real?.bestOdds.over25?.odd ?? m.odds.over25;
    const o25Source = real?.bestOdds.over25?.bookmaker;
    const o25Ev = calculateExpectedValue(p.over25, o25Odd);
    opportunities.push({
      id: `${m.id}_OVER_25`,
      match: m,
      market: 'OVER_25',
      marketLabel: '2.5 Gól Felett',
      category: 'GOALS',
      probability: p.over25,
      odds: o25Odd,
      expectedValue: o25Ev,
      quarterKellyPct: quarterKelly(p.over25, o25Odd),
      isRealOdds: Boolean(real?.bestOdds.over25?.odd),
      bookmakerName: o25Source,
      robustnessVerdict: verdict,
      reasoning: `Gólvárakozás: ${p.over25}% Over 2.5 valószínűség.`,
    });

    // 5. 2.5 Gól Alatt (Under 2.5)
    const under25Prob = Math.max(1, 100 - p.over25);
    const u25Odd = real?.bestOdds.under25?.odd ??
      Math.max(1.25, Math.round(((1 / (under25Prob / 100)) / 1.05) * 100) / 100);
    const u25Source = real?.bestOdds.under25?.bookmaker;
    const u25Ev = calculateExpectedValue(under25Prob, u25Odd);
    opportunities.push({
      id: `${m.id}_UNDER_25`,
      match: m,
      market: 'UNDER_25',
      marketLabel: '2.5 Gól Alatt',
      category: 'GOALS',
      probability: under25Prob,
      odds: u25Odd,
      expectedValue: u25Ev,
      quarterKellyPct: quarterKelly(under25Prob, u25Odd),
      isRealOdds: Boolean(real?.bestOdds.under25?.odd),
      bookmakerName: u25Source,
      robustnessVerdict: verdict,
      reasoning: `Under 2.5 esély: ${under25Prob}%.`,
    });

    // 6. Mindkét Csapat Szerez Gólt (BTTS Igen)
    const bttsOdd = real?.bestOdds.bttsYes?.odd ?? m.odds.bttsYes;
    const bttsSource = real?.bestOdds.bttsYes?.bookmaker;
    const bttsEv = calculateExpectedValue(p.bttsYes, bttsOdd);
    opportunities.push({
      id: `${m.id}_BTTS_YES`,
      match: m,
      market: 'BTTS_YES',
      marketLabel: 'Mindkét Csapat Szerez Gólt (BTTS)',
      category: 'BTTS',
      probability: p.bttsYes,
      odds: bttsOdd,
      expectedValue: bttsEv,
      quarterKellyPct: quarterKelly(p.bttsYes, bttsOdd),
      isRealOdds: Boolean(real?.bestOdds.bttsYes?.odd),
      bookmakerName: bttsSource,
      robustnessVerdict: verdict,
      reasoning: `BTTS közös gól esély: ${p.bttsYes}%.`,
    });

    // 7. Első Félidő 0.5 Felett
    const fhOdd = Math.max(1.25, Math.round(((1 / (p.fhOver05 / 100)) / 1.05) * 100) / 100);
    const fhEv = calculateExpectedValue(p.fhOver05, fhOdd);
    opportunities.push({
      id: `${m.id}_FH_OVER_05`,
      match: m,
      market: 'FH_OVER_05',
      marketLabel: '1. Félidő 0.5 Gól Felett',
      category: 'HALF_TIME',
      probability: p.fhOver05,
      odds: fhOdd,
      expectedValue: fhEv,
      quarterKellyPct: quarterKelly(p.fhOver05, fhOdd),
      isRealOdds: false,
      robustnessVerdict: verdict,
      reasoning: `Korai gól esély az 1. félidőben: ${p.fhOver05}%.`,
    });

    // 8. Kiemelt Kombinált (BTTS & Over 2.5) ha a valószínűség legalább 40%
    const bttsOverProb = p.bttsAndOver25 ?? Math.round((p.bttsYes * p.over25) / 100);
    if (bttsOverProb >= 40) {
      const comboOdd = Math.max(1.65, Math.round(((1 / (bttsOverProb / 100)) / 1.05) * 100) / 100);
      const comboEv = calculateExpectedValue(bttsOverProb, comboOdd);
      opportunities.push({
        id: `${m.id}_BTTS_OVER25`,
        match: m,
        market: 'BTTS_AND_OVER25',
        marketLabel: 'BTTS & 2.5 Gól Felett',
        category: 'COMBO',
        probability: bttsOverProb,
        odds: comboOdd,
        expectedValue: comboEv,
        quarterKellyPct: quarterKelly(bttsOverProb, comboOdd),
        isRealOdds: false,
        robustnessVerdict: verdict,
        reasoning: `Közös Dixon-Coles gólmátrix esély: ${bttsOverProb}%.`,
      });
    }
  }

  return opportunities;
}

/**
 * Szűri és rendezi a fogadási lehetőségeket a kiválasztott opciók szerint.
 */
export function filterAndSortOpportunities(
  opportunities: ScannedOpportunity[],
  options: ScannerFilterOptions
): ScannedOpportunity[] {
  const {
    preset,
    minProb = 0,
    minOdds = 1.01,
    leagueId = 'ALL',
    dayFilter = 'all',
    statusFilter = 'open_only',
    sortBy = 'ev',
    searchQuery = '',
  } = options;

  let filtered = opportunities.filter((item) => {
    // 0. Státusz szűrés (Alapértelmezésben csak a fogadható UPCOMING és LIVE mérkőzések)
    if (statusFilter === 'open_only' && item.match.status === 'FINISHED') {
      return false;
    }
    if (statusFilter === 'finished' && item.match.status !== 'FINISHED') {
      return false;
    }

    // 1. Odds és valószínűségi alsó korlátok
    if (item.probability < minProb) return false;
    if (item.odds < minOdds) return false;

    // 2. Bajnokság szűrés
    if (leagueId !== 'ALL' && item.match.leagueId !== leagueId) {
      return false;
    }

    // 3. Nap szűrés
    if (dayFilter !== 'all') {
      const today = getRelativeDateStr(0);
      const tomorrow = getRelativeDateStr(1);
      const yesterday = getRelativeDateStr(-1);
      const matchDate = item.match.kickoffDate;
      if (dayFilter === 'today' && matchDate !== today) return false;
      if (dayFilter === 'tomorrow' && matchDate !== tomorrow) return false;
      if (dayFilter === 'yesterday' && matchDate !== yesterday) return false;
    }

    // 4. Keresési kifejezés (csapatnév vagy bajnokság)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchText = `${item.match.homeTeam.name} ${item.match.awayTeam.name} ${item.match.leagueName}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    // 5. Presetek szerinti szűrés
    switch (preset) {
      case 'best_ev':
        return item.expectedValue > 0;
      case 'ai_picks':
        return item.match.aiPick?.market === item.market;
      case 'value_sweetspot':
        return (
          item.odds >= 1.55 &&
          item.odds <= 2.45 &&
          (item.expectedValue > 0 || item.probability >= 48)
        );
      case 'over_25':
        return item.market === 'OVER_25';
      case 'btts':
        return item.market === 'BTTS_YES';
      case 'favorites':
        // Csak a valódi, játszható favoritok (kizárva az 1.10 - 1.35 mini-oddsokat)
        return (
          ((item.market === '1' && item.probability >= 52) ||
            (item.market === '2' && item.probability >= 50)) &&
          item.odds >= 1.45 &&
          item.odds <= 2.25
        );
      case 'half_time':
        return item.market === 'FH_OVER_05' && item.probability >= 68;
      case 'underdogs':
        return item.odds >= 2.5 && item.expectedValue >= 2.0;
      case 'all':
      default:
        return true;
    }
  });

  // Rendezés
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'ev':
        return b.expectedValue - a.expectedValue;
      case 'prob':
        return b.probability - a.probability;
      case 'odds':
        return b.odds - a.odds;
      case 'kelly':
        return b.quarterKellyPct - a.quarterKellyPct;
      case 'time':
        return (
          new Date(`${a.match.kickoffDate}T${a.match.kickoffTime}`).getTime() -
          new Date(`${b.match.kickoffDate}T${b.match.kickoffTime}`).getTime()
        );
      default:
        return b.expectedValue - a.expectedValue;
    }
  });

  return filtered;
}

/**
 * Számítja a ligák kvantitatív gól- és értékradar statisztikáit.
 */
export function computeLeagueRadarStats(matches: Match[]): LeagueRadarStat[] {
  const map: Record<
    string,
    {
      leagueId: string;
      leagueName: string;
      leagueCountry: string;
      leagueFlag: string;
      matches: Match[];
      sumXg: number;
      sumOver25: number;
      sumBtts: number;
      sumHomeWin: number;
      topMatch?: { title: string; over25: number };
    }
  > = {};

  for (const m of matches) {
    if (!map[m.leagueId]) {
      map[m.leagueId] = {
        leagueId: m.leagueId,
        leagueName: m.leagueName,
        leagueCountry: m.leagueCountry,
        leagueFlag: m.leagueFlag,
        matches: [],
        sumXg: 0,
        sumOver25: 0,
        sumBtts: 0,
        sumHomeWin: 0,
      };
    }

    const item = map[m.leagueId];
    item.matches.push(m);
    const xgTotal = (m.homeTeam.xgAvg || 1.45) + (m.awayTeam.xgAvg || 1.15);
    item.sumXg += xgTotal;
    item.sumOver25 += m.probabilities.over25;
    item.sumBtts += m.probabilities.bttsYes;
    item.sumHomeWin += m.probabilities.homeWin;

    if (!item.topMatch || m.probabilities.over25 > item.topMatch.over25) {
      item.topMatch = {
        title: `${m.homeTeam.shortName || m.homeTeam.name} - ${m.awayTeam.shortName || m.awayTeam.name}`,
        over25: m.probabilities.over25,
      };
    }
  }

  const result: LeagueRadarStat[] = Object.values(map).map((entry) => {
    const count = Math.max(1, entry.matches.length);
    return {
      leagueId: entry.leagueId,
      leagueName: entry.leagueName,
      leagueCountry: entry.leagueCountry,
      leagueFlag: entry.leagueFlag,
      matchCount: entry.matches.length,
      avgExpectedGoals: Math.round((entry.sumXg / count) * 10) / 10,
      avgOver25Prob: Math.round(entry.sumOver25 / count),
      avgBttsProb: Math.round(entry.sumBtts / count),
      avgHomeWinProb: Math.round(entry.sumHomeWin / count),
      topOver25Match: entry.topMatch ? `${entry.topMatch.title} (${entry.topMatch.over25}%)` : undefined,
    };
  });

  // Rendezés a legmagasabb várható gólátlag szerint csökkenő sorrendbe
  result.sort((a, b) => b.avgExpectedGoals - a.avgExpectedGoals);

  return result;
}
