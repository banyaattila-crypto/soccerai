import type { FixtureRealOdds, Match, MarketProbabilities } from '../../types/football';
import { blendedMarketPct, type MarketFair } from '../../services/marketBlend';

export type BookieTab = 'pinnacle' | 'bet365' | 'best';

export interface OddsRowData {
  key: string;
  label: string;
  /** Fair szorzó (két tizedesre formázva) */
  fair: string;
  odd?: number;
  /** +EV a piaci referenciához mérve; null, ha nincs piaci referencia (pl. BTTS) */
  ev: number | null;
  /** A legjobb piac fülön a szorzót adó bukméker */
  source?: string;
}

/** Várható érték (+EV %) a valószínűség (%) és a szorzó alapján; érvénytelen bemenetre null. */
export function calcEv(probPct: number, odd?: number): number | null {
  if (!odd || probPct <= 0) return null;
  return Math.round(((probPct / 100) * odd - 1) * 1000) / 10;
}

/**
 * A kiválasztott bukméker (vagy a legjobb piac) soraihoz tartozó fair szorzók, szorzók és EV-k.
 * Az EV a piaci referenciához (Pinnacle fair, ennek híján az átlag) mér: a backtest szerint a nyers modell-EV hozama
 * negatív. Piaci referencia nélküli piacra (BTTS) nincs EV.
 */
export function buildOddsRows(
  match: Pick<Match, 'homeTeam' | 'awayTeam'>,
  realOdds: FixtureRealOdds,
  tab: BookieTab,
  modelP: MarketProbabilities,
  marketFair: MarketFair | undefined
): OddsRowData[] {
  const isBest = tab === 'best';
  const bookie = tab === 'pinnacle' ? realOdds.pinnacle : tab === 'bet365' ? realOdds.bet365 : undefined;
  const best = realOdds.bestOdds;
  const pick = (
    bestItem: { odd: number; bookmaker: string } | undefined,
    own: number | undefined
  ): { odd?: number; source?: string } =>
    isBest ? { odd: bestItem?.odd, source: bestItem?.bookmaker } : { odd: own, source: bookie?.name };

  const h = pick(best.home, bookie?.home);
  const d = pick(best.draw, bookie?.draw);
  const a = pick(best.away, bookie?.away);
  const o25 = pick(best.over25, bookie?.over25);
  const u25 = pick(best.under25, bookie?.under25);
  const btts = pick(best.bttsYes, bookie?.bttsYes);

  const model = { home: modelP.homeWin, draw: modelP.draw, away: modelP.awayWin, over25: modelP.over25 };
  const mk = (market: string) => blendedMarketPct(market, model, marketFair);
  const hP = mk('1');
  const dP = mk('X');
  const aP = mk('2');
  const oP = mk('OVER_25');
  const uP = mk('UNDER_25');
  const evOf = (pct: number | null, odd?: number) => (pct === null ? null : calcEv(pct, odd));
  const fairOf = (pct: number | null, fallbackPct: number) => (100 / Math.max(1, pct ?? fallbackPct)).toFixed(2);

  const rows: OddsRowData[] = [
    { key: '1', label: `${match.homeTeam.shortName || match.homeTeam.name} (1)`, fair: fairOf(hP, modelP.homeWin), odd: h.odd, ev: evOf(hP, h.odd), source: h.source },
    { key: 'X', label: 'Döntetlen (X)', fair: fairOf(dP, modelP.draw), odd: d.odd, ev: evOf(dP, d.odd), source: d.source },
    { key: '2', label: `${match.awayTeam.shortName || match.awayTeam.name} (2)`, fair: fairOf(aP, modelP.awayWin), odd: a.odd, ev: evOf(aP, a.odd), source: a.source },
    { key: 'O25', label: '2.5 Gól Felett', fair: fairOf(oP, modelP.over25), odd: o25.odd, ev: evOf(oP, o25.odd), source: o25.source },
    { key: 'U25', label: '2.5 Gól Alatt', fair: fairOf(uP, Math.max(1, 100 - modelP.over25)), odd: u25.odd, ev: evOf(uP, u25.odd), source: u25.source },
  ];
  if (btts.odd) {
    rows.push({
      key: 'BTTS',
      label: 'Mindkét Csapat Lő (BTTS, modell fair)',
      fair: (100 / Math.max(1, modelP.bttsYes)).toFixed(2),
      odd: btts.odd,
      ev: null,
      source: btts.source,
    });
  }
  return rows;
}
