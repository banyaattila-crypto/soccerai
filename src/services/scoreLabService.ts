import { Match } from '../types/football';
import {
  calculateDixonColesMatrix,
  computeDixonColesExpectedGoals,
  normalizeIntegerPercentages,
} from './predictionEngine';

export interface ScoreMatrixCell {
  homeGoals: number; // 0..4 (4 = 4+)
  awayGoals: number; // 0..4 (4 = 4+)
  probability: number; // 0..1
  pct: number; // pl. 11.8
  fairOdds: number; // 1 / prob
  zone: 'home' | 'draw' | 'away';
}

export interface TopScoreResult {
  homeScore: number;
  awayScore: number;
  probabilityPct: number;
  fairOdds: number;
  label: string;
  zone: 'home' | 'draw' | 'away';
}

export interface ScoreLabMatrixReport {
  matrix5x5: ScoreMatrixCell[][];
  topScores: TopScoreResult[];
  lh: number;
  la: number;
  rho: number;
  outcomeZones: {
    homeWinPct: number;
    drawPct: number;
    awayWinPct: number;
  };
  goalsDistribution: {
    under15Pct: number; // 0-1 gól
    mid23Pct: number;   // 2-3 gól
    over35Pct: number;  // 4+ gól
  };
  mostLikelyTotal: string;
}

export interface ScoreLabTeamComparisonReport {
  home: {
    name: string;
    shortName: string;
    logo: string;
    rank?: number;
    form: ('W' | 'D' | 'L')[];
    formPoints: number;
    formPct: number;
    xg: number;
    attackRating: number;
    defenseRating: number;
    goalsScoredAvg: number;
    goalsConcededAvg: number;
  };
  away: {
    name: string;
    shortName: string;
    logo: string;
    rank?: number;
    form: ('W' | 'D' | 'L')[];
    formPoints: number;
    formPct: number;
    xg: number;
    attackRating: number;
    defenseRating: number;
    goalsScoredAvg: number;
    goalsConcededAvg: number;
  };
  h2h: {
    hasHistory: boolean;
    totalMatches: number;
    homeWins: number;
    draws: number;
    awayWins: number;
    homeGoalsTotal: number;
    awayGoalsTotal: number;
    avgTotalGoals: number;
    bttsMatches: number;
    bttsPct: number;
    matches: {
      date: string;
      homeScore: number;
      awayScore: number;
      winner: 'home' | 'away' | 'draw';
    }[];
  };
  modelVerdict: {
    advantage: 'home' | 'away' | 'balanced';
    advantageTitle: string;
    keyInsight: string;
  };
}

/**
 * Kiszámolja a meccs Dixon-Coles Poisson valószínűségi mátrixát és a ScoreLab statisztikákat.
 */
export function getDixonColesScoreMatrix(match: Match): ScoreLabMatrixReport {
  // 1. Várható gólok (lh és la) meghatározása az egységes kanonikus modell szerint
  let lh = 1.45;
  let la = 1.15;
  let rho = match.quantAnalysis?.dixonColesRatings?.rho ?? -0.13;

  if (match.homeTeam.xgAvg && match.awayTeam.xgAvg) {
    // Ha a mérkőzéshez már kiszámolt xgAvg tartozik, azt használjuk közvetlenül
    lh = match.homeTeam.xgAvg;
    la = match.awayTeam.xgAvg;
  } else if (match.quantAnalysis?.dixonColesRatings?.isEmpiricallyFitted) {
    const dc = match.quantAnalysis.dixonColesRatings;
    const computed = computeDixonColesExpectedGoals({
      attackHome: dc.homeAttack,
      defenseHome: dc.homeDefense,
      attackAway: dc.awayAttack,
      defenseAway: dc.awayDefense,
      homeAdvantage: dc.homeAdvantage,
    });
    lh = computed.lh;
    la = computed.la;
    rho = dc.rho ?? -0.13;
  } else if (match.probabilities) {
    const totalGoals = 1.8 + (match.probabilities.over25 / 100) * 1.4;
    const homeShare =
      match.probabilities.homeWin /
      Math.max(1, match.probabilities.homeWin + match.probabilities.awayWin);
    lh = totalGoals * homeShare;
    la = totalGoals * (1 - homeShare);
  }

  // Biztonsági korlátok
  lh = Math.min(5.5, Math.max(0.2, Math.round(lh * 100) / 100));
  la = Math.min(5.5, Math.max(0.2, Math.round(la * 100) / 100));

  // MAXG x MAXG Dixon-Coles mátrix generálása
  const raw8x8 = calculateDixonColesMatrix(lh, la, rho);
  const N = raw8x8.length; // a mátrix mérete (MAXG), a 4+ cellák ennek a végéig összegzik a gólokat

  // 5x5 aggregáció (0, 1, 2, 3, 4+)
  const matrix5x5: ScoreMatrixCell[][] = [];
  for (let i = 0; i <= 4; i++) {
    const row: ScoreMatrixCell[] = [];
    for (let j = 0; j <= 4; j++) {
      let cellProb = 0;
      if (i < 4 && j < 4) {
        cellProb = raw8x8[i][j];
      } else if (i === 4 && j < 4) {
        for (let k = 4; k < N; k++) cellProb += raw8x8[k][j];
      } else if (i < 4 && j === 4) {
        for (let k = 4; k < N; k++) cellProb += raw8x8[i][k];
      } else {
        // i === 4 && j === 4
        for (let r = 4; r < N; r++) {
          for (let c = 4; c < N; c++) {
            cellProb += raw8x8[r][c];
          }
        }
      }

      const zone: 'home' | 'draw' | 'away' =
        i > j ? 'home' : i === j ? 'draw' : 'away';

      const pct = Math.round(cellProb * 1000) / 10;
      const fairOdds = Math.max(1.01, Math.round((1 / Math.max(0.001, cellProb)) * 100) / 100);

      row.push({
        homeGoals: i,
        awayGoals: j,
        probability: cellProb,
        pct,
        fairOdds,
        zone,
      });
    }
    matrix5x5.push(row);
  }

  // Top pontos végeredmények összegyűjtése (a raw mátrix első 5x5 pontos számaiból)
  const scoreCandidates: TopScoreResult[] = [];
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const prob = raw8x8[i][j];
      const pct = Math.round(prob * 1000) / 10;
      const fairOdds = Math.max(1.05, Math.round((1 / Math.max(0.001, prob)) * 100) / 100);
      const zone: 'home' | 'draw' | 'away' =
        i > j ? 'home' : i === j ? 'draw' : 'away';

      scoreCandidates.push({
        homeScore: i,
        awayScore: j,
        probabilityPct: pct,
        fairOdds,
        label: `${i} - ${j}`,
        zone,
      });
    }
  }

  scoreCandidates.sort((a, b) => b.probabilityPct - a.probabilityPct);
  const topScores = scoreCandidates.slice(0, 6);

  // Kimeneteli zónák
  let sumHome = 0;
  let sumDraw = 0;
  let sumAway = 0;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const p = raw8x8[i][j];
      if (i > j) sumHome += p;
      else if (i === j) sumDraw += p;
      else sumAway += p;
    }
  }

  // Gólszám-eloszlás (0-1, 2-3, 4+)
  let lowP = 0; // 0-1
  let midP = 0; // 2-3
  let highP = 0; // 4+
  const totalBins: Record<number, number> = {};

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const p = raw8x8[i][j];
      const sum = i + j;
      totalBins[sum] = (totalBins[sum] || 0) + p;
      if (sum <= 1) lowP += p;
      else if (sum <= 3) midP += p;
      else highP += p;
    }
  }

  let maxTotalGoals = 2;
  let maxTotalProb = 0;
  for (const [gStr, prob] of Object.entries(totalBins)) {
    if (prob > maxTotalProb) {
      maxTotalProb = prob;
      maxTotalGoals = Number(gStr);
    }
  }

  // Szigorú 100%-os partíció invariánsok a Hare-Niemeyer módszerrel
  const [normHomeWin, normDraw, normAwayWin] = normalizeIntegerPercentages([
    sumHome,
    sumDraw,
    sumAway,
  ]);
  const [normUnder15, normMid23, normOver35] = normalizeIntegerPercentages([
    lowP,
    midP,
    highP,
  ]);

  return {
    matrix5x5,
    topScores,
    lh,
    la,
    rho,
    outcomeZones: {
      homeWinPct: normHomeWin,
      drawPct: normDraw,
      awayWinPct: normAwayWin,
    },
    goalsDistribution: {
      under15Pct: normUnder15,
      mid23Pct: normMid23,
      over35Pct: normOver35,
    },
    mostLikelyTotal: `${maxTotalGoals} gól (${Math.round(maxTotalProb * 100)}%)`,
  };
}

/**
 * Számítja a forma pontszámát az utolsó 5 meccsből (W=3, D=1, L=0).
 */
export function calculateFormPoints(form?: ('W' | 'D' | 'L')[]): { points: number; pct: number } {
  if (!form || form.length === 0) {
    return { points: 7, pct: 47 }; // semleges alapértelmezett
  }
  let pts = 0;
  form.forEach((res) => {
    if (res === 'W') pts += 3;
    else if (res === 'D') pts += 1;
  });
  const maxPts = form.length * 3;
  const pct = Math.round((pts / Math.max(1, maxPts)) * 100);
  return { points: pts, pct };
}

/**
 * Összeállítja a csapat-összehasonlító jelentést és az egymás elleni múltat.
 */
export function getTeamComparisonStats(match: Match): ScoreLabTeamComparisonReport {
  const dc = match.quantAnalysis?.dixonColesRatings;

  const homeForm = calculateFormPoints(match.homeTeam.form);
  const awayForm = calculateFormPoints(match.awayTeam.form);

  const homeXg = match.homeTeam.xgAvg ?? (dc ? dc.homeAttack * (dc.homeAdvantage || 1.2) : 1.45);
  const awayXg = match.awayTeam.xgAvg ?? (dc ? dc.awayAttack : 1.15);

  const homeAttack = dc ? dc.homeAttack : (match.homeTeam.goalsScoredAvg ?? 1.35);
  const homeDefense = dc ? dc.homeDefense : (match.homeTeam.goalsConcededAvg ?? 1.05);

  const awayAttack = dc ? dc.awayAttack : (match.awayTeam.goalsScoredAvg ?? 1.15);
  const awayDefense = dc ? dc.awayDefense : (match.awayTeam.goalsConcededAvg ?? 1.25);

  // H2H elemzés
  const h2hList = match.h2h || [];
  let hWins = 0;
  let draws = 0;
  let aWins = 0;
  let hGoals = 0;
  let aGoals = 0;
  let bttsCount = 0;

  const formattedMatches = h2hList.map((item) => {
    hGoals += item.homeScore;
    aGoals += item.awayScore;
    if (item.homeScore > 0 && item.awayScore > 0) {
      bttsCount++;
    }

    let winner: 'home' | 'away' | 'draw' = 'draw';
    if (item.homeScore > item.awayScore) {
      winner = 'home';
      hWins++;
    } else if (item.awayScore > item.homeScore) {
      winner = 'away';
      aWins++;
    } else {
      draws++;
    }

    return {
      date: item.date,
      homeScore: item.homeScore,
      awayScore: item.awayScore,
      winner,
    };
  });

  const totalH2H = h2hList.length;
  const avgTotalGoals = totalH2H > 0
    ? Math.round(((hGoals + aGoals) / totalH2H) * 10) / 10
    : Math.round((homeXg + awayXg) * 10) / 10;
  const bttsPct = totalH2H > 0
    ? Math.round((bttsCount / totalH2H) * 100)
    : match.probabilities.bttsYes;

  // Modell értékelés
  let advantage: 'home' | 'away' | 'balanced' = 'balanced';
  let advantageTitle = 'Kiegyenlített erőviszonyok';
  let keyInsight = 'A két csapat statisztikai és forma-indexe szinte azonos szinten áll.';

  if (match.probabilities.homeWin >= match.probabilities.awayWin + 15) {
    advantage = 'home';
    advantageTitle = `${match.homeTeam.shortName || match.homeTeam.name} Hazai Előny`;
    keyInsight = `A hazai csapat magasabb xG-vel (${homeXg.toFixed(1)}) és jobb védekezési mutatóval rendelkezik.`;
  } else if (match.probabilities.awayWin >= match.probabilities.homeWin + 10) {
    advantage = 'away';
    advantageTitle = `${match.awayTeam.shortName || match.awayTeam.name} Vendég Erőfölény`;
    keyInsight = `A vendég csapat formája és támadó hatékonysága kompenzálja a hazai pályaelőnyt.`;
  }

  return {
    home: {
      name: match.homeTeam.name,
      shortName: match.homeTeam.shortName || match.homeTeam.name,
      logo: match.homeTeam.logo,
      rank: match.homeTeam.rank,
      form: match.homeTeam.form || ['W', 'D', 'W', 'L', 'W'],
      formPoints: homeForm.points,
      formPct: homeForm.pct,
      xg: homeXg,
      attackRating: homeAttack,
      defenseRating: homeDefense,
      goalsScoredAvg: match.homeTeam.goalsScoredAvg ?? homeAttack,
      goalsConcededAvg: match.homeTeam.goalsConcededAvg ?? homeDefense,
    },
    away: {
      name: match.awayTeam.name,
      shortName: match.awayTeam.shortName || match.awayTeam.name,
      logo: match.awayTeam.logo,
      rank: match.awayTeam.rank,
      form: match.awayTeam.form || ['D', 'W', 'L', 'W', 'D'],
      formPoints: awayForm.points,
      formPct: awayForm.pct,
      xg: awayXg,
      attackRating: awayAttack,
      defenseRating: awayDefense,
      goalsScoredAvg: match.awayTeam.goalsScoredAvg ?? awayAttack,
      goalsConcededAvg: match.awayTeam.goalsConcededAvg ?? awayDefense,
    },
    h2h: {
      hasHistory: totalH2H > 0,
      totalMatches: totalH2H,
      homeWins: hWins,
      draws,
      awayWins: aWins,
      homeGoalsTotal: hGoals,
      awayGoalsTotal: aGoals,
      avgTotalGoals,
      bttsMatches: bttsCount,
      bttsPct,
      matches: formattedMatches,
    },
    modelVerdict: {
      advantage,
      advantageTitle,
      keyInsight,
    },
  };
}
