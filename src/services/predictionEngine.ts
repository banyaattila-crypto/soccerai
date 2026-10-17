import { MarketProbabilities, PickMarket, Match, QuantAnalysis } from '../types/football';

const MAXG = 8;

/**
 * Poisson-eloszlás
 */
function poisson(k: number, lambda: number): number {
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

/**
 * Dixon-Coles (1997) korrekciós faktor alacsony gólszámú cellákra (0-0, 0-1, 1-0, 1-1)
 * rho = -0.13 tipikus érték
 */
function tau(i: number, j: number, lh: number, la: number, rho: number = -0.13): number {
  if (i === 0 && j === 0) return 1.0 - lh * la * rho;
  if (i === 0 && j === 1) return 1.0 + lh * rho;
  if (i === 1 && j === 0) return 1.0 + la * rho;
  if (i === 1 && j === 1) return 1.0 - rho;
  return 1.0;
}

/**
 * Dixon-Coles korrigált gólmátrix számítás
 */
export function calculateDixonColesMatrix(lh: number, la: number, rho: number = -0.13): number[][] {
  const ph: number[] = [];
  const pa: number[] = [];
  for (let k = 0; k < MAXG; k++) {
    ph.push(poisson(k, lh));
    pa.push(poisson(k, la));
  }

  const m: number[][] = [];
  let totalSum = 0;

  for (let i = 0; i < MAXG; i++) {
    const row: number[] = [];
    for (let j = 0; j < MAXG; j++) {
      const val = ph[i] * pa[j] * tau(i, j, lh, la, rho);
      row.push(val);
      totalSum += val;
    }
    m.push(row);
  }

  // Normalizálás 1.0-ra
  for (let i = 0; i < MAXG; i++) {
    for (let j = 0; j < MAXG; j++) {
      m[i][j] /= totalSum;
    }
  }

  return m;
}

/**
 * Piacok kinyerése közvetlenül a Dixon-Coles gólmátrixból
 * (beleértve a BTTS & Over 2.5 egzakt együttes valószínűségét is)
 */
export function extractMarketsFromMatrix(m: number[][]) {
  let home = 0;
  let draw = 0;
  let away = 0;
  let btts = 0;
  let over15 = 0;
  let over25 = 0;
  let over35 = 0;
  let bttsAndOver25 = 0;

  for (let i = 0; i < MAXG; i++) {
    for (let j = 0; j < MAXG; j++) {
      const p = m[i][j];
      if (i > j) home += p;
      else if (i === j) draw += p;
      else away += p;

      if (i > 0 && j > 0) btts += p;
      if (i + j > 1.5) over15 += p;
      if (i + j > 2.5) over25 += p;
      if (i + j > 3.5) over35 += p;
      if (i > 0 && j > 0 && i + j > 2.5) bttsAndOver25 += p;
    }
  }

  return { home, draw, away, btts, over15, over25, over35, bttsAndOver25 };
}

/**
 * Fő valószínűségszámítás xG és Dixon-Coles modellezéssel.
 * Alapértelmezett homeAdvantageFactor = 1.0, mivel a bemeneti homeXg / awayXg
 * már tartalmazza a hazai/vendég kontextust (nincs dupla hazai szorzó).
 */
export function calculateMarketProbabilities(
  homeXg: number,
  awayXg: number,
  homeAdvantageFactor: number = 1.0
): MarketProbabilities {
  const adjHomeXg = Math.max(0.2, homeXg * homeAdvantageFactor);
  const adjAwayXg = Math.max(0.2, awayXg);

  // Dixon-Coles mátrix generálás
  const matrix = calculateDixonColesMatrix(adjHomeXg, adjAwayXg, -0.13);
  const mk = extractMarketsFromMatrix(matrix);

  // Félidő becslés
  const fhHomeXg = adjHomeXg * 0.45;
  const fhAwayXg = adjAwayXg * 0.45;
  const fhNoGoalProb = poisson(0, fhHomeXg) * poisson(0, fhAwayXg);
  const fhOver05 = Math.round((1 - fhNoGoalProb) * 100);

  // Százalékos normalizálás
  const normHome = Math.round(mk.home * 100);
  const normDraw = Math.round(mk.draw * 100);
  const normAway = Math.max(1, 100 - normHome - normDraw);

  return {
    homeWin: normHome,
    draw: normDraw,
    awayWin: normAway,
    bttsYes: Math.min(95, Math.max(10, Math.round(mk.btts * 100))),
    over15: Math.min(96, Math.max(15, Math.round(mk.over15 * 100))),
    over25: Math.min(92, Math.max(10, Math.round(mk.over25 * 100))),
    over35: Math.min(85, Math.max(5, Math.round(mk.over35 * 100))),
    fhOver05: Math.min(95, Math.max(20, fhOver05)),
    bttsAndOver25: Math.min(88, Math.max(8, Math.round(mk.bttsAndOver25 * 100))),
  };
}

/**
 * Shin (1992) De-vigging algoritmus (Favourite-longshot bias korrekció)
 * Kiszűri a bukméker árrését a valós valószínűség kinyeréséhez
 */
export function devigShin(odds: number[]): { probs: number[]; margin: number } {
  const q = odds.map((o) => 1.0 / o);
  const S = q.reduce((a, b) => a + b, 0);
  const margin = Math.round((S - 1.0) * 1000) / 10; // Margin %

  if (S <= 1.0) {
    return { probs: q.map((x) => x / S), margin: 0 };
  }

  const calcProbs = (z: number) => {
    return q.map((qi) => {
      const nom = Math.sqrt(z * z + (4 * (1 - z) * qi * qi) / S) - z;
      return nom / (2 * (1 - z));
    });
  };

  let lo = 0.0;
  let hi = 0.99;
  let z = 0.5;

  for (let iter = 0; iter < 100; iter++) {
    z = 0.5 * (lo + hi);
    const pList = calcProbs(z);
    const sumP = pList.reduce((a, b) => a + b, 0);
    if (Math.abs(sumP - 1.0) < 1e-7) break;
    if (sumP > 1.0) lo = z;
    else hi = z;
  }

  const finalProbs = calcProbs(z);
  const total = finalProbs.reduce((a, b) => a + b, 0);
  return { probs: finalProbs.map((p) => p / total), margin };
}

/**
 * Számolja a várható értéket (Expected Value / EV)
 */
export function calculateExpectedValue(aiProbabilityPct: number, odds: number): number {
  const p = aiProbabilityPct / 100;
  const ev = p * odds - 1.0;
  return Math.round(ev * 1000) / 10; // Pl. +14.2%
}

/**
 * Negyed-Kelly tétméretezési kritérium
 * Formula: f* = (b*p - (1-p)) / b, negyed frakcióval
 */
export function quarterKelly(probabilityPct: number, odds: number, cap: number = 0.25): number {
  const p = probabilityPct / 100;
  const b = odds - 1.0;
  if (b <= 0) return 0;
  const fullKelly = (b * p - (1 - p)) / b;
  if (fullKelly <= 0) return 0;
  const quarter = Math.min(fullKelly, cap) * 0.25;
  return Math.round(quarter * 1000) / 10; // Pl. 2.4% ajánlott tét
}

/**
 * Segédfüggvény: adott piachoz tartozó modell-valószínűség kinyerése a mátrixból
 */
function getMarketProbFromExtracted(
  mk: ReturnType<typeof extractMarketsFromMatrix>,
  market: PickMarket,
  lh: number,
  la: number
): number {
  switch (market) {
    case '1':
      return mk.home;
    case 'X':
      return mk.draw;
    case '2':
      return mk.away;
    case 'BTTS_YES':
      return mk.btts;
    case 'OVER_25':
      return mk.over25;
    case 'UNDER_25':
      return 1.0 - mk.over25;
    case 'OVER_15':
      return mk.over15;
    case 'BTTS_AND_OVER25':
      return mk.bttsAndOver25;
    case 'FH_OVER_05': {
      const fhNoGoal = poisson(0, lh * 0.45) * poisson(0, la * 0.45);
      return 1.0 - fhNoGoal;
    }
  }
}

/**
 * 1. SZŰRŐ: Piacfüggő λ-rács robusztussági teszt
 * Végigfuttatja a lehetséges λ_H és λ_A tartományt a ρ korrekciókkal
 * a kiválasztott konkrét piacra (1, X, 2, BTTS_YES, OVER_25, UNDER_25, BTTS_AND_OVER25).
 */
export function robustnessGridTest(
  lhCenter: number,
  laCenter: number,
  _marketProbPct: number,
  odds: number,
  market: PickMarket = '1',
  spread: number = 0.25
): {
  verdict: 'ROBUSZTUS' | 'valószínű' | 'bizonytalan' | 'ELVETVE';
  minEdge: number;
  medianEdge: number;
  maxEdge: number;
  posPct: number;
} {
  const lhMin = Math.max(0.35, lhCenter - spread);
  const lhMax = lhCenter + spread;
  const laMin = Math.max(0.3, laCenter - spread);
  const laMax = laCenter + spread;

  const edges: number[] = [];
  const rhoSet = [-0.16, -0.13, -0.1, 0.0];

  for (let lh = lhMin; lh <= lhMax + 1e-5; lh += 0.1) {
    for (let la = laMin; la <= laMax + 1e-5; la += 0.1) {
      for (const rho of rhoSet) {
        const mat = calculateDixonColesMatrix(lh, la, rho);
        const mk = extractMarketsFromMatrix(mat);
        const pModel = getMarketProbFromExtracted(mk, market, lh, la);
        const e = (pModel * odds - 1.0) * 100;
        edges.push(e);
      }
    }
  }

  edges.sort((a, b) => a - b);
  const minEdge = Math.round(edges[0] * 10) / 10;
  const maxEdge = Math.round(edges[edges.length - 1] * 10) / 10;
  const medianEdge = Math.round(edges[Math.floor(edges.length / 2)] * 10) / 10;
  const posCount = edges.filter((e) => e > 0).length;
  const posPct = Math.round((posCount / edges.length) * 100);

  let verdict: 'ROBUSZTUS' | 'valószínű' | 'bizonytalan' | 'ELVETVE' = 'ELVETVE';
  if (minEdge > 2.0) {
    verdict = 'ROBUSZTUS';
  } else if (posPct >= 80) {
    verdict = 'valószínű';
  } else if (posPct >= 50) {
    verdict = 'bizonytalan';
  }

  return { verdict, minEdge, medianEdge, maxEdge, posPct };
}

/**
 * 2. SZŰRŐ: λ-inverzió (Gólpiacok strukturális ellenőrzése)
 */
export function lambdaInversionReport(
  overOdds: number,
  underOdds: number,
  leagueLo: number = 2.4,
  leagueHi: number = 3.0
): { marketLambda: number; beOver: number; beUnder: number; verdict: string } {
  // Piac de-vigelt esélye
  const qOver = 1 / overOdds;
  const qUnder = 1 / underOdds;
  const sumQ = qOver + qUnder;
  const pOverMkt = qOver / sumQ;

  // Közelítő lambda számítás Over 2.5-höz (bisection)
  const approxLambda = (pTarget: number) => {
    let lo = 1.0;
    let hi = 5.0;
    for (let i = 0; i < 40; i++) {
      const mid = 0.5 * (lo + hi);
      const mat = calculateDixonColesMatrix(mid * 0.55, mid * 0.45);
      const p = extractMarketsFromMatrix(mat).over25;
      if (p < pTarget) lo = mid;
      else hi = mid;
    }
    return Math.round(((lo + hi) / 2) * 100) / 100;
  };

  const marketLambda = approxLambda(pOverMkt);
  const beOver = approxLambda(1.0 / overOdds);
  const beUnder = approxLambda(1.0 - 1.0 / underOdds);

  let verdict = 'Semleges (a margin megeszi az élt)';
  if (leagueLo > beOver) {
    verdict = 'OVER value (a teljes liga-sáv a küszöb felett)';
  } else if (leagueHi < beUnder) {
    verdict = 'UNDER value (a teljes liga-sáv a küszöb alatt)';
  } else if ((leagueLo + leagueHi) / 2 > beOver) {
    verdict = 'Over felé hajlik a piac';
  }

  return { marketLambda, beOver, beUnder, verdict };
}

/**
 * Közös, egységesített kvantitatív tipp-kiválasztó és elemző függvény.
 * Kiküszöböli a duplikált pick-logikát a szolgáltatók között, piacfüggő
 * robusztussági tesztet futtat, és a gólmátrix egzakt értékeit használja.
 */
export function buildMatchQuantAndPick(params: {
  homeTeamName: string;
  awayTeamName: string;
  homeXg: number;
  awayXg: number;
  probabilities: MarketProbabilities;
  odds: {
    home: number;
    draw: number;
    away: number;
    bttsYes: number;
    over25: number;
    under25: number;
  };
  dataQuality: 'A' | 'B' | 'C';
  leagueLabel: string;
  isSimulatedOdds: boolean;
}): {
  aiPick: Match['aiPick'];
  quantAnalysis: QuantAnalysis;
} {
  const {
    homeTeamName,
    awayTeamName,
    homeXg,
    awayXg,
    probabilities,
    odds,
    dataQuality,
    leagueLabel,
    isSimulatedOdds,
  } = params;

  const shinRes = devigShin([odds.home, odds.draw, odds.away]);
  const lambdaReport = lambdaInversionReport(
    odds.over25,
    odds.under25,
    2.4,
    Math.max(2.6, homeXg + awayXg)
  );

  // Ha az odds szimulált (saját modellből 5% árréssel képezve), a robusztussági teszt
  // a szignál-küszöböt (55% = 1.818 referencia szorzó, kombináltra 50% = 2.00) vizsgálja a λ-rácson.
  // Ha valós bukmékeri szorzó áll rendelkezésre, a valós szorzót teszteljük.
  const getTestOdds = (realOrSimOdd: number, thresholdProb: number) =>
    isSimulatedOdds ? 1 / thresholdProb : realOrSimOdd;

  interface CandidatePick {
    market: PickMarket;
    marketLabel: string;
    probability: number;
    odds: number;
    confidence: number;
    expectedValue: number;
    isTopPick: boolean;
    robustnessVerdict: 'ROBUSZTUS' | 'valószínű' | 'bizonytalan' | 'ELVETVE';
    quarterKellyPct: number;
    reasoning: string;
    rankScore: number;
    robStats: ReturnType<typeof robustnessGridTest>;
  }

  const candidates: CandidatePick[] = [];
  const combinedProb =
    probabilities.bttsAndOver25 ??
    Math.round((probabilities.bttsYes * probabilities.over25) / 100);

  // 1. Kombinált: BTTS & 2.5 gól felett (egzakt mátrix valószínűségből)
  if (combinedProb >= 48 && probabilities.bttsYes >= 58 && probabilities.over25 >= 58) {
    const combinedOdds = Math.max(
      1.65,
      Math.round(((1 / (combinedProb / 100)) / 1.05) * 100) / 100
    );
    const rob = robustnessGridTest(
      homeXg,
      awayXg,
      combinedProb,
      getTestOdds(combinedOdds, 0.48),
      'BTTS_AND_OVER25'
    );
    if (rob.verdict !== 'ELVETVE') {
      const ev = calculateExpectedValue(combinedProb, combinedOdds);
      const qk = isSimulatedOdds ? 0 : quarterKelly(combinedProb, combinedOdds);
      const isTop = rob.verdict === 'ROBUSZTUS' || (rob.verdict === 'valószínű' && combinedProb >= 53);
      candidates.push({
        market: 'BTTS_AND_OVER25',
        marketLabel: 'BTTS & 2.5 gól felett',
        probability: combinedProb,
        odds: combinedOdds,
        confidence: Math.min(9.3, Math.round((combinedProb / 7) * 10) / 10),
        expectedValue: ev,
        isTopPick: isTop,
        robustnessVerdict: rob.verdict,
        quarterKellyPct: qk,
        reasoning: `Gólmátrix közös esély: ${combinedProb}% (${homeXg.toFixed(1)} vs ${awayXg.toFixed(1)} xG, λ-rács: ${rob.verdict}, ${rob.posPct}% stabilitás).`,
        rankScore: combinedProb + (rob.verdict === 'ROBUSZTUS' ? 12 : 6),
        robStats: rob,
      });
    }
  }

  // 2. Mindkét csapat szerez gólt (BTTS_YES)
  if (probabilities.bttsYes >= 56) {
    const rob = robustnessGridTest(
      homeXg,
      awayXg,
      probabilities.bttsYes,
      getTestOdds(odds.bttsYes, 0.55),
      'BTTS_YES'
    );
    if (rob.verdict !== 'ELVETVE') {
      const ev = calculateExpectedValue(probabilities.bttsYes, odds.bttsYes);
      const qk = isSimulatedOdds ? 0 : quarterKelly(probabilities.bttsYes, odds.bttsYes);
      const isTop =
        rob.verdict === 'ROBUSZTUS' ||
        (rob.verdict === 'valószínű' && probabilities.bttsYes >= 62);
      candidates.push({
        market: 'BTTS_YES',
        marketLabel: 'Mindkét csapat szerez gólt (BTTS)',
        probability: probabilities.bttsYes,
        odds: odds.bttsYes,
        confidence: Math.min(9.1, Math.round((probabilities.bttsYes / 7.5) * 10) / 10),
        expectedValue: ev,
        isTopPick: isTop,
        robustnessVerdict: rob.verdict,
        quarterKellyPct: qk,
        reasoning: `Piacfüggő λ-rács teszt (BTTS): ${rob.verdict} (${rob.posPct}% stabilitás). Becsült xG: ${homeXg.toFixed(1)} vs ${awayXg.toFixed(1)}.`,
        rankScore: probabilities.bttsYes + (rob.verdict === 'ROBUSZTUS' ? 9 : 4),
        robStats: rob,
      });
    }
  }

  // 3. Hazai győzelem (1)
  if (probabilities.homeWin >= 55) {
    const rob = robustnessGridTest(
      homeXg,
      awayXg,
      probabilities.homeWin,
      getTestOdds(odds.home, 0.54),
      '1'
    );
    if (rob.verdict !== 'ELVETVE') {
      const ev = calculateExpectedValue(probabilities.homeWin, odds.home);
      const qk = isSimulatedOdds ? 0 : quarterKelly(probabilities.homeWin, odds.home);
      const isTop =
        rob.verdict === 'ROBUSZTUS' ||
        (rob.verdict === 'valószínű' && probabilities.homeWin >= 62);
      candidates.push({
        market: '1',
        marketLabel: `${homeTeamName} Győzelem (1)`,
        probability: probabilities.homeWin,
        odds: odds.home,
        confidence: Math.min(9.5, Math.round((probabilities.homeWin / 7.2) * 10) / 10),
        expectedValue: ev,
        isTopPick: isTop,
        robustnessVerdict: rob.verdict,
        quarterKellyPct: qk,
        reasoning: `Piacfüggő λ-rács teszt (1): ${rob.verdict} (${rob.posPct}% stabilitás). Hazai modell esély: ${probabilities.homeWin}%.`,
        rankScore: probabilities.homeWin + (rob.verdict === 'ROBUSZTUS' ? 10 : 5),
        robStats: rob,
      });
    }
  }

  // 4. Vendég győzelem (2)
  if (probabilities.awayWin >= 54) {
    const rob = robustnessGridTest(
      homeXg,
      awayXg,
      probabilities.awayWin,
      getTestOdds(odds.away, 0.53),
      '2'
    );
    if (rob.verdict !== 'ELVETVE') {
      const ev = calculateExpectedValue(probabilities.awayWin, odds.away);
      const qk = isSimulatedOdds ? 0 : quarterKelly(probabilities.awayWin, odds.away);
      const isTop =
        rob.verdict === 'ROBUSZTUS' ||
        (rob.verdict === 'valószínű' && probabilities.awayWin >= 60);
      candidates.push({
        market: '2',
        marketLabel: `${awayTeamName} Győzelem (2)`,
        probability: probabilities.awayWin,
        odds: odds.away,
        confidence: Math.min(9.3, Math.round((probabilities.awayWin / 7.2) * 10) / 10),
        expectedValue: ev,
        isTopPick: isTop,
        robustnessVerdict: rob.verdict,
        quarterKellyPct: qk,
        reasoning: `Piacfüggő λ-rács teszt (2): ${rob.verdict} (${rob.posPct}% stabilitás). Vendég modell esély: ${probabilities.awayWin}%.`,
        rankScore: probabilities.awayWin + (rob.verdict === 'ROBUSZTUS' ? 10 : 5),
        robStats: rob,
      });
    }
  }

  // 5. 2.5 gól felett (OVER_25)
  if (probabilities.over25 >= 56) {
    const rob = robustnessGridTest(
      homeXg,
      awayXg,
      probabilities.over25,
      getTestOdds(odds.over25, 0.55),
      'OVER_25'
    );
    if (rob.verdict !== 'ELVETVE') {
      const ev = calculateExpectedValue(probabilities.over25, odds.over25);
      const qk = isSimulatedOdds ? 0 : quarterKelly(probabilities.over25, odds.over25);
      const isTop =
        rob.verdict === 'ROBUSZTUS' ||
        (rob.verdict === 'valószínű' && probabilities.over25 >= 62);
      candidates.push({
        market: 'OVER_25',
        marketLabel: '2.5 gól felett',
        probability: probabilities.over25,
        odds: odds.over25,
        confidence: Math.min(9.0, Math.round((probabilities.over25 / 7.5) * 10) / 10),
        expectedValue: ev,
        isTopPick: isTop,
        robustnessVerdict: rob.verdict,
        quarterKellyPct: qk,
        reasoning: `Piacfüggő λ-rács teszt (Over 2.5): ${rob.verdict} (${rob.posPct}% stabilitás). Várható össz-gól: ${(homeXg + awayXg).toFixed(1)} xG.`,
        rankScore: probabilities.over25 + (rob.verdict === 'ROBUSZTUS' ? 9 : 4),
        robStats: rob,
      });
    }
  }

  // 6. 2.5 gól alatt (UNDER_25)
  if (probabilities.over25 <= 44) {
    const underProb = 100 - probabilities.over25;
    const rob = robustnessGridTest(
      homeXg,
      awayXg,
      underProb,
      getTestOdds(odds.under25, 0.55),
      'UNDER_25'
    );
    if (rob.verdict !== 'ELVETVE') {
      const ev = calculateExpectedValue(underProb, odds.under25);
      const qk = isSimulatedOdds ? 0 : quarterKelly(underProb, odds.under25);
      const isTop =
        rob.verdict === 'ROBUSZTUS' ||
        (rob.verdict === 'valószínű' && underProb >= 62);
      candidates.push({
        market: 'UNDER_25',
        marketLabel: '2.5 gól alatt',
        probability: underProb,
        odds: odds.under25,
        confidence: Math.min(8.8, Math.round((underProb / 7.5) * 10) / 10),
        expectedValue: ev,
        isTopPick: isTop,
        robustnessVerdict: rob.verdict,
        quarterKellyPct: qk,
        reasoning: `Piacfüggő λ-rács teszt (Under 2.5): ${rob.verdict} (${rob.posPct}% stabilitás). Alacsony várható gólszám (${(homeXg + awayXg).toFixed(1)} xG).`,
        rankScore: underProb + (rob.verdict === 'ROBUSZTUS' ? 9 : 4),
        robStats: rob,
      });
    }
  }

  candidates.sort((a, b) => b.rankScore - a.rankScore);
  const best = candidates[0];

  // Ha nincs kiemelkedő jelölt, a hazai győzelem robusztusságát használjuk alapértelmezett diagnosztikának
  const defaultRob = robustnessGridTest(
    homeXg,
    awayXg,
    probabilities.homeWin,
    getTestOdds(odds.home, 0.54),
    '1'
  );
  const activeRob = best ? best.robStats : defaultRob;

  const aiPick: Match['aiPick'] = best
    ? {
        market: best.market,
        marketLabel: best.marketLabel,
        probability: best.probability,
        odds: best.odds,
        confidence: best.confidence,
        expectedValue: best.expectedValue,
        isTopPick: best.isTopPick,
        robustnessVerdict: best.robustnessVerdict,
        quarterKellyPct: best.quarterKellyPct,
        reasoning: best.reasoning,
        isSimulatedOdds,
      }
    : undefined;

  const quantAnalysis: QuantAnalysis = {
    dataQuality,
    robustnessVerdict: activeRob.verdict,
    minEdge: activeRob.minEdge,
    medianEdge: activeRob.medianEdge,
    posPct: activeRob.posPct,
    quarterKellyPct: best ? best.quarterKellyPct : 0,
    shinMargin: shinRes.margin,
    shinProbs: {
      home: Math.round(shinRes.probs[0] * 100),
      draw: Math.round(shinRes.probs[1] * 100),
      away: Math.round(shinRes.probs[2] * 100),
    },
    lambdaInversion: lambdaReport,
    keyFactors: [
      `Adatminőség: ${dataQuality}-szint (${leagueLabel})`,
      `Becsült xG: ${homeXg.toFixed(1)} (Hazai) vs ${awayXg.toFixed(1)} (Vendég)`,
      isSimulatedOdds
        ? `Szimulált oddsok (5% árrés) – Valós +EV-hez nyisd meg a meccs élő oddsait`
        : `Valós bukmékeri árrés (Shin): ${shinRes.margin}%`,
    ],
    riskLevel:
      activeRob.verdict === 'ROBUSZTUS'
        ? 'Alacsony'
        : activeRob.verdict === 'valószínű'
        ? 'Közepes'
        : 'Magas',
  };

  return { aiPick, quantAnalysis };
}

/**
 * Színkódoló segédfüggvény valószínűségi értékekhez (SoccerAI valószínűségi hőtérkép)
 */
export function getProbabilityColorClass(percentage: number): {
  bg: string;
  text: string;
  badge: string;
  border: string;
  label: string;
} {
  if (percentage >= 65) {
    return {
      bg: 'bg-emerald-500/20 text-emerald-400 font-bold',
      text: 'text-emerald-400',
      badge: 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40',
      border: 'border-emerald-500/50 shadow-sm shadow-emerald-950/50',
      label: 'Kiemelt szignál (65%+)',
    };
  }
  if (percentage >= 55) {
    return {
      bg: 'bg-teal-500/15 text-teal-300 font-semibold',
      text: 'text-teal-300',
      badge: 'bg-teal-500/20 text-teal-200 border-teal-500/30',
      border: 'border-teal-500/40',
      label: 'Erős esély (55-64%)',
    };
  }
  if (percentage >= 45) {
    return {
      bg: 'bg-slate-700/30 text-slate-300',
      text: 'text-slate-300',
      badge: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
      border: 'border-slate-700',
      label: 'Kiegyenlített (45-54%)',
    };
  }
  if (percentage >= 35) {
    return {
      bg: 'bg-slate-800/40 text-slate-400',
      text: 'text-slate-400',
      badge: 'bg-slate-800/60 text-slate-400 border-slate-800',
      border: 'border-slate-800',
      label: 'Mérsékelt (35-44%)',
    };
  }
  return {
    bg: 'bg-transparent text-slate-500 opacity-60',
    text: 'text-slate-500',
    badge: 'bg-transparent text-slate-600 border-transparent',
    border: 'border-transparent',
    label: 'Alacsony (<35%)',
  };
}
