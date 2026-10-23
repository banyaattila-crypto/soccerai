import type { BookmakerOddsItem, FixtureRealOdds } from '../types/football';

/**
 * Az API-Sports "odds" végpont válaszának feldolgozása. Tiszta függvény (nincs böngésző-függés), hogy az app
 * és a szerveroldali szorzó-követő (scripts/tracker) ugyanazt a logikát használja.
 */

export interface ApiSportsOddValue {
  value: string;
  odd: string;
}

export interface ApiSportsBetMarket {
  name: string;
  values?: ApiSportsOddValue[];
}

export interface ApiSportsBookmaker {
  name: string;
  bets?: ApiSportsBetMarket[];
}

type Best = { odd: number; bookmaker: string };

export interface ParsedBookmakerOdds {
  bookmakers: BookmakerOddsItem[];
  pinnacle?: BookmakerOddsItem;
  bet365?: BookmakerOddsItem;
  bestOdds: FixtureRealOdds['bestOdds'];
}

const num = (v: string | undefined): number | undefined => (v ? Number(v) : undefined);

/** A bukmékerek 1X2, Over/Under 2.5 és BTTS szorzóinak kinyerése, árrés és a legjobb szorzók kiválasztása. */
export function parseApiSportsBookmakers(rawBookmakers: ApiSportsBookmaker[]): ParsedBookmakerOdds {
  const bookmakers: BookmakerOddsItem[] = [];

  for (const b of rawBookmakers) {
    const mw = b.bets?.find((x) => x.name === 'Match Winner');
    const ou = b.bets?.find((x) => x.name === 'Goals Over/Under');
    const btts = b.bets?.find((x) => x.name === 'Both Teams Score');

    const home = num(mw?.values?.find((v) => v.value === 'Home')?.odd);
    const draw = num(mw?.values?.find((v) => v.value === 'Draw')?.odd);
    const away = num(mw?.values?.find((v) => v.value === 'Away')?.odd);
    const over25 = num(ou?.values?.find((v) => v.value === 'Over 2.5')?.odd);
    const under25 = num(ou?.values?.find((v) => v.value === 'Under 2.5')?.odd);
    const bttsYes = num(btts?.values?.find((v) => v.value === 'Yes')?.odd);
    const bttsNo = num(btts?.values?.find((v) => v.value === 'No')?.odd);

    let margin: number | undefined = undefined;
    if (home && draw && away) {
      margin = Math.round(((1 / home + 1 / draw + 1 / away) - 1) * 1000) / 10;
    }

    bookmakers.push({ name: b.name, home, draw, away, over25, under25, bttsYes, bttsNo, margin });
  }

  return summarizeBookmakers(bookmakers);
}

/** A bukmékerenkénti szorzókból Pinnacle/Bet365 kiemelés és a legjobb szorzók kiválasztása (forrásfüggetlen). */
export function summarizeBookmakers(bookmakers: BookmakerOddsItem[]): ParsedBookmakerOdds {
  const pinnacle = bookmakers.find((b) => b.name.toLowerCase().includes('pinnacle'));
  const bet365 = bookmakers.find((b) => b.name.toLowerCase().includes('bet365'));

  let bestHome: Best | undefined;
  let bestDraw: Best | undefined;
  let bestAway: Best | undefined;
  let bestOver25: Best | undefined;
  let bestUnder25: Best | undefined;
  let bestBttsYes: Best | undefined;

  for (const b of bookmakers) {
    if (b.home && (!bestHome || b.home > bestHome.odd)) bestHome = { odd: b.home, bookmaker: b.name };
    if (b.draw && (!bestDraw || b.draw > bestDraw.odd)) bestDraw = { odd: b.draw, bookmaker: b.name };
    if (b.away && (!bestAway || b.away > bestAway.odd)) bestAway = { odd: b.away, bookmaker: b.name };
    if (b.over25 && (!bestOver25 || b.over25 > bestOver25.odd)) bestOver25 = { odd: b.over25, bookmaker: b.name };
    if (b.under25 && (!bestUnder25 || b.under25 > bestUnder25.odd)) bestUnder25 = { odd: b.under25, bookmaker: b.name };
    if (b.bttsYes && (!bestBttsYes || b.bttsYes > bestBttsYes.odd)) bestBttsYes = { odd: b.bttsYes, bookmaker: b.name };
  }

  return {
    bookmakers,
    pinnacle,
    bet365,
    bestOdds: {
      home: bestHome,
      draw: bestDraw,
      away: bestAway,
      over25: bestOver25,
      under25: bestUnder25,
      bttsYes: bestBttsYes,
    },
  };
}
