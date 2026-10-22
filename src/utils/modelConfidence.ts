import { Match, PickMarket } from '../types/football';
import { calculateDixonColesMatrix, extractMarketsFromMatrix } from '../services/predictionEngine';

/**
 * Őszinte adatminőség-leírás: azt mutatja, MIVEL számolt valójában a modell,
 * nem csak egy A/B/C betűt. (Az A/B/C minősítés a `dataQuality` mezőben marad.)
 */
export type DataBasis = 'season' | 'partial' | 'thin' | 'prior';

export interface DataQualityInfo {
  basis: DataBasis;
  /** Rövid felirat a kártyákra */
  shortLabel: string;
  /** Hosszabb magyarázat tooltiphez / modalhoz */
  description: string;
  /** Tailwind szövegszín-osztály */
  toneClass: string;
  sampleSize?: number;
}

export const SEASON_SAMPLE_THRESHOLD = 100;
export const PARTIAL_SAMPLE_THRESHOLD = 30;

export function getDataQualityInfo(match: Pick<Match, 'quantAnalysis'>): DataQualityInfo {
  const ratings = match.quantAnalysis?.dixonColesRatings;
  const sampleSize = ratings?.sampleSize;

  if (!ratings?.isEmpiricallyFitted || sampleSize === undefined) {
    return {
      basis: 'prior',
      shortLabel: 'Ligaátlag + prior',
      description:
        'Nincs illesztett csapaterősség: a várható gólok a liga átlagából és (ha van) a kézzel megadott klub-priorból származnak. A valószínűségek tájékoztató jellegűek.',
      toneClass: 'text-amber-300',
    };
  }
  if (sampleSize >= SEASON_SAMPLE_THRESHOLD) {
    return {
      basis: 'season',
      shortLabel: `Szezon-illesztés (${sampleSize} meccs)`,
      description: `A csapaterősség ${sampleSize} lejátszott mérkőzésből illesztett Dixon–Coles modellből származik.`,
      toneClass: 'text-emerald-300',
      sampleSize,
    };
  }
  if (sampleSize >= PARTIAL_SAMPLE_THRESHOLD) {
    return {
      basis: 'partial',
      shortLabel: `Részleges illesztés (${sampleSize} meccs)`,
      description: `Az illesztés ${sampleSize} meccsen alapul. Ez még kevés ahhoz, hogy a csapatonkénti erősség megbízható legyen; a becslés a ligaátlag felé húz.`,
      toneClass: 'text-teal-300',
      sampleSize,
    };
  }
  return {
    basis: 'thin',
    shortLabel: `Vékony minta (${sampleSize} meccs)`,
    description: `Csak ${sampleSize} mérkőzés áll az illesztés mögött: a csapatok erőssége gyakorlatilag a ligaátlag. Az esélyek ilyenkor alig különböznek egy ligaátlag-becsléstől.`,
    toneClass: 'text-amber-300',
    sampleSize,
  };
}

export interface ProbabilityRange {
  low: number;
  high: number;
  /** A λ relatív bizonytalansága, amellyel a sáv készült */
  relativeLambdaError: number;
}

const ASSUMED_LEAGUE_TEAMS = 20;
const PRIOR_PSEUDO_MATCHES = 3;
const MAX_REL_ERROR = 0.25;

/**
 * A várható gól (λ) becsült relatív hibája az illesztési mintából.
 * Heurisztika (nem konfidencia-intervallum): ~ 0,9 / sqrt(csapatonkénti meccs + prior).
 */
export function lambdaRelativeError(sampleSize?: number): number {
  if (sampleSize === undefined || sampleSize <= 0) return MAX_REL_ERROR;
  const perTeam = (sampleSize * 2) / ASSUMED_LEAGUE_TEAMS;
  return Math.min(MAX_REL_ERROR, 0.9 / Math.sqrt(perTeam + PRIOR_PSEUDO_MATCHES));
}

function marketProbability(
  mk: ReturnType<typeof extractMarketsFromMatrix>,
  market: PickMarket
): number | undefined {
  switch (market) {
    case '1':
    case 'HOME_WIN':
      return mk.home;
    case 'X':
    case 'DRAW':
      return mk.draw;
    case '2':
    case 'AWAY_WIN':
      return mk.away;
    case 'BTTS':
    case 'BTTS_YES':
      return mk.btts;
    case 'BTTS_NO':
      return 1 - mk.btts;
    case 'OVER_15':
      return mk.over15;
    case 'UNDER_15':
      return 1 - mk.over15;
    case 'OVER_25':
      return mk.over25;
    case 'UNDER_25':
      return 1 - mk.over25;
    case 'OVER_35':
      return mk.over35;
    case 'UNDER_35':
      return 1 - mk.over35;
    case 'BTTS_AND_OVER25':
      return mk.bttsAndOver25;
    default:
      return undefined; // pl. félidős piac: nincs egyszerű mátrix-leképezés
  }
}

/**
 * Érzékenységi sáv: hogyan mozog a piac valószínűsége, ha mindkét λ a becsült
 * relatív hibával (±) eltér. Szándékosan "forgatókönyv-sáv", nem statisztikai CI.
 */
export function getProbabilityRange(
  match: Pick<Match, 'homeTeam' | 'awayTeam' | 'quantAnalysis'>,
  market: PickMarket
): ProbabilityRange | undefined {
  const lh = match.homeTeam.xgAvg;
  const la = match.awayTeam.xgAvg;
  if (!lh || !la) return undefined;

  const ratings = match.quantAnalysis?.dixonColesRatings;
  const rho = ratings?.rho ?? -0.13;
  const s = lambdaRelativeError(ratings?.isEmpiricallyFitted ? ratings.sampleSize : undefined);

  const values: number[] = [];
  for (const fh of [1 - s, 1, 1 + s]) {
    for (const fa of [1 - s, 1, 1 + s]) {
      const mat = calculateDixonColesMatrix(Math.max(0.2, lh * fh), Math.max(0.2, la * fa), rho);
      const p = marketProbability(extractMarketsFromMatrix(mat), market);
      if (p === undefined) return undefined;
      values.push(p * 100);
    }
  }
  return {
    low: Math.floor(Math.min(...values)),
    high: Math.ceil(Math.max(...values)),
    relativeLambdaError: s,
  };
}
