import { MarketProbabilities, MatchOdds } from '../types/football';

/**
 * Poisson-eloszlás alapú valószínűségszámítás
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
 * Szimuláció a hazai és vendég várható gólokból (xG)
 */
export function calculateMarketProbabilities(
  homeXg: number,
  awayXg: number,
  homeAdvantageFactor: number = 1.15
): MarketProbabilities {
  const adjHomeXg = homeXg * homeAdvantageFactor;
  const adjAwayXg = awayXg;

  let homeWinProb = 0;
  let drawProb = 0;
  let awayWinProb = 0;
  let bttsProb = 0;
  let over15Prob = 0;
  let over25Prob = 0;
  let over35Prob = 0;
  
  // Első félidei gólok becslése (általában a teljes meccs góljainak ~45%-a)
  const fhHomeXg = adjHomeXg * 0.45;
  const fhAwayXg = adjAwayXg * 0.45;
  const fhNoGoalProb = poisson(0, fhHomeXg) * poisson(0, fhAwayXg);
  const fhOver05 = Math.round((1 - fhNoGoalProb) * 100);

  // Mátrix 0-tól 7 gólig mindkét csapatra
  for (let h = 0; h <= 7; h++) {
    for (let a = 0; a <= 7; a++) {
      const p = poisson(h, adjHomeXg) * poisson(a, adjAwayXg);
      
      if (h > a) homeWinProb += p;
      else if (h === a) drawProb += p;
      else awayWinProb += p;

      if (h > 0 && a > 0) bttsProb += p;
      if (h + a > 1.5) over15Prob += p;
      if (h + a > 2.5) over25Prob += p;
      if (h + a > 3.5) over35Prob += p;
    }
  }

  // Normalizálás 100%-ra a fő piacnál
  const total1X2 = homeWinProb + drawProb + awayWinProb;
  const normHome = Math.round((homeWinProb / total1X2) * 100);
  const normDraw = Math.round((drawProb / total1X2) * 100);
  const normAway = Math.max(1, 100 - normHome - normDraw);

  return {
    homeWin: normHome,
    draw: normDraw,
    awayWin: normAway,
    bttsYes: Math.min(95, Math.max(15, Math.round(bttsProb * 100))),
    over15: Math.min(95, Math.max(25, Math.round(over15Prob * 100))),
    over25: Math.min(90, Math.max(15, Math.round(over25Prob * 100))),
    over35: Math.min(80, Math.max(8, Math.round(over35Prob * 100))),
    fhOver05: Math.min(95, Math.max(30, fhOver05)),
  };
}

/**
 * Számolja a piacilag implikált esélyt és a várható értéket (Expected Value / EV)
 * Formula: EV = (Modell valószínűség * Odds) - 1
 */
export function calculateExpectedValue(aiProbabilityPct: number, odds: number): number {
  const p = aiProbabilityPct / 100;
  const ev = (p * odds) - 1;
  return Math.round(ev * 1000) / 10; // Pl. +14.2%
}

/**
 * Színkódoló segédfüggvény valószínűségi értékekhez (FootballTipster hőtérkép)
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
