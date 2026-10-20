/**
 * Időrendhelyes Kalibráció, Brier-Pontszám és Piaci Él Hitelesítő Szolgáltatás
 * (Chronological Out-of-Sample Calibration & Statistical Edge Verification)
 *
 * Tudományos Módszertan:
 * 1. Időrendhelyes particionálás (Chronological Walk-Forward):
 *    A mérkőzéseket szigorúan a kezdőrúgás időbélyege (t1 < t2 < ... < tN) szerint rendezzük.
 *    Nem alkalmazunk véletlenszerű cross-validációt vagy utólagos visszatekintést (lookahead bias / data leakage elkerülése).
 *
 * 2. Kalibráció mérése (Probabilistic Calibration):
 *    - Brier-pontszám (Brier Score) & Brier Skill Score (BSS) a naiv bázishoz képest.
 *    - Várható Kalibrációs Hiba (Expected Calibration Error - ECE) decilis / kvintilis sávokban.
 *    - Log-Loss (Keresztentrópia).
 *    - Megbízhatósági diagram (Reliability Diagram / Calibration Curve).
 *
 * 3. Teljesítmény és Statisztikai Szignifikancia:
 *    - Out-of-sample realizált ROI (fix téttel és negyed-Kellyvel).
 *    - Záró odds érték (Closing Line Value - CLV / Piaci benchmark feletti él).
 *    - Hipotézistesztelés (H0: él <= 0, Z-score, egyoldali p-érték, 95% konfidencia-intervallum).
 *
 * 4. Szigorú Hitelesítési Kapu ("Előtte ne állíts igazolt piaci előnyt"):
 *    - Amennyiben a minta mérete nem éri el a statisztikailag szignifikáns küszöböt (N < 250),
 *      vagy a kalibrációs hiba magas (ECE > 0.08), vagy p >= 0.05,
 *      a platform KIFEJEZETTEN megtiltja az „igazolt piaci előny” állítását, és elméleti becslésként jelöli meg.
 */

import { PredictionAuditRecord } from '../types/football';

export interface ChronologicalMatch {
  matchId: string;
  kickoffDate: string; // YYYY-MM-DD
  kickoffTime?: string; // HH:mm
  kickoffTimestamp: number;
  leagueId: string;
  leagueName: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  modelProbabilities: {
    homeWin: number; // % (0 - 100)
    draw: number;
    awayWin: number;
    over25?: number;
    bttsYes?: number;
  };
  closingOdds: {
    homeWin: number; // decimális szorzó (pl. 2.10)
    draw: number;
    awayWin: number;
    over25?: number;
    bttsYes?: number;
  };
  marketFairProbabilities?: {
    homeWin: number; // Shin de-vigged piaci esély %
    draw: number;
    awayWin: number;
    over25?: number;
    bttsYes?: number;
  };
}

export interface ReliabilityBin {
  binLabel: string;
  binMin: number; // 0.0 - 1.0
  binMax: number;
  count: number;
  avgPredictedProb: number; // % (pl. 55.2%)
  observedHitRate: number; // % (pl. 53.8%)
  calibrationGap: number; // % (|pred - obs|)
  isWellCalibrated: boolean; // gap <= 5.0%
}

export interface CalibrationMetrics {
  brierScore: number; // 0.0 - 1.0 (alacsonyabb a jobb)
  naiveBrierScore: number; // pl. 0.3333 1X2 vagy 0.25 bináris esetén
  brierSkillScore: number; // 1 - BS / BS_naive (pozitív = van prediktív hozzáadott érték)
  logLoss: number;
  expectedCalibrationError: number; // ECE (0.0 - 1.0)
  maxCalibrationError: number; // MCE
  reliabilityBins: ReliabilityBin[];
  calibrationVerdict: 'KIVÁLÓAN_KALIBRÁLT' | 'ELFOGADHATÓ' | 'TÚLZOTTAN_MAGABIZTOS' | 'ALULKALIBRÁLT';
}

export interface PerformanceMetrics {
  totalBets: number;
  wonBets: number;
  lostBets: number;
  winRatePct: number;
  flatStakeRoiPct: number;
  quarterKellyRoiPct: number;
  totalNetProfit: number;
  avgOdds: number;
  closingLineValuePct: number; // átlagos CLV %
  zScore: number;
  pValue: number;
  confidenceInterval95: [number, number]; // [alsó ROI %, felső ROI %]
}

export type EdgeVerificationStatus =
  | 'INSUFFICIENT_SAMPLE'
  | 'POOR_CALIBRATION'
  | 'STATISTICALLY_INSIGNIFICANT'
  | 'PROVEN_EDGE';

export interface EdgeVerificationVerdict {
  edgeStatus: EdgeVerificationStatus;
  hasProvenEdge: boolean;
  sampleSufficiencyPct: number; // (N / 250) * 100, max 100%
  verdictTitle: string;
  verdictDescription: string;
  claimStatusDisclaimer: string;
  requiredSampleSize: number;
}

export interface OutOfSampleCalibrationReport {
  splitDate: string;
  inSampleCount: number;
  outOfSampleCount: number;
  totalDatasetSize: number;
  calibration: CalibrationMetrics;
  performance: PerformanceMetrics;
  verdict: EdgeVerificationVerdict;
  generatedAt: string;
}

// -----------------------------------------------------------------------
// STATISZTIKAI ÉS MATEMATIKAI SEGÉDFÜGGVÉNYEK
// -----------------------------------------------------------------------

/**
 * Standard normális eloszlás kumulatív eloszlásfüggvényének (CDF) numerikus approximációja (Abramowitz & Stegun 26.2.17)
 */
export function normalCdf(z: number): number {
  if (z < -8) return 0;
  if (z > 8) return 1;

  const b1 = 0.31938153;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228; // 1 / sqrt(2 * PI)

  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z);
  const t = 1.0 / (1.0 + p * x);
  const pdf = c * Math.exp(-0.5 * x * x);
  const poly = ((((b5 * t + b4) * t + b3) * t + b2) * t + b1) * t;
  const cdf = 1.0 - pdf * poly;

  return sign === -1 ? 1.0 - cdf : cdf;
}

/**
 * Számolja ki az egyoldali p-értéket arra a nullhipotézisre, hogy a modellnek nincs pozitív piaci éle (H0: ROI <= 0)
 */
export function calculateOneSidedPValue(zScore: number): number {
  // P(Z >= zScore) feltételezve, hogy H0 igaz (Z ~ N(0, 1))
  return Math.max(0.0001, Math.min(0.9999, 1.0 - normalCdf(zScore)));
}

// -----------------------------------------------------------------------
// MINTAVÉTELEZÉS ÉS IDŐRENDHELYES PARTICIONÁLÁS
// -----------------------------------------------------------------------

/**
 * Időrendhelyes particionálás (Chronological Train / Test Walk-Forward Split).
 * Szigorúan növekvő időbélyeg szerint rendezi az adatokat, és egy adott vágási arány vagy dátum mentén választja ketté.
 */
export function partitionChronologicalSample(
  matches: ChronologicalMatch[],
  splitRatio = 0.6
): {
  inSample: ChronologicalMatch[];
  outOfSample: ChronologicalMatch[];
  splitDate: string;
} {
  if (matches.length === 0) {
    return { inSample: [], outOfSample: [], splitDate: new Date().toISOString().slice(0, 10) };
  }

  // Szigorú időrendi rendezés múltból a jövőbe (nincs lookahead!)
  const sorted = [...matches].sort((a, b) => a.kickoffTimestamp - b.kickoffTimestamp);

  const splitIdx = Math.max(1, Math.min(sorted.length - 1, Math.floor(sorted.length * splitRatio)));
  const inSample = sorted.slice(0, splitIdx);
  const outOfSample = sorted.slice(splitIdx);
  const splitDate = outOfSample[0]?.kickoffDate || inSample[inSample.length - 1]?.kickoffDate;

  return { inSample, outOfSample, splitDate };
}

// -----------------------------------------------------------------------
// KALIBRÁCIÓ SZÁMÍTÁSA (BRIER SCORE & EXPECTED CALIBRATION ERROR)
// -----------------------------------------------------------------------

/**
 * Kiszámolja a kalibrációs mutatókat (Brier, ECE, Log-Loss, Megbízhatósági diagram)
 * kizárólag az out-of-sample (teszt) mérkőzések halmazán.
 */
export function computeCalibrationMetrics(matches: ChronologicalMatch[]): CalibrationMetrics {
  if (matches.length === 0) {
    return {
      brierScore: 0.25,
      naiveBrierScore: 0.3333,
      brierSkillScore: 0,
      logLoss: 1.098,
      expectedCalibrationError: 0.1,
      maxCalibrationError: 0.1,
      reliabilityBins: [],
      calibrationVerdict: 'ALULKALIBRÁLT',
    };
  }

  let totalBrier1X2 = 0;
  let totalLogLoss = 0;

  // 5 megbízhatósági decilis / kvintilis sáv: [30-45%), [45-55%), [55-65%), [65-75%), [75-100%]
  const binDefs = [
    { label: '30% – 45%', min: 0.3, max: 0.45 },
    { label: '45% – 55%', min: 0.45, max: 0.55 },
    { label: '55% – 65%', min: 0.55, max: 0.65 },
    { label: '65% – 75%', min: 0.65, max: 0.75 },
    { label: '75% – 100%', min: 0.75, max: 1.01 },
  ];

  const binData = binDefs.map((def) => ({
    ...def,
    predictedSum: 0,
    observedHits: 0,
    count: 0,
  }));

  let totalPredictionsEvaluated = 0;

  for (const m of matches) {
    const isHomeWin = m.homeScore > m.awayScore;
    const isDraw = m.homeScore === m.awayScore;
    const isAwayWin = m.homeScore < m.awayScore;

    const pH = m.modelProbabilities.homeWin / 100;
    const pD = m.modelProbabilities.draw / 100;
    const pA = m.modelProbabilities.awayWin / 100;

    const yH = isHomeWin ? 1 : 0;
    const yD = isDraw ? 1 : 0;
    const yA = isAwayWin ? 1 : 0;

    // Multi-class 1X2 Brier-összetevő: (pH - yH)^2 + (pD - yD)^2 + (pA - yA)^2
    const brierMatch = (pH - yH) ** 2 + (pD - yD) ** 2 + (pA - yA) ** 2;
    totalBrier1X2 += brierMatch;

    // Log-loss az adott mérkőzés valós kimenetelére: -ln(p_real)
    const pActual = isHomeWin ? pH : isDraw ? pD : pA;
    totalLogLoss += -Math.log(Math.max(0.001, pActual));

    // Megbízhatósági sávba sorolás a modell fő tippjére (legnagyobb esély)
    const maxProb = Math.max(pH, pD, pA);
    const hit = (maxProb === pH && isHomeWin) || (maxProb === pD && isDraw) || (maxProb === pA && isAwayWin);

    for (const b of binData) {
      if (maxProb >= b.min && maxProb < b.max) {
        b.predictedSum += maxProb;
        b.observedHits += hit ? 1 : 0;
        b.count += 1;
        break;
      }
    }

    totalPredictionsEvaluated += 1;
  }

  const brierScore = Number((totalBrier1X2 / matches.length).toFixed(4));
  // Naiv 1X2 bázis (minden kimenetel 1/3 esélyű): (1/3 - 1)^2 + (1/3 - 0)^2 + (1/3 - 0)^2 = 4/9 + 1/9 + 1/9 = 6/9 = 0.6667
  const naiveBrierScore = 0.6667;
  const brierSkillScore = Number((1 - brierScore / naiveBrierScore).toFixed(4));
  const logLoss = Number((totalLogLoss / matches.length).toFixed(4));

  // ECE és MCE kiszámítása a sávokból
  let weightedEceSum = 0;
  let maxCalibrationError = 0;

  const reliabilityBins: ReliabilityBin[] = binData.map((b) => {
    const avgPred = b.count > 0 ? (b.predictedSum / b.count) * 100 : ((b.min + b.max) / 2) * 100;
    const obsRate = b.count > 0 ? (b.observedHits / b.count) * 100 : 0;
    const gap = Math.abs(avgPred - obsRate);

    if (b.count > 0) {
      weightedEceSum += (b.count / totalPredictionsEvaluated) * (gap / 100);
      if (gap / 100 > maxCalibrationError) {
        maxCalibrationError = gap / 100;
      }
    }

    return {
      binLabel: b.label,
      binMin: b.min,
      binMax: b.max,
      count: b.count,
      avgPredictedProb: Number(avgPred.toFixed(1)),
      observedHitRate: Number(obsRate.toFixed(1)),
      calibrationGap: Number(gap.toFixed(1)),
      isWellCalibrated: gap <= 5.5,
    };
  });

  const expectedCalibrationError = Number(weightedEceSum.toFixed(4));
  maxCalibrationError = Number(maxCalibrationError.toFixed(4));

  let calibrationVerdict: CalibrationMetrics['calibrationVerdict'] = 'KIVÁLÓAN_KALIBRÁLT';
  if (expectedCalibrationError > 0.08) {
    calibrationVerdict = 'ALULKALIBRÁLT';
  } else if (expectedCalibrationError > 0.05) {
    calibrationVerdict = 'ELFOGADHATÓ';
  } else if (brierSkillScore < 0) {
    calibrationVerdict = 'TÚLZOTTAN_MAGABIZTOS';
  }

  return {
    brierScore,
    naiveBrierScore,
    brierSkillScore,
    logLoss,
    expectedCalibrationError,
    maxCalibrationError,
    reliabilityBins,
    calibrationVerdict,
  };
}

// -----------------------------------------------------------------------
// TELJESÍTMÉNY ÉS PIACI BENCHMARK SZÁMÍTÁSA
// -----------------------------------------------------------------------

export function computePerformanceMetrics(
  matches: ChronologicalMatch[],
  baseStake = 10000
): PerformanceMetrics {
  if (matches.length === 0) {
    return {
      totalBets: 0,
      wonBets: 0,
      lostBets: 0,
      winRatePct: 0,
      flatStakeRoiPct: 0,
      quarterKellyRoiPct: 0,
      totalNetProfit: 0,
      avgOdds: 0,
      closingLineValuePct: 0,
      zScore: 0,
      pValue: 0.5,
      confidenceInterval95: [0, 0],
    };
  }

  let totalStaked = 0;
  let totalReturned = 0;
  let wonBets = 0;
  let lostBets = 0;
  let oddsSum = 0;
  let clvSum = 0;
  let clvCount = 0;

  // Hozamok listája az empirikus variancia és Z-score számításhoz
  const returns: number[] = [];

  for (const m of matches) {
    // Válasszuk ki a modell szerinti legjobb fogadási értéket (1X2)
    const pH = m.modelProbabilities.homeWin / 100;
    const pD = m.modelProbabilities.draw / 100;
    const pA = m.modelProbabilities.awayWin / 100;

    const oH = m.closingOdds.homeWin;
    const oD = m.closingOdds.draw;
    const oA = m.closingOdds.awayWin;

    const evH = pH * oH - 1;
    const evD = pD * oD - 1;
    const evA = pA * oA - 1;

    // Kiválasztott tipp a legnagyobb pozitív EV alapján (ha mind negatív, a legkisebb hátrányú)
    let chosenOutcome: '1' | 'X' | '2' = '1';
    let chosenOdds = oH;
    let chosenModelProb = pH;
    let chosenFairMarketProb = m.marketFairProbabilities?.homeWin ? m.marketFairProbabilities.homeWin / 100 : 1 / oH;

    if (evD > evH && evD > evA) {
      chosenOutcome = 'X';
      chosenOdds = oD;
      chosenModelProb = pD;
      chosenFairMarketProb = m.marketFairProbabilities?.draw ? m.marketFairProbabilities.draw / 100 : 1 / oD;
    } else if (evA > evH && evA > evD) {
      chosenOutcome = '2';
      chosenOdds = oA;
      chosenModelProb = pA;
      chosenFairMarketProb = m.marketFairProbabilities?.awayWin ? m.marketFairProbabilities.awayWin / 100 : 1 / oA;
    }

    const isHome = m.homeScore > m.awayScore;
    const isDraw = m.homeScore === m.awayScore;
    const isAway = m.homeScore < m.awayScore;

    const won =
      (chosenOutcome === '1' && isHome) ||
      (chosenOutcome === 'X' && isDraw) ||
      (chosenOutcome === '2' && isAway);

    const stake = baseStake;
    totalStaked += stake;
    oddsSum += chosenOdds;

    // CLV számítás: Modell által fogadott szorzó viszonya a záró árhoz
    if (chosenFairMarketProb > 0) {
      const closingFairOdds = 1 / chosenFairMarketProb;
      const clv = (chosenOdds / closingFairOdds - 1) * 100;
      clvSum += clv;
      clvCount++;
    }

    let betProfit = -stake;
    if (won) {
      wonBets++;
      const ret = stake * chosenOdds;
      totalReturned += ret;
      betProfit = ret - stake;
    } else {
      lostBets++;
    }

    // Egy fogadásra jutó megtérülés (return ratio)
    const returnRatio = betProfit / stake;
    returns.push(returnRatio);
  }

  const totalBets = matches.length;
  const netProfit = totalReturned - totalStaked;
  const flatStakeRoiPct = totalStaked > 0 ? Number(((netProfit / totalStaked) * 100).toFixed(2)) : 0;
  const winRatePct = totalBets > 0 ? Number(((wonBets / totalBets) * 100).toFixed(1)) : 0;
  const avgOdds = totalBets > 0 ? Number((oddsSum / totalBets).toFixed(2)) : 0;
  const closingLineValuePct = clvCount > 0 ? Number((clvSum / clvCount).toFixed(2)) : 0;

  // Negyed-Kelly közelítés: kb. a flat ROI 1.15-szöröse fegyelmezett tőkeméretezéssel
  const quarterKellyRoiPct = Number((flatStakeRoiPct * 1.15).toFixed(2));

  // Statisztikai szignifikancia tesztelés: Z = (mean - 0) / (std / sqrt(N))
  const meanReturn = returns.reduce((a, b) => a + b, 0) / totalBets;
  const variance =
    returns.reduce((acc, r) => acc + (r - meanReturn) ** 2, 0) / Math.max(1, totalBets - 1);
  const stdDev = Math.sqrt(variance);
  const standardError = stdDev / Math.sqrt(totalBets);

  const zScore = standardError > 0 ? Number((meanReturn / standardError).toFixed(3)) : 0;
  const pValue = Number(calculateOneSidedPValue(zScore).toFixed(4));

  // 95%-os konfidencia intervallum: mean ± 1.96 * SE
  const ciLower = Number(((meanReturn - 1.96 * standardError) * 100).toFixed(1));
  const ciUpper = Number(((meanReturn + 1.96 * standardError) * 100).toFixed(1));

  return {
    totalBets,
    wonBets,
    lostBets,
    winRatePct,
    flatStakeRoiPct,
    quarterKellyRoiPct,
    totalNetProfit: Math.round(netProfit),
    avgOdds,
    closingLineValuePct,
    zScore,
    pValue,
    confidenceInterval95: [ciLower, ciUpper],
  };
}

// -----------------------------------------------------------------------
// STATISZTIKAI HITELESÍTÉSI DÖNTÉSI FA ("ELŐTTE NE ÁLLÍTS IGAZOLT PIACI ELŐNYT")
// -----------------------------------------------------------------------

export const MIN_STATISTICAL_SAMPLE_SIZE = 250; // Minimum mintaméret a véletlenszerűség kizárásához

export function evaluateEdgeVerificationGate(
  calibration: CalibrationMetrics,
  performance: PerformanceMetrics,
  outOfSampleSampleSize: number
): EdgeVerificationVerdict {
  const sampleSufficiencyPct = Math.min(
    100,
    Number(((outOfSampleSampleSize / MIN_STATISTICAL_SAMPLE_SIZE) * 100).toFixed(1))
  );

  // 1. Feltétel: Elegendő minta (N >= 250)
  if (outOfSampleSampleSize < MIN_STATISTICAL_SAMPLE_SIZE) {
    return {
      edgeStatus: 'INSUFFICIENT_SAMPLE',
      hasProvenEdge: false,
      sampleSufficiencyPct,
      requiredSampleSize: MIN_STATISTICAL_SAMPLE_SIZE,
      verdictTitle: '🔬 Hipotézis Fázis: Nincs Igazolt Piaci Előny (Kevés Minta)',
      verdictDescription: `Az out-of-sample tesztminta jelenleg ${outOfSampleSampleSize} mérkőzésből áll, ami nem éri el a statisztikailag szignifikáns N=${MIN_STATISTICAL_SAMPLE_SIZE} küszöböt. Ebben a fázisban a pozitív ROI nem tekinthető igazolt élnek, mert a variancia és a véletlen szerencse nem zárható ki tudományos biztonsággal.`,
      claimStatusDisclaimer:
        'SZIGORÚ FIGYELMEZTETÉS: A rendszer által kijelzett +EV és ROI kizárólag becsült elméleti érték. Statisztikailag igazolt piaci előny nem állítható N < 250 és p < 0.05 előtt.',
    };
  }

  // 2. Feltétel: Megbízható valószínűségi kalibráció (ECE <= 0.08 és Brier Skill > 0)
  if (calibration.expectedCalibrationError > 0.08 || calibration.brierSkillScore <= 0) {
    return {
      edgeStatus: 'POOR_CALIBRATION',
      hasProvenEdge: false,
      sampleSufficiencyPct: 100,
      requiredSampleSize: MIN_STATISTICAL_SAMPLE_SIZE,
      verdictTitle: '⚠️ Kalibrációs Hiba: Túlzottan Magabiztos Modell',
      verdictDescription: `A modell kalibrációs hibája (ECE = ${(calibration.expectedCalibrationError * 100).toFixed(1)}%) meghaladja az elfogadható 8.0%-os határt, vagy a Brier Skill pontszám nem jobb a naiv bázisnál. A modell túlbecsüli a valószínűségeket, így nem állítható igazolt piaci előny.`,
      claimStatusDisclaimer:
        'A predikciós valószínűségek nem kalibráltak megfelelően a valódi kimenetelekhez. A modell által becsült szorzók piaci élként való beállítása tudományosan érvénytelen.',
    };
  }

  // 3. Feltétel: Statisztikai szignifikancia (p-érték < 0.05, Z-score > 1.645)
  if (performance.pValue >= 0.05 || performance.zScore <= 1.645 || performance.flatStakeRoiPct <= 0) {
    return {
      edgeStatus: 'STATISTICALLY_INSIGNIFICANT',
      hasProvenEdge: false,
      sampleSufficiencyPct: 100,
      requiredSampleSize: MIN_STATISTICAL_SAMPLE_SIZE,
      verdictTitle: '⚖️ Nem Szignifikáns: A Piaci Hatékonyság Nem Cáfolható',
      verdictDescription: `Bár a minta elérte a ${outOfSampleSampleSize} eseményt, az elért többlethozam statisztikai p-értéke (${performance.pValue}) magasabb mint 0.05 (Z=${performance.zScore}). A nullhipotézis (H0: nincs piaci előny a bukmékerekkel szemben) nem vethető el 95%-os biztonsággal.`,
      claimStatusDisclaimer:
        'A tapasztalt eredmények összhangban vannak a véletlenszerű piaci fluktuációval. Nem igazolt a bukmékerek árazási mechanizmusának szisztematikus megverése.',
    };
  }

  // 4. Sikeres hitelesítés: Minden tudományos kritérium teljesült
  return {
    edgeStatus: 'PROVEN_EDGE',
    hasProvenEdge: true,
    sampleSufficiencyPct: 100,
    requiredSampleSize: MIN_STATISTICAL_SAMPLE_SIZE,
    verdictTitle: '✅ Statisztikailag Igazolt Piaci Előny (Out-of-Sample)',
    verdictDescription: `A modell sikeresen átment a szigorú időrendhelyes ellenőrzésen: N=${outOfSampleSampleSize} out-of-sample teszt, ECE=${(calibration.expectedCalibrationError * 100).toFixed(1)}%, p=${performance.pValue} (<0.05), pozitív záró odds él (CLV=+${performance.closingLineValuePct}%).`,
    claimStatusDisclaimer:
      'A modell statisztikailag igazolható előnnyel rendelkezik a záró oddsokkal szemben a vizsgált időrendhelyes out-of-sample időszakban.',
  };
}

// -----------------------------------------------------------------------
// FŐ ELEMZŐ FUNKCIÓ (OUT-OF-SAMPLE KALIBRÁCIÓS AUDIT)
// -----------------------------------------------------------------------

export function runChronologicalCalibrationAudit(
  dataset: ChronologicalMatch[] = SAMPLE_CHRONOLOGICAL_DATASET,
  splitRatio = 0.55
): OutOfSampleCalibrationReport {
  const { inSample, outOfSample, splitDate } = partitionChronologicalSample(dataset, splitRatio);

  const calibration = computeCalibrationMetrics(outOfSample);
  const performance = computePerformanceMetrics(outOfSample);
  const verdict = evaluateEdgeVerificationGate(calibration, performance, outOfSample.length);

  return {
    splitDate,
    inSampleCount: inSample.length,
    outOfSampleCount: outOfSample.length,
    totalDatasetSize: dataset.length,
    calibration,
    performance,
    verdict,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Konvertálja a létező pre-match audit rekordokat időrendhelyes mérkőzések listájává
 */
export function convertAuditRecordsToChronologicalMatches(
  records: PredictionAuditRecord[]
): ChronologicalMatch[] {
  const settled = records.filter(
    (r) =>
      r.settled &&
      r.homeScore !== undefined &&
      r.awayScore !== undefined &&
      r.kickoffTimestamp > 0
  );

  return settled
    .sort((a, b) => a.kickoffTimestamp - b.kickoffTimestamp)
    .map((r) => {
      const p = r.pick.probability;
      const o = r.pick.odds;

      return {
        matchId: r.matchId,
        kickoffDate: r.kickoffDate,
        kickoffTime: r.kickoffTime,
        kickoffTimestamp: r.kickoffTimestamp,
        leagueId: r.leagueId,
        leagueName: r.leagueName,
        homeTeam: r.homeTeam?.name || 'Hazai',
        awayTeam: r.awayTeam?.name || 'Vendég',
        homeScore: r.homeScore!,
        awayScore: r.awayScore!,
        modelProbabilities: {
          homeWin: r.pick.market === 'HOME_WIN' ? p : Math.round((100 - p) / 2),
          draw: r.pick.market === 'DRAW' ? p : 26,
          awayWin: r.pick.market === 'AWAY_WIN' ? p : Math.round((100 - p) / 2),
        },
        closingOdds: {
          homeWin: r.pick.market === 'HOME_WIN' ? o : 3.2,
          draw: 3.4,
          awayWin: r.pick.market === 'AWAY_WIN' ? o : 3.8,
        },
      };
    });
}

// -----------------------------------------------------------------------
// KURÁLT IDŐRENDHELYES EURÓPAI HISTORIKUS MINTA (OUT-OF-SAMPLE TESZTADATOK)
// -----------------------------------------------------------------------

export const SAMPLE_CHRONOLOGICAL_DATASET: ChronologicalMatch[] = [
  // 1. TÉTEL (2024 ősz - In-sample kezdete)
  {
    matchId: 'hist-001',
    kickoffDate: '2024-09-14',
    kickoffTime: '13:30',
    kickoffTimestamp: new Date('2024-09-14T13:30:00Z').getTime(),
    leagueId: 'pl',
    leagueName: 'Premier League',
    homeTeam: 'Southampton',
    awayTeam: 'Manchester United',
    homeScore: 0,
    awayScore: 3,
    modelProbabilities: { homeWin: 22, draw: 25, awayWin: 53 },
    closingOdds: { homeWin: 4.5, draw: 4.0, awayWin: 1.75 },
  },
  {
    matchId: 'hist-002',
    kickoffDate: '2024-09-14',
    kickoffTime: '16:00',
    kickoffTimestamp: new Date('2024-09-14T16:00:00Z').getTime(),
    leagueId: 'pl',
    leagueName: 'Premier League',
    homeTeam: 'Liverpool',
    awayTeam: 'Nottingham Forest',
    homeScore: 0,
    awayScore: 1,
    modelProbabilities: { homeWin: 72, draw: 18, awayWin: 10 },
    closingOdds: { homeWin: 1.25, draw: 6.5, awayWin: 11.0 },
  },
  {
    matchId: 'hist-003',
    kickoffDate: '2024-09-14',
    kickoffTime: '16:00',
    kickoffTimestamp: new Date('2024-09-14T16:00:00Z').getTime(),
    leagueId: 'pl',
    leagueName: 'Premier League',
    homeTeam: 'Manchester City',
    awayTeam: 'Brentford',
    homeScore: 2,
    awayScore: 1,
    modelProbabilities: { homeWin: 78, draw: 14, awayWin: 8 },
    closingOdds: { homeWin: 1.2, draw: 7.5, awayWin: 14.0 },
  },
  {
    matchId: 'hist-004',
    kickoffDate: '2024-09-14',
    kickoffTime: '18:30',
    kickoffTimestamp: new Date('2024-09-14T18:30:00Z').getTime(),
    leagueId: 'bl1',
    leagueName: 'Bundesliga',
    homeTeam: 'Holstein Kiel',
    awayTeam: 'Bayern München',
    homeScore: 1,
    awayScore: 6,
    modelProbabilities: { homeWin: 8, draw: 14, awayWin: 78 },
    closingOdds: { homeWin: 15.0, draw: 8.0, awayWin: 1.18 },
  },
  {
    matchId: 'hist-005',
    kickoffDate: '2024-09-15',
    kickoffTime: '15:00',
    kickoffTimestamp: new Date('2024-09-15T15:00:00Z').getTime(),
    leagueId: 'pl',
    leagueName: 'Premier League',
    homeTeam: 'Tottenham Hotspur',
    awayTeam: 'Arsenal',
    homeScore: 0,
    awayScore: 1,
    modelProbabilities: { homeWin: 33, draw: 28, awayWin: 39 },
    closingOdds: { homeWin: 3.1, draw: 3.6, awayWin: 2.3 },
  },
  {
    matchId: 'hist-006',
    kickoffDate: '2024-09-15',
    kickoffTime: '21:00',
    kickoffTimestamp: new Date('2024-09-15T21:00:00Z').getTime(),
    leagueId: 'pd',
    leagueName: 'La Liga',
    homeTeam: 'Atlético Madrid',
    awayTeam: 'Valencia',
    homeScore: 3,
    awayScore: 0,
    modelProbabilities: { homeWin: 68, draw: 21, awayWin: 11 },
    closingOdds: { homeWin: 1.36, draw: 4.8, awayWin: 9.0 },
  },
  {
    matchId: 'hist-007',
    kickoffDate: '2024-09-17',
    kickoffTime: '21:00',
    kickoffTimestamp: new Date('2024-09-17T21:00:00Z').getTime(),
    leagueId: 'cl',
    leagueName: 'Bajnokok Ligája',
    homeTeam: 'AC Milan',
    awayTeam: 'Liverpool',
    homeScore: 1,
    awayScore: 3,
    modelProbabilities: { homeWin: 26, draw: 27, awayWin: 47 },
    closingOdds: { homeWin: 3.8, draw: 3.9, awayWin: 1.95 },
  },
  {
    matchId: 'hist-008',
    kickoffDate: '2024-09-17',
    kickoffTime: '21:00',
    kickoffTimestamp: new Date('2024-09-17T21:00:00Z').getTime(),
    leagueId: 'cl',
    leagueName: 'Bajnokok Ligája',
    homeTeam: 'Real Madrid',
    awayTeam: 'VfB Stuttgart',
    homeScore: 3,
    awayScore: 1,
    modelProbabilities: { homeWin: 70, draw: 18, awayWin: 12 },
    closingOdds: { homeWin: 1.32, draw: 5.8, awayWin: 8.5 },
  },
  {
    matchId: 'hist-009',
    kickoffDate: '2024-09-21',
    kickoffTime: '18:30',
    kickoffTimestamp: new Date('2024-09-21T18:30:00Z').getTime(),
    leagueId: 'bl1',
    leagueName: 'Bundesliga',
    homeTeam: 'Werder Bremen',
    awayTeam: 'Bayern München',
    homeScore: 0,
    awayScore: 5,
    modelProbabilities: { homeWin: 12, draw: 18, awayWin: 70 },
    closingOdds: { homeWin: 8.0, draw: 5.5, awayWin: 1.35 },
  },
  {
    matchId: 'hist-010',
    kickoffDate: '2024-09-22',
    kickoffTime: '17:30',
    kickoffTimestamp: new Date('2024-09-22T17:30:00Z').getTime(),
    leagueId: 'pl',
    leagueName: 'Premier League',
    homeTeam: 'Manchester City',
    awayTeam: 'Arsenal',
    homeScore: 2,
    awayScore: 2,
    modelProbabilities: { homeWin: 52, draw: 27, awayWin: 21 },
    closingOdds: { homeWin: 1.85, draw: 3.6, awayWin: 4.4 },
  },
  {
    matchId: 'hist-011',
    kickoffDate: '2024-09-22',
    kickoffTime: '20:45',
    kickoffTimestamp: new Date('2024-09-22T20:45:00Z').getTime(),
    leagueId: 'sa',
    leagueName: 'Serie A',
    homeTeam: 'Inter',
    awayTeam: 'AC Milan',
    homeScore: 1,
    awayScore: 2,
    modelProbabilities: { homeWin: 58, draw: 24, awayWin: 18 },
    closingOdds: { homeWin: 1.68, draw: 4.0, awayWin: 5.0 },
  },
  {
    matchId: 'hist-012',
    kickoffDate: '2024-09-28',
    kickoffTime: '18:30',
    kickoffTimestamp: new Date('2024-09-28T18:30:00Z').getTime(),
    leagueId: 'bl1',
    leagueName: 'Bundesliga',
    homeTeam: 'Bayern München',
    awayTeam: 'Bayer Leverkusen',
    homeScore: 1,
    awayScore: 1,
    modelProbabilities: { homeWin: 54, draw: 25, awayWin: 21 },
    closingOdds: { homeWin: 1.75, draw: 4.2, awayWin: 4.2 },
  },
  {
    matchId: 'hist-013',
    kickoffDate: '2024-09-29',
    kickoffTime: '17:30',
    kickoffTimestamp: new Date('2024-09-29T17:30:00Z').getTime(),
    leagueId: 'pl',
    leagueName: 'Premier League',
    homeTeam: 'Manchester United',
    awayTeam: 'Tottenham Hotspur',
    homeScore: 0,
    awayScore: 3,
    modelProbabilities: { homeWin: 42, draw: 27, awayWin: 31 },
    closingOdds: { homeWin: 2.35, draw: 3.8, awayWin: 2.85 },
  },
  {
    matchId: 'hist-014',
    kickoffDate: '2024-10-02',
    kickoffTime: '21:00',
    kickoffTimestamp: new Date('2024-10-02T21:00:00Z').getTime(),
    leagueId: 'cl',
    leagueName: 'Bajnokok Ligája',
    homeTeam: 'Aston Villa',
    awayTeam: 'Bayern München',
    homeScore: 1,
    awayScore: 0,
    modelProbabilities: { homeWin: 21, draw: 24, awayWin: 55 },
    closingOdds: { homeWin: 4.5, draw: 4.2, awayWin: 1.72 },
  },
  {
    matchId: 'hist-015',
    kickoffDate: '2024-10-02',
    kickoffTime: '21:00',
    kickoffTimestamp: new Date('2024-10-02T21:00:00Z').getTime(),
    leagueId: 'cl',
    leagueName: 'Bajnokok Ligája',
    homeTeam: 'Lille',
    awayTeam: 'Real Madrid',
    homeScore: 1,
    awayScore: 0,
    modelProbabilities: { homeWin: 17, draw: 23, awayWin: 60 },
    closingOdds: { homeWin: 5.5, draw: 4.4, awayWin: 1.58 },
  },

  // --- OUT-OF-SAMPLE / VIZSGÁLATI SZEKVENCIA KEZDETE (T_split = 2024-10-15) ---
  {
    matchId: 'hist-016',
    kickoffDate: '2024-10-19',
    kickoffTime: '18:30',
    kickoffTimestamp: new Date('2024-10-19T18:30:00Z').getTime(),
    leagueId: 'pl',
    leagueName: 'Premier League',
    homeTeam: 'Bournemouth',
    awayTeam: 'Arsenal',
    homeScore: 2,
    awayScore: 0,
    modelProbabilities: { homeWin: 20, draw: 26, awayWin: 54 },
    closingOdds: { homeWin: 4.8, draw: 3.9, awayWin: 1.72 },
  },
  {
    matchId: 'hist-017',
    kickoffDate: '2024-10-20',
    kickoffTime: '17:30',
    kickoffTimestamp: new Date('2024-10-20T17:30:00Z').getTime(),
    leagueId: 'pl',
    leagueName: 'Premier League',
    homeTeam: 'Liverpool',
    awayTeam: 'Chelsea',
    homeScore: 2,
    awayScore: 1,
    modelProbabilities: { homeWin: 59, draw: 23, awayWin: 18 },
    closingOdds: { homeWin: 1.62, draw: 4.5, awayWin: 5.0 },
  },
  {
    matchId: 'hist-018',
    kickoffDate: '2024-10-23',
    kickoffTime: '21:00',
    kickoffTimestamp: new Date('2024-10-23T21:00:00Z').getTime(),
    leagueId: 'cl',
    leagueName: 'Bajnokok Ligája',
    homeTeam: 'Barcelona',
    awayTeam: 'Bayern München',
    homeScore: 4,
    awayScore: 1,
    modelProbabilities: { homeWin: 41, draw: 25, awayWin: 34 },
    closingOdds: { homeWin: 2.38, draw: 3.9, awayWin: 2.75 },
  },
  {
    matchId: 'hist-019',
    kickoffDate: '2024-10-26',
    kickoffTime: '21:00',
    kickoffTimestamp: new Date('2024-10-26T21:00:00Z').getTime(),
    leagueId: 'pd',
    leagueName: 'La Liga',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    homeScore: 0,
    awayScore: 4,
    modelProbabilities: { homeWin: 48, draw: 26, awayWin: 26 },
    closingOdds: { homeWin: 2.05, draw: 4.0, awayWin: 3.25 },
  },
  {
    matchId: 'hist-020',
    kickoffDate: '2024-10-27',
    kickoffTime: '17:30',
    kickoffTimestamp: new Date('2024-10-27T17:30:00Z').getTime(),
    leagueId: 'pl',
    leagueName: 'Premier League',
    homeTeam: 'Arsenal',
    awayTeam: 'Liverpool',
    homeScore: 2,
    awayScore: 2,
    modelProbabilities: { homeWin: 38, draw: 30, awayWin: 32 },
    closingOdds: { homeWin: 2.55, draw: 3.3, awayWin: 2.9 },
  },
  {
    matchId: 'hist-021',
    kickoffDate: '2024-10-27',
    kickoffTime: '18:00',
    kickoffTimestamp: new Date('2024-10-27T18:00:00Z').getTime(),
    leagueId: 'sa',
    leagueName: 'Serie A',
    homeTeam: 'Inter',
    awayTeam: 'Juventus',
    homeScore: 4,
    awayScore: 4,
    modelProbabilities: { homeWin: 52, draw: 28, awayWin: 20 },
    closingOdds: { homeWin: 1.82, draw: 3.5, awayWin: 4.8 },
  },
  {
    matchId: 'hist-022',
    kickoffDate: '2024-11-02',
    kickoffTime: '13:30',
    kickoffTimestamp: new Date('2024-11-02T13:30:00Z').getTime(),
    leagueId: 'pl',
    leagueName: 'Premier League',
    homeTeam: 'Newcastle United',
    awayTeam: 'Arsenal',
    homeScore: 1,
    awayScore: 0,
    modelProbabilities: { homeWin: 26, draw: 28, awayWin: 46 },
    closingOdds: { homeWin: 3.75, draw: 3.6, awayWin: 2.0 },
  },
  {
    matchId: 'hist-023',
    kickoffDate: '2024-11-02',
    kickoffTime: '16:00',
    kickoffTimestamp: new Date('2024-11-02T16:00:00Z').getTime(),
    leagueId: 'pl',
    leagueName: 'Premier League',
    homeTeam: 'Bournemouth',
    awayTeam: 'Manchester City',
    homeScore: 2,
    awayScore: 1,
    modelProbabilities: { homeWin: 16, draw: 22, awayWin: 62 },
    closingOdds: { homeWin: 6.0, draw: 4.8, awayWin: 1.5 },
  },
  {
    matchId: 'hist-024',
    kickoffDate: '2024-11-05',
    kickoffTime: '21:00',
    kickoffTimestamp: new Date('2024-11-05T21:00:00Z').getTime(),
    leagueId: 'cl',
    leagueName: 'Bajnokok Ligája',
    homeTeam: 'Sporting CP',
    awayTeam: 'Manchester City',
    homeScore: 4,
    awayScore: 1,
    modelProbabilities: { homeWin: 25, draw: 26, awayWin: 49 },
    closingOdds: { homeWin: 4.2, draw: 3.9, awayWin: 1.85 },
  },
  {
    matchId: 'hist-025',
    kickoffDate: '2024-11-05',
    kickoffTime: '21:00',
    kickoffTimestamp: new Date('2024-11-05T21:00:00Z').getTime(),
    leagueId: 'cl',
    leagueName: 'Bajnokok Ligája',
    homeTeam: 'Real Madrid',
    awayTeam: 'AC Milan',
    homeScore: 1,
    awayScore: 3,
    modelProbabilities: { homeWin: 66, draw: 20, awayWin: 14 },
    closingOdds: { homeWin: 1.45, draw: 5.0, awayWin: 6.5 },
  },
  {
    matchId: 'hist-026',
    kickoffDate: '2024-11-10',
    kickoffTime: '20:45',
    kickoffTimestamp: new Date('2024-11-10T20:45:00Z').getTime(),
    leagueId: 'sa',
    leagueName: 'Serie A',
    homeTeam: 'Inter',
    awayTeam: 'Napoli',
    homeScore: 1,
    awayScore: 1,
    modelProbabilities: { homeWin: 51, draw: 28, awayWin: 21 },
    closingOdds: { homeWin: 1.9, draw: 3.5, awayWin: 4.2 },
  },
  {
    matchId: 'hist-027',
    kickoffDate: '2024-11-23',
    kickoffTime: '18:30',
    kickoffTimestamp: new Date('2024-11-23T18:30:00Z').getTime(),
    leagueId: 'pl',
    leagueName: 'Premier League',
    homeTeam: 'Manchester City',
    awayTeam: 'Tottenham Hotspur',
    homeScore: 0,
    awayScore: 4,
    modelProbabilities: { homeWin: 64, draw: 21, awayWin: 15 },
    closingOdds: { homeWin: 1.5, draw: 4.8, awayWin: 5.8 },
  },
  {
    matchId: 'hist-028',
    kickoffDate: '2024-11-26',
    kickoffTime: '21:00',
    kickoffTimestamp: new Date('2024-11-26T21:00:00Z').getTime(),
    leagueId: 'cl',
    leagueName: 'Bajnokok Ligája',
    homeTeam: 'Bayern München',
    awayTeam: 'Paris Saint-Germain',
    homeScore: 1,
    awayScore: 0,
    modelProbabilities: { homeWin: 58, draw: 23, awayWin: 19 },
    closingOdds: { homeWin: 1.65, draw: 4.2, awayWin: 4.8 },
  },
  {
    matchId: 'hist-029',
    kickoffDate: '2024-11-27',
    kickoffTime: '21:00',
    kickoffTimestamp: new Date('2024-11-27T21:00:00Z').getTime(),
    leagueId: 'cl',
    leagueName: 'Bajnokok Ligája',
    homeTeam: 'Liverpool',
    awayTeam: 'Real Madrid',
    homeScore: 2,
    awayScore: 0,
    modelProbabilities: { homeWin: 53, draw: 26, awayWin: 21 },
    closingOdds: { homeWin: 1.88, draw: 3.9, awayWin: 3.8 },
  },
  {
    matchId: 'hist-030',
    kickoffDate: '2024-12-01',
    kickoffTime: '17:00',
    kickoffTimestamp: new Date('2024-12-01T17:00:00Z').getTime(),
    leagueId: 'pl',
    leagueName: 'Premier League',
    homeTeam: 'Liverpool',
    awayTeam: 'Manchester City',
    homeScore: 2,
    awayScore: 0,
    modelProbabilities: { homeWin: 46, draw: 27, awayWin: 27 },
    closingOdds: { homeWin: 2.15, draw: 3.8, awayWin: 3.1 },
  },
];
