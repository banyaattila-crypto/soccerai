import { MarketProbabilities, PickMarket, Match, QuantAnalysis } from '../types/football';

const MAXG = 8;

/**
 * Poisson-eloszlás valószínűségi sűrűségfüggvénye
 * P(k; lambda) = (lambda^k * exp(-lambda)) / k!
 */
export function poisson(k: number, lambda: number): number {
  if (k < 0 || lambda <= 0) {
    return k === 0 && lambda === 0 ? 1.0 : 0.0;
  }
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

/**
 * Faktoriális függvény
 */
export function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

/**
 * Dixon-Coles (1997) korrekciós faktor alacsony gólszámú cellákra (0-0, 0-1, 1-0, 1-1)
 * Numerikus invariáns: tau >= 0.001 (a valószínűségi korrekció szigorúan nemnegatív).
 */
export function dixonColesTau(
  i: number,
  j: number,
  lh: number,
  la: number,
  rho: number = -0.13
): number {
  let val = 1.0;
  if (i === 0 && j === 0) val = 1.0 - lh * la * rho;
  else if (i === 0 && j === 1) val = 1.0 + lh * rho;
  else if (i === 1 && j === 0) val = 1.0 + la * rho;
  else if (i === 1 && j === 1) val = 1.0 - rho;
  return Math.max(0.001, val);
}

// Kompatibilitási alias
export const tau = dixonColesTau;

/**
 * Dixon-Coles korrigált gólmátrix számítás
 * Numerikus invariáns: A mátrix elemeinek összege pontosan 1.0 (100%).
 */
export function calculateDixonColesMatrix(
  lh: number,
  la: number,
  rho: number = -0.13,
  maxGoals: number = MAXG
): number[][] {
  const ph: number[] = [];
  const pa: number[] = [];
  for (let k = 0; k < maxGoals; k++) {
    ph.push(poisson(k, lh));
    pa.push(poisson(k, la));
  }

  const m: number[][] = [];
  let totalSum = 0;

  for (let i = 0; i < maxGoals; i++) {
    const row: number[] = [];
    for (let j = 0; j < maxGoals; j++) {
      const val = ph[i] * pa[j] * dixonColesTau(i, j, lh, la, rho);
      row.push(val);
      totalSum += val;
    }
    m.push(row);
  }

  // Normalizálás 1.0-ra (összeg invariáns)
  if (totalSum > 0) {
    for (let i = 0; i < maxGoals; i++) {
      for (let j = 0; j < maxGoals; j++) {
        m[i][j] /= totalSum;
      }
    }
  }

  return m;
}

/**
 * Piacok kinyerése közvetlenül a Dixon-Coles gólmátrixból
 * (beleértve a BTTS & Over 2.5 egzakt együttes valószínűségét is)
 */
export function extractMarketsFromMatrix(m: number[][]) {
  const size = m.length;
  let home = 0;
  let draw = 0;
  let away = 0;
  let btts = 0;
  let over15 = 0;
  let over25 = 0;
  let over35 = 0;
  let bttsAndOver25 = 0;

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
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
 * Hare-Niemeyer (Legnagyobb maradvány) módszer:
 * Garantálja, hogy a kimeneti egész százalékok összege PONTOSAN 100 legyen,
 * megszüntetve a Math.round() miatti 99% vagy 101% partíció-hibákat.
 */
export function normalizeIntegerPercentages(probs: number[]): number[] {
  const n = probs.length;
  if (n === 0) return [];
  const total = probs.reduce((a, b) => a + b, 0);
  if (total <= 0) {
    const base = Math.floor(100 / n);
    const res = new Array(n).fill(base);
    res[0] += 100 - base * n;
    return res;
  }

  const exact = probs.map((p) => (p / total) * 100);
  const floors = exact.map(Math.floor);
  const sumFloors = floors.reduce((a, b) => a + b, 0);
  const remainder = 100 - sumFloors;

  // Törtrészek csökkenő sorrendbe állítása
  const diffs = exact
    .map((val, idx) => ({ idx, diff: val - floors[idx] }))
    .sort((a, b) => b.diff - a.diff);

  for (let i = 0; i < remainder; i++) {
    floors[diffs[i % n].idx]++;
  }

  return floors;
}

export interface DixonColesParams {
  attackHome: number;
  defenseHome: number;
  attackAway: number;
  defenseAway: number;
  avgHomeGoals?: number;
  avgAwayGoals?: number;
  homeAdvantage?: number;
}

/**
 * Egységes kanonikus Dixon-Coles várható gól (xG / lambda) számítás.
 * Garantálja a numerikus határokat és a platform-szintű konzisztenciát.
 */
export function computeDixonColesExpectedGoals(params: DixonColesParams): {
  lh: number;
  la: number;
} {
  const avgH = params.avgHomeGoals ?? 1.45;
  const avgA = params.avgAwayGoals ?? 1.15;
  const homeAdv = params.homeAdvantage ?? 1.15;

  // Egységes Dixon-Coles modellképlet:
  // lambda_H = attack_H * defense_A * avgHomeGoals * (homeAdv / 1.12)
  // lambda_A = attack_A * defense_H * avgAwayGoals
  const rawLh = params.attackHome * params.defenseAway * avgH * (homeAdv / 1.12);
  const rawLa = params.attackAway * params.defenseHome * avgA;

  // Numerikus stabilitási korlátok (strictly pozitív intenzitási paraméterek)
  const lh = Math.min(5.5, Math.max(0.2, Math.round(rawLh * 100) / 100));
  const la = Math.min(5.5, Math.max(0.2, Math.round(rawLa * 100) / 100));

  return { lh, la };
}

/**
 * Fő valószínűségszámítás xG és Dixon-Coles modellezéssel.
 * Alapértelmezett homeAdvantageFactor = 1.0, mivel a bemeneti homeXg / awayXg
 * már tartalmazza a hazai/vendég kontextust (nincs dupla hazai szorzó).
 *
 * Szigorú numerikus invariánsok:
 * 1. homeWin + draw + awayWin == 100% (Hare-Niemeyer partíció)
 * 2. Over 3.5 <= Over 2.5 <= Over 1.5 (monotonitás)
 * 3. BTTS & Over 2.5 Fréchet határok között van: max(0, BTTS + Over25 - 100) <= Combined <= min(BTTS, Over25)
 * 4. Félidő Over 0.5 <= Teljes meccs Over 0.5
 */
export function calculateMarketProbabilities(
  homeXg: number,
  awayXg: number,
  homeAdvantageFactor: number = 1.0,
  rho: number = -0.13
): MarketProbabilities {
  const adjHomeXg = Math.max(0.2, homeXg * homeAdvantageFactor);
  const adjAwayXg = Math.max(0.2, awayXg);

  // Dixon-Coles mátrix generálás az illesztett vagy alapértelmezett rho korrekcióval
  const matrix = calculateDixonColesMatrix(adjHomeXg, adjAwayXg, rho);
  const mk = extractMarketsFromMatrix(matrix);

  // Félidő becslés
  const fhHomeXg = adjHomeXg * 0.45;
  const fhAwayXg = adjAwayXg * 0.45;
  const fhNoGoalProb = poisson(0, fhHomeXg) * poisson(0, fhAwayXg);
  const rawFhOver05 = (1 - fhNoGoalProb) * 100;

  // 1X2 Százalékos normalizálás (szigorú 100% partició invariáns)
  const [normHome, normDraw, normAway] = normalizeIntegerPercentages([
    mk.home,
    mk.draw,
    mk.away,
  ]);

  // Nyers százalékok
  const rawOver15 = Math.round(mk.over15 * 100);
  const rawOver25 = Math.round(mk.over25 * 100);
  const rawOver35 = Math.round(mk.over35 * 100);
  const rawBtts = Math.round(mk.btts * 100);
  const rawBttsAndOver25 = Math.round(mk.bttsAndOver25 * 100);

  // Monotonitási invariáns: Over 3.5 <= Over 2.5 <= Over 1.5
  const over15 = Math.min(99, Math.max(1, rawOver15));
  const over25 = Math.min(over15, Math.max(1, rawOver25));
  const over35 = Math.min(over25, Math.max(1, rawOver35));

  const bttsYes = Math.min(99, Math.max(1, rawBtts));

  // Fréchet / Copula határok a BTTS & Over 2.5 kombinált piacra:
  // max(0, btts + over25 - 100) <= bttsAndOver25 <= min(btts, over25)
  const minCombined = Math.max(0, bttsYes + over25 - 100);
  const maxCombined = Math.min(bttsYes, over25);
  const bttsAndOver25 = Math.min(maxCombined, Math.max(minCombined, rawBttsAndOver25));

  // Félidő invariáns: Félidő 0.5 felett <= Teljes meccs 0.5 felett
  const ftOver05 = Math.round((1 - matrix[0][0]) * 100);
  const fhOver05 = Math.min(ftOver05, Math.max(1, Math.round(rawFhOver05)));

  return {
    homeWin: normHome,
    draw: normDraw,
    awayWin: normAway,
    bttsYes,
    over15,
    over25,
    over35,
    fhOver05,
    bttsAndOver25,
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
) {
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
      return 1.0 - mk.btts;
    case 'OVER_35':
      return mk.over35;
    case 'UNDER_35':
      return 1.0 - mk.over35;
    case 'OVER_25':
      return mk.over25;
    case 'UNDER_25':
      return 1.0 - mk.over25;
    case 'OVER_15':
      return mk.over15;
    case 'UNDER_15':
      return 1.0 - mk.over15;
    case 'BTTS_AND_OVER25':
      return mk.bttsAndOver25;
    case 'FH_OVER_05': {
      const fhNoGoal = poisson(0, lh * 0.45) * poisson(0, la * 0.45);
      return 1.0 - fhNoGoal;
    }
    default:
      return mk.home;
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
  dixonColesRatings?: QuantAnalysis['dixonColesRatings'];
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
    dixonColesRatings,
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

  /**
   * Kvantitatív Fogadói Érték-Index (Betting Value Index)
   * Megoldja a problémát: az alacsony, használhatatlan mini-oddsok (< 1.40) elkerülése,
   * és a fogadói édes-pont (Sweet Spot: 1.55 – 2.40) előtérbe helyezése.
   */
  const evaluateCandidate = (
    prob: number,
    candidateOdds: number,
    rob: ReturnType<typeof robustnessGridTest>,
    market: PickMarket
  ): { ev: number; qk: number; isTop: boolean; rankScore: number } => {
    // Szimulált ár esetén a Value (+EV%) és Kelly tét szigorúan tiltott / 0, mivel nem képvisel valós piaci arbitrázst!
    const rawEv = calculateExpectedValue(prob, candidateOdds);
    const ev = isSimulatedOdds ? 0 : rawEv;
    const qk = isSimulatedOdds ? 0 : quarterKelly(prob, candidateOdds);

    if (rob.verdict === 'ELVETVE') {
      return { ev, qk, isTop: false, rankScore: -999 };
    }

    // A) Odds használhatósági & játszhatósági súlyozás
    let oddsScore = 0;
    if (candidateOdds < 1.30) {
      oddsScore = -65; // Használhatatlan mini-odds (pl. 1.15, 1.20)
    } else if (candidateOdds < 1.40) {
      oddsScore = -40; // Túl alacsony, aszimmetrikus kockázatú
    } else if (candidateOdds < 1.50) {
      oddsScore = -10; // Határeset
    } else if (candidateOdds >= 1.55 && candidateOdds <= 2.35) {
      oddsScore = 32; // SWEET SPOT: Ideális fogadási értéksáv!
    } else if (candidateOdds > 2.35 && candidateOdds <= 2.85) {
      oddsScore = 22; // Kiváló értéket adó magasabb szorzó
    } else if (candidateOdds > 2.85 && candidateOdds <= 3.50) {
      oddsScore = 12;
    } else {
      oddsScore = 2;
    }

    // B) Várható Érték (+EV) súly: A valós matematikai előnyt erősítjük
    const evBonus = ev > 0 ? Math.min(30, ev * 1.6) : ev * 0.9;

    // C) Modell alapesély (skálázva, max 42 pont)
    const probScore = (prob / 100) * 42;

    // D) Robusztussági bónusz (λ-rács teszt)
    const robBonus = rob.verdict === 'ROBUSZTUS' ? 14 : rob.verdict === 'valószínű' ? 7 : 0;

    // E) Piac-specifikus értékpreferencia (gólkombók és over piacok jobb értéket hordoznak)
    const marketBonus =
      market === 'BTTS_AND_OVER25' ? 10 : market === 'OVER_25' || market === 'BTTS_YES' ? 5 : 0;

    const rankScore = Math.round((probScore + oddsScore + evBonus + robBonus + marketBonus) * 10) / 10;

    // Csak akkor minősülhet 'isTopPick'-nek, ha a szorzó valóban JÁTSZHATÓ (>= 1.48)!
    const isTop =
      (rob.verdict === 'ROBUSZTUS' || rob.verdict === 'valószínű') &&
      candidateOdds >= 1.48 &&
      rankScore >= 50 &&
      prob >= 46;

    return { ev, qk, isTop, rankScore };
  };

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
      const { ev, qk, isTop, rankScore } = evaluateCandidate(
        combinedProb,
        combinedOdds,
        rob,
        'BTTS_AND_OVER25'
      );
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
        rankScore,
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
      const { ev, qk, isTop, rankScore } = evaluateCandidate(
        probabilities.bttsYes,
        odds.bttsYes,
        rob,
        'BTTS_YES'
      );
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
        rankScore,
        robStats: rob,
      });
    }
  }

  // 3. Hazai győzelem (1)
  if (probabilities.homeWin >= 52) {
    const rob = robustnessGridTest(
      homeXg,
      awayXg,
      probabilities.homeWin,
      getTestOdds(odds.home, 0.54),
      '1'
    );
    if (rob.verdict !== 'ELVETVE') {
      const { ev, qk, isTop, rankScore } = evaluateCandidate(
        probabilities.homeWin,
        odds.home,
        rob,
        '1'
      );
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
        reasoning:
          odds.home < 1.40
            ? `Hazai dominancia (${probabilities.homeWin}%), de a szorzó alacsony (@${odds.home.toFixed(2)}).`
            : `Piacfüggő λ-rács teszt (1): ${rob.verdict} (${rob.posPct}% stabilitás). Hazai modell esély: ${probabilities.homeWin}%.`,
        rankScore,
        robStats: rob,
      });
    }
  }

  // 4. Vendég győzelem (2)
  if (probabilities.awayWin >= 50) {
    const rob = robustnessGridTest(
      homeXg,
      awayXg,
      probabilities.awayWin,
      getTestOdds(odds.away, 0.53),
      '2'
    );
    if (rob.verdict !== 'ELVETVE') {
      const { ev, qk, isTop, rankScore } = evaluateCandidate(
        probabilities.awayWin,
        odds.away,
        rob,
        '2'
      );
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
        reasoning:
          odds.away < 1.40
            ? `Vendég favorit (${probabilities.awayWin}%), de a szorzó alacsony (@${odds.away.toFixed(2)}).`
            : `Piacfüggő λ-rács teszt (2): ${rob.verdict} (${rob.posPct}% stabilitás). Vendég modell esély: ${probabilities.awayWin}%.`,
        rankScore,
        robStats: rob,
      });
    }
  }

  // 5. 2.5 gól felett (OVER_25)
  if (probabilities.over25 >= 55) {
    const rob = robustnessGridTest(
      homeXg,
      awayXg,
      probabilities.over25,
      getTestOdds(odds.over25, 0.55),
      'OVER_25'
    );
    if (rob.verdict !== 'ELVETVE') {
      const { ev, qk, isTop, rankScore } = evaluateCandidate(
        probabilities.over25,
        odds.over25,
        rob,
        'OVER_25'
      );
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
        rankScore,
        robStats: rob,
      });
    }
  }

  // 6. 2.5 gól alatt (UNDER_25)
  if (probabilities.over25 <= 45) {
    const underProb = 100 - probabilities.over25;
    const rob = robustnessGridTest(
      homeXg,
      awayXg,
      underProb,
      getTestOdds(odds.under25, 0.55),
      'UNDER_25'
    );
    if (rob.verdict !== 'ELVETVE') {
      const { ev, qk, isTop, rankScore } = evaluateCandidate(
        underProb,
        odds.under25,
        rob,
        'UNDER_25'
      );
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
        rankScore,
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
        expectedValue: isSimulatedOdds ? 0 : best.expectedValue,
        isTopPick: best.isTopPick,
        robustnessVerdict: best.robustnessVerdict,
        quarterKellyPct: isSimulatedOdds ? 0 : best.quarterKellyPct,
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
    quarterKellyPct: isSimulatedOdds ? 0 : (best ? best.quarterKellyPct : 0),
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
    dixonColesRatings,
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
