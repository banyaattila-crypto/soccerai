import type { BookmakerOddsItem } from '../types/football';
import { normalizeTeamName } from '../utils/teamUtils';
import { summarizeBookmakers, type ParsedBookmakerOdds } from './oddsParsing';

/**
 * A The Odds API (v4) válaszának feldolgozása. Tiszta függvények (nincs böngésző-függés).
 * Piacok: h2h (1X2) és totals (Over/Under 2.5). Az ingyenes csomag nem ad BTTS-t.
 */

export interface OddsApiOutcome {
  name: string;
  price: number;
  point?: number;
}

export interface OddsApiMarket {
  key: string;
  outcomes?: OddsApiOutcome[];
}

export interface OddsApiBookmaker {
  key: string;
  title: string;
  markets?: OddsApiMarket[];
}

export interface OddsApiEvent {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: OddsApiBookmaker[];
}

export interface ParsedOddsApiEvent extends ParsedBookmakerOdds {
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
}

const validOdd = (v: number | undefined): number | undefined =>
  typeof v === 'number' && isFinite(v) && v > 1 ? v : undefined;

export function parseOddsApiEvent(event: OddsApiEvent): ParsedOddsApiEvent {
  const bookmakers: BookmakerOddsItem[] = [];
  for (const b of event.bookmakers ?? []) {
    const h2h = b.markets?.find((m) => m.key === 'h2h')?.outcomes ?? [];
    const totals = b.markets?.find((m) => m.key === 'totals')?.outcomes ?? [];
    const home = validOdd(h2h.find((o) => o.name === event.home_team)?.price);
    const away = validOdd(h2h.find((o) => o.name === event.away_team)?.price);
    const draw = validOdd(h2h.find((o) => o.name === 'Draw')?.price);
    const over25 = validOdd(totals.find((o) => o.name === 'Over' && o.point === 2.5)?.price);
    const under25 = validOdd(totals.find((o) => o.name === 'Under' && o.point === 2.5)?.price);
    if (!home && !away && !draw && !over25 && !under25) continue;
    const margin =
      home && draw && away ? Math.round(((1 / home + 1 / draw + 1 / away) - 1) * 1000) / 10 : undefined;
    bookmakers.push({ name: b.title, home, draw, away, over25, under25, margin });
  }
  return {
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    commenceTime: event.commence_time,
    ...summarizeBookmakers(bookmakers),
  };
}

const ALIASES: [RegExp, string][] = [
  [/munchen/g, 'munich'],
  [/internazionale/g, 'inter'],
  [/koln/g, 'cologne'],
  [/sporting cp/g, 'sporting'],
];

function canon(name: string): string {
  let t = name.replace(/&/g, ' and ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const [re, to] of ALIASES) t = t.replace(re, to);
  return normalizeTeamName(t);
}

/** Két csapatnév egyezik-e: azonos normalizált alak (néhány ismert eltéréssel) vagy tartalmazás (min. 5 karakter). */
export function teamNamesMatch(a: string, b: string): boolean {
  const x = canon(a);
  const y = canon(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  return short.length >= 5 && long.includes(short);
}

/** Megkeresi a meccshez tartozó eseményt (mindkét csapat egyezik, kezdés legfeljebb 36 órán belül). */
export function findOddsApiEvent<T extends { homeTeam: string; awayTeam: string; commenceTime: string }>(
  events: T[],
  homeName: string,
  awayName: string,
  kickoffMs: number
): T | null {
  let best: T | null = null;
  let bestDiff = Infinity;
  for (const e of events) {
    if (!teamNamesMatch(e.homeTeam, homeName) || !teamNamesMatch(e.awayTeam, awayName)) continue;
    const diff = Math.abs(Date.parse(e.commenceTime) - kickoffMs);
    if (!isNaN(diff) && diff <= 36 * 3600 * 1000 && diff < bestDiff) {
      best = e;
      bestDiff = diff;
    }
  }
  return best;
}
