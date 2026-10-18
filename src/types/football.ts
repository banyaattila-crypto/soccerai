export type MatchStatus = 'UPCOMING' | 'LIVE' | 'FINISHED';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  rank?: number;
  form?: ('W' | 'D' | 'L')[];
  xgAvg?: number;
  goalsScoredAvg?: number;
  goalsConcededAvg?: number;
}

export type PickMarket =
  | '1'
  | 'X'
  | '2'
  | 'BTTS_YES'
  | 'OVER_25'
  | 'UNDER_25'
  | 'OVER_15'
  | 'FH_OVER_05'
  | 'BTTS_AND_OVER25';

export interface MarketProbabilities {
  // 1X2
  homeWin: number; // pl. 62 (%)
  draw: number;    // pl. 22 (%)
  awayWin: number; // pl. 16 (%)
  
  // Gólok / BTTS
  bttsYes: number; // Mindkét csapat szerez gólt
  over15: number;  // 1.5 gól felett
  over25: number;  // 2.5 gól felett
  over35: number;  // 3.5 gól felett
  fhOver05: number; // Első félidő 0.5 felett
  bttsAndOver25?: number; // BTTS & 2.5 felett közvetlenül a gólmátrixból
}

export interface MatchOdds {
  home: number;
  draw: number;
  away: number;
  bttsYes: number;
  over25: number;
}

export interface HeadToHead {
  date: string;
  homeScore: number;
  awayScore: number;
  homeWinner: boolean | null;
}

export interface QuantAnalysis {
  dataQuality: 'A' | 'B' | 'C';
  robustnessVerdict: 'ROBUSZTUS' | 'valószínű' | 'bizonytalan' | 'ELVETVE';
  minEdge: number;
  medianEdge: number;
  posPct: number;
  quarterKellyPct: number;
  shinMargin: number;
  shinProbs?: { home: number; draw: number; away: number };
  lambdaInversion?: {
    marketLambda: number;
    beOver: number;
    beUnder: number;
    verdict: string;
  };
  keyFactors: string[];
  riskLevel: 'Alacsony' | 'Közepes' | 'Magas';
  dixonColesRatings?: {
    homeAttack: number;
    homeDefense: number;
    awayAttack: number;
    awayDefense: number;
    homeAdvantage: number;
    rho: number;
    isEmpiricallyFitted: boolean;
    sampleSize?: number;
  };
}

export interface Match {
  id: string;
  leagueId: string;
  leagueName: string;
  leagueCountry: string;
  leagueFlag: string;
  kickoffTime: string; // HH:mm
  kickoffDate: string; // YYYY-MM-DD
  status: MatchStatus;
  minute?: number;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number;
  awayScore?: number;
  probabilities: MarketProbabilities;
  odds: MatchOdds;
  aiPick?: {
    market: PickMarket;
    marketLabel: string;
    probability: number;
    odds: number;
    confidence: number; // 1-10
    reasoning: string;
    isTopPick?: boolean;
    expectedValue: number; // pl. +14.2% EV (valós piaci oddsnál) vagy szimulált árrés
    robustnessVerdict?: 'ROBUSZTUS' | 'valószínű' | 'bizonytalan' | 'ELVETVE';
    quarterKellyPct?: number;
    isSimulatedOdds?: boolean;
  };
  quantAnalysis?: QuantAnalysis;
  h2h?: HeadToHead[];
  venue?: string;
  weather?: string;
  apiSportsFixtureId?: number;
  realOdds?: FixtureRealOdds;
}

export interface BookmakerOddsItem {
  name: string;
  home?: number;
  draw?: number;
  away?: number;
  over25?: number;
  under25?: number;
  bttsYes?: number;
  bttsNo?: number;
  margin?: number; // Bukméker árrés (%)
}

export interface FixtureRealOdds {
  fixtureId: number;
  updatedAt: string;
  bookmakers: BookmakerOddsItem[];
  pinnacle?: BookmakerOddsItem;
  bet365?: BookmakerOddsItem;
  bestOdds: {
    home?: { odd: number; bookmaker: string };
    draw?: { odd: number; bookmaker: string };
    away?: { odd: number; bookmaker: string };
    over25?: { odd: number; bookmaker: string };
    under25?: { odd: number; bookmaker: string };
    bttsYes?: { odd: number; bookmaker: string };
  };
}

export interface League {
  id: string;
  name: string;
  country: string;
  flag: string;
  priority: number;
}

export type DayFilter = 'yesterday' | 'today' | 'tomorrow';
export type ViewMode = 'league' | 'time';
export type SignalFilter = 'all' | 'strong_only' | 'value_only';
export type FocusMarket = 'ALL' | 'OVER_25' | 'BTTS' | '1X2' | 'FH_OVER_05' | 'OVER_15';

export interface BetSlipItem {
  matchId: string;
  matchTitle: string;
  marketLabel: string;
  odds: number;
  probability: number;
  quarterKellyPct?: number;
}

export type TrackedBetStatus = 'PENDING' | 'WON' | 'LOST' | 'VOID';

export interface TrackedBetItem {
  matchId: string;
  matchTitle: string;
  marketLabel: string;
  odds: number;
  probability: number;
  quarterKellyPct?: number;
  homeScore?: number;
  awayScore?: number;
  isWon?: boolean;
}

export interface TrackedBet {
  id: string;
  createdAt: string; // ISO dátum formátum
  stake: number; // Ft
  totalOdds: number;
  potentialWin: number; // Ft
  status: TrackedBetStatus;
  items: TrackedBetItem[];
  notes?: string;
  settledAt?: string;
  netProfit?: number; // WON: potentialWin - stake, LOST: -stake, VOID: 0
}

export interface BankrollConfig {
  initialBankroll: number; // Ft
  currency: string;
}

export interface BankrollSummary {
  initialBankroll: number;
  currentBankroll: number;
  totalStaked: number;
  netProfit: number;
  roiPct: number;
  totalBets: number;
  wonBets: number;
  lostBets: number;
  pendingBets: number;
  voidBets: number;
  winRate: number; // %
  avgOdds: number;
  avgStake: number;
}

