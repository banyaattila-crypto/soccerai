export type MatchStatus =
  | 'UPCOMING'
  | 'LIVE'
  | 'FINISHED'
  | 'POSTPONED'
  | 'CANCELLED'
  | 'SUSPENDED';

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
  | 'HOME_WIN'
  | 'DRAW'
  | 'AWAY_WIN'
  | 'BTTS'
  | 'BTTS_YES'
  | 'BTTS_NO'
  | 'OVER_15'
  | 'UNDER_15'
  | 'OVER_25'
  | 'UNDER_25'
  | 'OVER_35'
  | 'UNDER_35'
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
  /** Kerekítetlen valószínűségek (%), két tizedesre: az EV és a Kelly ezekkel számol, a kijelzés az egész számokkal. */
  exact?: {
    homeWin: number;
    draw: number;
    awayWin: number;
    bttsYes: number;
    over15: number;
    over25: number;
    over35: number;
    fhOver05: number;
    bttsAndOver25: number;
  };
}

export interface MatchOdds {
  home: number;
  draw: number;
  away: number;
  bttsYes: number;
  over25: number;
  under25?: number;
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
  utcDate?: string; // Teljes ISO 8601 UTC időbélyeg (kezdési időpont auditáláshoz)
  status: MatchStatus;
  /** true: a forrás még "élőnek" jelzi, de a kezdés óta eltelt idő alapján már véget ért (a státusz nem módosul, az elszámolás a forrás lefújás-jelentésére vár) */
  liveStale?: boolean;
  minute?: number;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number;
  awayScore?: number;
  homeHalfTimeScore?: number;
  awayHalfTimeScore?: number;
  /** A megjelenített valószínűségek: valós szorzónál az 1X2 és az O/U 2.5 piaci (de-vigelt) alapú, egyébként modell */
  probabilities: MarketProbabilities;
  /** A modell eredeti valószínűségei, ha a `probabilities` piaci alapú (probabilitySource = 'market') */
  modelProbabilities?: MarketProbabilities;
  probabilitySource?: 'model' | 'market';
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
    bookmakerName?: string;
    oddsExpiresAt?: string;
    isOddsExpired?: boolean;
    ttlMinutes?: number;
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
  expiresAt?: string;
  ttlMinutes?: number;
  isExpired?: boolean;
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
  market?: PickMarket;
  odds: number;
  probability: number;
  quarterKellyPct?: number;
  isRealOdds?: boolean;
  isSimulatedOdds?: boolean;
  bookmakerName?: string;
  oddsExpiresAt?: string;
  isExpired?: boolean;
  matchStatus?: MatchStatus;
  kickoffDate?: string;
  kickoffTime?: string;
}

export type TrackedBetStatus = 'PENDING' | 'WON' | 'LOST' | 'VOID';

export interface TrackedBetItem {
  matchId: string;
  matchTitle: string;
  marketLabel: string;
  market?: PickMarket;
  odds: number;
  probability: number;
  quarterKellyPct?: number;
  homeScore?: number;
  awayScore?: number;
  homeHalfTimeScore?: number;
  awayHalfTimeScore?: number;
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

// ==========================================
// PREDICITON PROVENANCE & AUDIT LOG TÍPUSOK
// ==========================================

export type PredictionProvenance =
  | 'VERIFIED_PRE_MATCH'    // Kezdőrúgás előtt naplózva, megváltoztathatatlan audit bejegyzés
  | 'UNVERIFIED_HISTORICAL'; // Kezdés után/utólag beérkezett vagy korábbi nem auditált mérkőzés

/**
 * Piaci pillanatkép egy naplózott tipphez (CLV-méréshez). A kivonatban (auditHash) nem szerepel: a napló
 * a tipp rögzítése után is kiegészülhet a záró pillanatképpel, a tipp (piac, valószínűség, szorzó) viszont nem változik.
 */
export interface AuditMarketSnapshot {
  /** A tipp kimenetelének de-vigelt piaci (fair) valószínűsége, % */
  fairProb: number;
  /** A legjobb elérhető szorzó erre a kimenetelre a pillanatkép idején */
  odds?: number;
  bookmaker?: string;
  seenAt: string; // ISO időpont
}

export interface PredictionAuditRecord {
  id: string;               // pl. audit-m1234-1718000000
  matchId: string;
  loggedAt: string;         // ISO időpont, amikor a predikció fagyasztásra került
  kickoffDate: string;      // YYYY-MM-DD
  kickoffTime: string;      // HH:mm
  kickoffTimestamp: number; // UTC vagy helyi epoch milliszekundum
  utcDate?: string;
  leagueId: string;
  leagueName: string;
  leagueCountry?: string;
  leagueFlag?: string;
  homeTeam: {
    name: string;
    logo?: string;
    shortName?: string;
  };
  awayTeam: {
    name: string;
    logo?: string;
    shortName?: string;
  };
  pick: {
    market: PickMarket;
    marketLabel: string;
    probability: number;
    odds: number;
    confidence?: number;
    expectedValue: number;
    quarterKellyPct?: number;
    isSimulatedOdds?: boolean;
    reasoning?: string;
  };
  modelSnapshot?: {
    probabilities?: MarketProbabilities;
    robustnessVerdict?: string;
    dataQuality?: 'A' | 'B' | 'C';
  };
  provenance: PredictionProvenance;
  auditHash: string;        // Integritás ellenőrző aláírás
  settled: boolean;         // Lezárult-e már a meccs
  settledAt?: string;
  homeScore?: number;
  awayScore?: number;
  homeHalfTimeScore?: number;
  awayHalfTimeScore?: number;
  /** Piaci pillanatkép a naplózáskor (csak valós szorzónál, 1X2 és Over/Under 2.5 piacon) */
  marketAtLog?: AuditMarketSnapshot;
  /** A kezdés előtti legutolsó ismert piaci pillanatkép (a záró fair ár közelítése) */
  marketClose?: AuditMarketSnapshot;
  /**
   * Fogadási protokoll bélyeg a naplózás idejéről (lásd services/bettingProtocol.ts): a verzió, a szabály
   * ujjlenyomata és a modell–piac eltérés (százalékpont). A protokoll-tipp döntés ebből és a rekordból újraszámolható.
   */
  protocol?: { version: number; fingerprint: string; gapPp: number | null };
  status: 'PENDING' | 'WON' | 'LOST' | 'VOID';
  profit: number;           // Forintban alaptéttel számolva (pl. 10 000 Ft alapon)
  roi: number;              // % megtérülés az adott fogadásra
}

export interface VerifiedAuditStats {
  totalAudited: number;
  pendingCount: number;
  settledCount: number;
  wonCount: number;
  lostCount: number;
  winRate: number;          // %
  totalStaked: number;      // Ft
  totalReturned: number;    // Ft
  netProfit: number;        // Ft
  roi: number;              // %
  avgWinningOdds: number;
}


