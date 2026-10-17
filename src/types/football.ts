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
    market: '1' | 'X' | '2' | 'BTTS_YES' | 'OVER_25' | 'OVER_15' | 'FH_OVER_05';
    marketLabel: string;
    probability: number;
    odds: number;
    confidence: number; // 1-10
    reasoning: string;
    isTopPick?: boolean;
    expectedValue: number; // pl. +14.2% EV
  };
  h2h?: HeadToHead[];
  venue?: string;
  weather?: string;
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

export interface BetSlipItem {
  matchId: string;
  matchTitle: string;
  marketLabel: string;
  odds: number;
  probability: number;
}
