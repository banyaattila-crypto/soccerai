/**
 * Piaccal súlyozás: a modell és a de-vigelt bukmékeri piac valószínűségeinek logaritmikus keverése.
 *
 * Miért: az audit szerint a nyers modell-EV hatékony piacon zaj (a modell +18..+47% élt állít, a valós
 * hozam kb. -margin). A záró piac a legjobb ismert előrejelző, a modell csak kiegészítő információ.
 * A keverési súlyt a valós, walk-forward backtest hangolja (`scripts/backtest.ts`).
 *
 * Logaritmikus (geometriai) keverés: p_i ∝ model_i^w · market_i^(1-w), normalizálva.
 * w = 1: tiszta modell; w = 0: tiszta piac.
 */

import { devigShin } from './predictionEngine';

/**
 * A modell súlya a 3-utas (1X2) keverékben. A backtest (`src/data/backtestReport.json`) hangolta;
 * a `scripts/backtest.ts` újrafuttatásakor frissítendő.
 */
export const MARKET_BLEND_MODEL_WEIGHT_1X2 = 0;

/** A modell súlya a Over/Under 2.5 (2-utas) keverékben (backtest által hangolt). */
export const MARKET_BLEND_MODEL_WEIGHT_TOTALS = 0;

export function normalizeProbs(p: number[]): number[] {
  const s = p.reduce((a, b) => a + b, 0);
  return s > 0 ? p.map((x) => x / s) : p.map(() => 1 / p.length);
}

/**
 * Logaritmikus keverés. A valószínűségek 0..1 közötti törtek; a kimenet összege 1.
 */
export function blendLogPool(model: number[], market: number[], wModel: number): number[] {
  if (model.length !== market.length) {
    throw new Error('A modell és a piac valószínűség-vektora azonos hosszú kell legyen.');
  }
  const w = Math.min(1, Math.max(0, wModel));
  const eps = 1e-9;
  const raw = model.map((m, i) => Math.pow(Math.max(eps, m), w) * Math.pow(Math.max(eps, market[i]), 1 - w));
  return normalizeProbs(raw);
}

/**
 * Bukmékeri szorzókból de-vigelt (Shin) valószínűségek, 0..1 törtek. Érvénytelen szorzónál null.
 */
export function marketProbsFromOdds(odds: number[]): number[] | null {
  if (odds.some((o) => !Number.isFinite(o) || o <= 1)) return null;
  return devigShin(odds).probs;
}

/**
 * 1X2 keverés valós szorzókból. A kimenet 0..1 törtek [hazai, döntetlen, vendég].
 */
export function blendOutcome1x2(
  modelPct: { home: number; draw: number; away: number },
  odds: { home: number; draw: number; away: number },
  wModel: number = MARKET_BLEND_MODEL_WEIGHT_1X2
): number[] | null {
  const market = marketProbsFromOdds([odds.home, odds.draw, odds.away]);
  if (!market) return null;
  return blendLogPool([modelPct.home / 100, modelPct.draw / 100, modelPct.away / 100], market, wModel);
}

/**
 * Over/Under keverés. A kimenet [over, under] 0..1 törtek.
 */
export function blendTotals(
  overModelPct: number,
  odds: { over: number; under: number },
  wModel: number = MARKET_BLEND_MODEL_WEIGHT_TOTALS
): number[] | null {
  const market = marketProbsFromOdds([odds.over, odds.under]);
  if (!market) return null;
  return blendLogPool([overModelPct / 100, 1 - overModelPct / 100], market, wModel);
}

// ---------------------------------------------------------------------------
// Piaci referencia valós bukmékeri szorzókból
// ---------------------------------------------------------------------------

export interface BookmakerOdds {
  name: string;
  home?: number;
  draw?: number;
  away?: number;
  over25?: number;
  under25?: number;
}

/** A piac de-vigelt, "fair" valószínűségei (0..1). */
export interface MarketFair {
  /** [hazai, döntetlen, vendég] */
  p1x2?: number[];
  pOver25?: number;
}

function averageProbs(list: number[][]): number[] {
  const n = list[0].length;
  const sum: number[] = Array.from({ length: n }, () => 0);
  for (const p of list) p.forEach((x, i) => (sum[i] += x));
  return normalizeProbs(sum.map((x) => x / list.length));
}

/**
 * Piaci referencia a bukmékerek szorzóiból. Az éles (sharp) Pinnacle elsőbbséget élvez;
 * ha nincs, a teljes soros bukmékerek de-vigelt valószínűségeinek átlaga a referencia.
 * A backtest szerint a modell a záró piacnál rosszabb, ezért az EV ehhez a referenciához mér.
 */
export function marketFairFromBookmakers(bookmakers: BookmakerOdds[]): MarketFair {
  const tri: { name: string; p: number[] }[] = [];
  const ou: { name: string; p: number[] }[] = [];
  for (const b of bookmakers) {
    if (b.home && b.draw && b.away) {
      const p = marketProbsFromOdds([b.home, b.draw, b.away]);
      if (p) tri.push({ name: b.name, p });
    }
    if (b.over25 && b.under25) {
      const p = marketProbsFromOdds([b.over25, b.under25]);
      if (p) ou.push({ name: b.name, p });
    }
  }
  const pick = (list: { name: string; p: number[] }[]) => {
    if (list.length === 0) return undefined;
    const pin = list.find((x) => /pinnacle/i.test(x.name));
    return pin ? pin.p : averageProbs(list.map((x) => x.p));
  };
  const t = pick(tri);
  const o = pick(ou);
  return { p1x2: t, pOver25: o ? o[0] : undefined };
}

/**
 * A piaccal súlyozott valószínűség (%) az EV-hez és a Kelly-hez. Csak olyan piacra ad értéket, amelyhez van
 * piaci referencia (1X2, Over/Under 2.5). BTTS-re, kombinált és félidős piacra null: ott nincs mihez mérni,
 * a nyers modell-EV pedig a backtest szerint megbízhatatlan.
 */
export function blendedMarketPct(
  market: string,
  model: { home: number; draw: number; away: number; over25: number },
  fair: MarketFair | undefined,
  wTri: number = MARKET_BLEND_MODEL_WEIGHT_1X2,
  wTot: number = MARKET_BLEND_MODEL_WEIGHT_TOTALS
): number | null {
  if (!fair) return null;
  if ((market === '1' || market === 'HOME_WIN' || market === 'X' || market === 'DRAW' || market === '2' || market === 'AWAY_WIN') && fair.p1x2) {
    const b = blendLogPool([model.home / 100, model.draw / 100, model.away / 100], fair.p1x2, wTri);
    const idx = market === '1' || market === 'HOME_WIN' ? 0 : market === 'X' || market === 'DRAW' ? 1 : 2;
    return b[idx] * 100;
  }
  if ((market === 'OVER_25' || market === 'UNDER_25') && fair.pOver25 !== undefined) {
    const b = blendLogPool([model.over25 / 100, 1 - model.over25 / 100], [fair.pOver25, 1 - fair.pOver25], wTot);
    return (market === 'OVER_25' ? b[0] : b[1]) * 100;
  }
  return null;
}
