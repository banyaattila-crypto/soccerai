import type { Match } from '../types/football';

/**
 * Modell–piac eltérés jelzése. A walk-forward backtest (docs/backtest-disagreement.md, 3504 meccs, 5 liga) szerint:
 *   eltérés 0–3 pp: nincs különbség a pontosságban,
 *   5–8 pp: a piac meccsenként 0,016 log-loss-szal pontosabb (±0,005),
 *   8–12 pp: 0,025 (±0,008),
 *   12+ pp: 0,103 (±0,015), és a meccsek 66%-ában a piac a pontosabb.
 * Az eltérés tehát a modell hibájának jele, nem rejtett értéké.
 */
export const MARKET_GAP_WARN_PP = 5;
export const MARKET_GAP_STRONG_PP = 12;

export type MarketGapLevel = 'none' | 'warn' | 'strong';

export interface MarketGapInfo {
  /** A legnagyobb 1X2 eltérés a modell és a piac között, százalékpontban */
  pp: number;
  level: MarketGapLevel;
  /** A kimenetel, ahol a legnagyobb az eltérés, és az iránya (a modell magasabbnak vagy alacsonyabbnak látja) */
  outcome: '1' | 'X' | '2';
  modelHigher: boolean;
  label: string;
  tooltip: string;
}

export function marketGapLevel(pp: number): MarketGapLevel {
  if (pp >= MARKET_GAP_STRONG_PP) return 'strong';
  if (pp >= MARKET_GAP_WARN_PP) return 'warn';
  return 'none';
}

/**
 * A modell és a piaci ár közti legnagyobb 1X2 eltérés. Csak akkor van értéke, ha a megjelenített valószínűség
 * piaci alapú (valós szorzó), és a modell eredeti értékei megvannak.
 */
export function getMarketGap(
  match: Pick<Match, 'probabilities' | 'modelProbabilities' | 'probabilitySource'>
): MarketGapInfo | null {
  if (match.probabilitySource !== 'market' || !match.modelProbabilities) return null;
  const model = match.modelProbabilities;
  const market = match.probabilities;
  const diffs: { outcome: '1' | 'X' | '2'; d: number }[] = [
    { outcome: '1', d: model.homeWin - market.homeWin },
    { outcome: 'X', d: model.draw - market.draw },
    { outcome: '2', d: model.awayWin - market.awayWin },
  ];
  const top = diffs.reduce((a, b) => (Math.abs(b.d) > Math.abs(a.d) ? b : a));
  const pp = Math.round(Math.abs(top.d) * 10) / 10;
  const level = marketGapLevel(pp);
  const dir = top.d > 0 ? 'magasabbnak' : 'alacsonyabbnak';
  return {
    pp,
    level,
    outcome: top.outcome,
    modelHigher: top.d > 0,
    label:
      level === 'none'
        ? 'Modell ≈ piac'
        : level === 'strong'
        ? `Modell ≠ piac: ${pp} pp`
        : `Modell eltér a piactól: ${pp} pp`,
    tooltip:
      `A modell a(z) ${top.outcome} kimenetelt ${pp} százalékponttal ${dir} látja, mint a piac. ` +
      'A backtest szerint ilyen eltérésnél a piac többnyire pontosabb (5–8 pp: 0,016, 12+ pp: 0,103 log-loss előny). ' +
      'Az eltérés a modell bizonytalanságát jelzi, nem rejtett értéket.',
  };
}
