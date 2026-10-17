import { MarketProbabilities, QuantAnalysis } from '../types/football';

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
 * Piacok kinyerése a Dixon-Coles mátrixból
 */
export function extractMarketsFromMatrix(m: number[][]) {
  let home = 0;
  let draw = 0;
  let away = 0;
  let btts = 0;
  let over15 = 0;
  let over25 = 0;
  let over35 = 0;

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
    }
  }

  return { home, draw, away, btts, over15, over25, over35 };
}

/**
 * Fő valószínűségszámítás xG és Dixon-Coles modellezéssel
 */
export function calculateMarketProbabilities(
  homeXg: number,
  awayXg: number,
  homeAdvantageFactor: number = 1.15
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
    bttsYes: Math.min(95, Math.max(15, Math.round(mk.btts * 100))),
    over15: Math.min(95, Math.max(25, Math.round(mk.over15 * 100))),
    over25: Math.min(90, Math.max(15, Math.round(mk.over25 * 100))),
    over35: Math.min(80, Math.max(8, Math.round(mk.over35 * 100))),
    fhOver05: Math.min(95, Math.max(30, fhOver05)),
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
 * 1. SZŰRŐ: λ-rács robusztussági teszt
 * Végigfuttatja a lehetséges λ_H és λ_A tartományt a ρ korrekciókkal
 * Kiszűri a véletlenszerű vagy fals +20% edge-eket!
 */
export function robustnessGridTest(
  lhCenter: number,
  laCenter: number,
  marketProbPct: number,
  odds: number,
  spread: number = 0.25
): {
  verdict: 'ROBUSZTUS' | 'valószínű' | 'bizonytalan' | 'ELVETVE';
  minEdge: number;
  medianEdge: number;
  maxEdge: number;
  posPct: number;
} {
  const lhMin = Math.max(0.4, lhCenter - spread);
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
        // Modell valószínűség az adott piaci kimenetelre (például ha Hazai győzelem)
        const pModel = mk.home;
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
