import type { AuditMarketSnapshot, Match, PredictionAuditRecord } from '../types/football';
import { blendedMarketPct, marketFairFromBookmakers } from './marketBlend';

/**
 * CLV (closing line value): a naplózott tipp szorzója a záró, de-vigelt piaci (fair) valószínűséghez mérve.
 *   CLV = szorzó · záró fair valószínűség − 1
 * A backtest ugyanezt méri (nyitó szorzó · záró fair − 1). Tartósan pozitív CLV az egyetlen megbízható jele
 * annak, hogy a tippek a piacnál jobb áron készülnek; az eredmény (nyert/vesztett) rövid távon zaj.
 */

/** A "záró" pillanatkép csak akkor érvényes, ha legfeljebb ennyivel a kezdés előtt készült... */
export const CLOSE_WINDOW_MS = 3 * 60 * 60 * 1000;
/** ...és legalább ennyivel a naplózás után (különben nem hordoz információt). */
export const MIN_CLOSE_GAP_MS = 15 * 60 * 1000;

export const CLV_MIN_SAMPLES_VERDICT = 50;
export const CLV_MIN_SAMPLES_EDGE = 100;

const BEST_ODDS_KEY: Record<string, 'home' | 'draw' | 'away' | 'over25' | 'under25'> = {
  '1': 'home',
  HOME_WIN: 'home',
  X: 'draw',
  DRAW: 'draw',
  '2': 'away',
  AWAY_WIN: 'away',
  OVER_25: 'over25',
  UNDER_25: 'under25',
};

/**
 * Piaci pillanatkép a tipp piacára a mérkőzés érvényes (nem lejárt) valós szorzóiból.
 * Csak az 1X2 és az Over/Under 2.5 piacra van piaci referencia; egyébként (vagy szimulált/lejárt odds esetén) undefined.
 */
export function marketSnapshotForPick(
  match: Pick<Match, 'realOdds' | 'probabilities' | 'modelProbabilities'>,
  market: string,
  nowMs: number
): AuditMarketSnapshot | undefined {
  const odds = match.realOdds;
  if (!odds || odds.isExpired) return undefined;
  if (odds.expiresAt) {
    const exp = Date.parse(odds.expiresAt);
    if (!isNaN(exp) && exp < nowMs) return undefined;
  }
  const key = BEST_ODDS_KEY[market];
  if (!key) return undefined;
  const fair = marketFairFromBookmakers(odds.bookmakers);
  const p = match.modelProbabilities ?? match.probabilities;
  // Súly nélküli (tisztán piaci) valószínűség: a modell értékei nem számítanak
  const pct = blendedMarketPct(market, { home: p.homeWin, draw: p.draw, away: p.awayWin, over25: p.over25 }, fair, 0, 0);
  if (pct === null || !(pct > 0)) return undefined;
  const best = odds.bestOdds[key];
  return {
    fairProb: Math.round(pct * 100) / 100,
    odds: best?.odd,
    bookmaker: best?.bookmaker,
    seenAt: new Date(nowMs).toISOString(),
  };
}

/** Importált (nem megbízható) pillanatkép ellenőrzése: csak értelmes számokkal és időbélyeggel marad meg. */
export function sanitizeSnapshot(x: unknown): AuditMarketSnapshot | undefined {
  if (!x || typeof x !== 'object') return undefined;
  const o = x as Record<string, unknown>;
  const fair = o.fairProb;
  if (typeof fair !== 'number' || !isFinite(fair) || fair <= 0 || fair >= 100) return undefined;
  if (typeof o.seenAt !== 'string' || isNaN(Date.parse(o.seenAt))) return undefined;
  const odds = typeof o.odds === 'number' && isFinite(o.odds) && o.odds > 1 ? o.odds : undefined;
  const bookmaker = typeof o.bookmaker === 'string' ? o.bookmaker.slice(0, 60) : undefined;
  return { fairProb: fair, odds, bookmaker, seenAt: o.seenAt };
}

/** A záró pillanatkép érvényes-e a rekordhoz (időablak + legalább MIN_CLOSE_GAP a naplózás után). */
export function isValidClose(record: PredictionAuditRecord): boolean {
  const close = record.marketClose;
  if (!close) return false;
  const seen = Date.parse(close.seenAt);
  const logged = Date.parse(record.loggedAt);
  if (isNaN(seen) || isNaN(logged)) return false;
  if (seen > record.kickoffTimestamp) return false;
  if (seen < record.kickoffTimestamp - CLOSE_WINDOW_MS) return false;
  return seen - logged >= MIN_CLOSE_GAP_MS;
}

export interface RecordClv {
  /** CLV a záró fair árhoz, % */
  clvPct: number;
  /** Ár-előny a naplózáskor a piaci konszenzushoz (a legjobb bukméker kiválasztása), % */
  shopPct: number;
  /** A piac elmozdulása a tipp irányába a naplózás és a zárás között, relatív % */
  driftPct: number;
}

/** Egy rekord CLV-je; null, ha szimulált az odds, nincs piaci pillanatkép, vagy a zárás érvénytelen. */
export function computeRecordClv(record: PredictionAuditRecord): RecordClv | null {
  if (record.pick.isSimulatedOdds !== false) return null;
  const atLog = record.marketAtLog;
  const close = record.marketClose;
  if (!atLog || !close || !isValidClose(record)) return null;
  if (!(record.pick.odds > 1) || !(atLog.fairProb > 0) || !(close.fairProb > 0)) return null;
  return {
    clvPct: (record.pick.odds * (close.fairProb / 100) - 1) * 100,
    shopPct: (record.pick.odds * (atLog.fairProb / 100) - 1) * 100,
    driftPct: (close.fairProb / atLog.fairProb - 1) * 100,
  };
}

export type ClvVerdict = 'no_data' | 'insufficient' | 'unproven' | 'edge_likely' | 'negative';

export interface ClvStats {
  /** CLV-vel rendelkező rekordok száma */
  n: number;
  meanClvPct: number;
  seClvPct: number;
  ci95LowPct: number;
  ci95HighPct: number;
  positiveShare: number;
  meanShopPct: number;
  meanDriftPct: number;
  verdict: ClvVerdict;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/**
 * CLV-statisztika a rekordokból, 95%-os (normál közelítésű) konfidencia-intervallummal.
 * Ítélet: kevés minta (< 50) -> insufficient; legalább 100 minta és a CI alsó széle > 0 -> edge_likely;
 * legalább 50 minta és a CI felső széle < 0 -> negative; egyébként unproven.
 */
export function getClvStats(records: PredictionAuditRecord[]): ClvStats {
  return clvStatsFromSamples(records.map(computeRecordClv).filter((x): x is RecordClv => x !== null));
}

/** CLV-statisztika tetszőleges mintákból (az app naplójából és a szerveroldali követőből is). */
export function clvStatsFromSamples(items: RecordClv[]): ClvStats {
  const n = items.length;
  if (n === 0) {
    return {
      n: 0,
      meanClvPct: 0,
      seClvPct: 0,
      ci95LowPct: 0,
      ci95HighPct: 0,
      positiveShare: 0,
      meanShopPct: 0,
      meanDriftPct: 0,
      verdict: 'no_data',
    };
  }
  const clvs = items.map((x) => x.clvPct);
  const m = mean(clvs);
  const variance = n > 1 ? clvs.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1) : 0;
  const se = Math.sqrt(variance / n);
  const low = m - 1.96 * se;
  const high = m + 1.96 * se;
  let verdict: ClvVerdict = 'unproven';
  if (n < CLV_MIN_SAMPLES_VERDICT) verdict = 'insufficient';
  else if (n >= CLV_MIN_SAMPLES_EDGE && low > 0) verdict = 'edge_likely';
  else if (high < 0) verdict = 'negative';
  return {
    n,
    meanClvPct: m,
    seClvPct: se,
    ci95LowPct: low,
    ci95HighPct: high,
    positiveShare: clvs.filter((c) => c > 0).length / n,
    meanShopPct: mean(items.map((x) => x.shopPct)),
    meanDriftPct: mean(items.map((x) => x.driftPct)),
    verdict,
  };
}

/** Valós (nem szimulált) szorzón rögzített, lezárt tippek: darabszám és ROI (%), az alaptét arányában. */
export function getRealOddsRoi(records: PredictionAuditRecord[]): { n: number; roiPct: number; settledN: number } {
  const real = records.filter((r) => r.provenance === 'VERIFIED_PRE_MATCH' && r.pick.isSimulatedOdds === false);
  const settled = real.filter((r) => r.settled && r.status !== 'VOID');
  if (settled.length === 0) return { n: real.length, roiPct: 0, settledN: 0 };
  const roi = settled.reduce((a, r) => a + r.roi, 0) / settled.length;
  return { n: real.length, roiPct: roi, settledN: settled.length };
}
