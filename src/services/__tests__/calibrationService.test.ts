import { describe, it, expect } from 'vitest';
import {
  partitionChronologicalSample,
  computeCalibrationMetrics,
  computePerformanceMetrics,
  evaluateEdgeVerificationGate,
  runChronologicalCalibrationAudit,
  normalCdf,
  calculateOneSidedPValue,
  ChronologicalMatch,
} from '../calibrationService';

describe('Időrendhelyes Particionálás & Walk-Forward Split (calibrationService)', () => {
  it('szigorúan időrend szerint rendezi a mérkőzéseket és kizárja a lookahead biast', () => {
    const unorderedMatches: ChronologicalMatch[] = [
      {
        matchId: 'm3',
        kickoffDate: '2024-11-01',
        kickoffTimestamp: 1730419200000,
        leagueId: 'pl',
        leagueName: 'Premier League',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        homeScore: 2,
        awayScore: 0,
        modelProbabilities: { homeWin: 60, draw: 25, awayWin: 15 },
        closingOdds: { homeWin: 1.8, draw: 3.5, awayWin: 4.5 },
      },
      {
        matchId: 'm1',
        kickoffDate: '2024-09-01',
        kickoffTimestamp: 1725148800000,
        leagueId: 'pl',
        leagueName: 'Premier League',
        homeTeam: 'Liverpool',
        awayTeam: 'Everton',
        homeScore: 1,
        awayScore: 1,
        modelProbabilities: { homeWin: 70, draw: 20, awayWin: 10 },
        closingOdds: { homeWin: 1.3, draw: 5.5, awayWin: 9.0 },
      },
      {
        matchId: 'm2',
        kickoffDate: '2024-10-01',
        kickoffTimestamp: 1727740800000,
        leagueId: 'pl',
        leagueName: 'Premier League',
        homeTeam: 'Man City',
        awayTeam: 'Fulham',
        homeScore: 3,
        awayScore: 1,
        modelProbabilities: { homeWin: 80, draw: 12, awayWin: 8 },
        closingOdds: { homeWin: 1.2, draw: 7.0, awayWin: 12.0 },
      },
    ];

    const { inSample, outOfSample, splitDate } = partitionChronologicalSample(unorderedMatches, 0.5);

    // In-sample a legkorábbi meccsek
    expect(inSample.length).toBe(1);
    expect(inSample[0].matchId).toBe('m1');

    // Out-of-sample a későbbi meccsek
    expect(outOfSample.length).toBe(2);
    expect(outOfSample[0].matchId).toBe('m2');
    expect(outOfSample[1].matchId).toBe('m3');

    // Garantált, hogy nincs időbeli átfedés
    const maxInSampleTime = Math.max(...inSample.map((m) => m.kickoffTimestamp));
    const minOutOfSampleTime = Math.min(...outOfSample.map((m) => m.kickoffTimestamp));
    expect(maxInSampleTime).toBeLessThan(minOutOfSampleTime);
    expect(splitDate).toBe('2024-10-01');
  });
});

describe('Valószínűségi Kalibráció Mérése (Brier Score & ECE)', () => {
  it('tökéletesen előrejelzett kimenetelekre alacsony Brier pontszámot és ECE-t ad', () => {
    const perfectMatches: ChronologicalMatch[] = [
      {
        matchId: 'p1',
        kickoffDate: '2024-10-01',
        kickoffTimestamp: 1000,
        leagueId: 'pl',
        leagueName: 'Premier League',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        homeScore: 2,
        awayScore: 0,
        modelProbabilities: { homeWin: 95, draw: 4, awayWin: 1 },
        closingOdds: { homeWin: 1.1, draw: 9.0, awayWin: 25.0 },
      },
      {
        matchId: 'p2',
        kickoffDate: '2024-10-02',
        kickoffTimestamp: 2000,
        leagueId: 'pl',
        leagueName: 'Premier League',
        homeTeam: 'Team C',
        awayTeam: 'Team D',
        homeScore: 3,
        awayScore: 1,
        modelProbabilities: { homeWin: 90, draw: 7, awayWin: 3 },
        closingOdds: { homeWin: 1.15, draw: 8.0, awayWin: 18.0 },
      },
    ];

    const metrics = computeCalibrationMetrics(perfectMatches);
    expect(metrics.brierScore).toBeLessThan(0.1);
    expect(metrics.brierSkillScore).toBeGreaterThan(0.5);
    expect(metrics.expectedCalibrationError).toBeLessThan(0.15);
    expect(metrics.reliabilityBins.length).toBeGreaterThan(0);
  });

  it('képes detektálni a túlzottan magabiztos (rosszul kalibrált) modellt', () => {
    // A modell 90% feletti esélyt mond, de az összes meccset elveszíti a hazai
    const miscalibratedMatches: ChronologicalMatch[] = [
      {
        matchId: 'bad1',
        kickoffDate: '2024-10-01',
        kickoffTimestamp: 1000,
        leagueId: 'pl',
        leagueName: 'Premier League',
        homeTeam: 'Overconfident',
        awayTeam: 'Underdog',
        homeScore: 0,
        awayScore: 2,
        modelProbabilities: { homeWin: 95, draw: 3, awayWin: 2 },
        closingOdds: { homeWin: 1.1, draw: 9.0, awayWin: 20.0 },
      },
      {
        matchId: 'bad2',
        kickoffDate: '2024-10-02',
        kickoffTimestamp: 2000,
        leagueId: 'pl',
        leagueName: 'Premier League',
        homeTeam: 'Overconfident 2',
        awayTeam: 'Underdog 2',
        homeScore: 1,
        awayScore: 3,
        modelProbabilities: { homeWin: 92, draw: 5, awayWin: 3 },
        closingOdds: { homeWin: 1.15, draw: 8.0, awayWin: 16.0 },
      },
    ];

    const metrics = computeCalibrationMetrics(miscalibratedMatches);
    expect(metrics.expectedCalibrationError).toBeGreaterThan(0.5);
    expect(metrics.calibrationVerdict).toBe('ALULKALIBRÁLT');
  });
});

describe('Teljesítmény és Statisztikai Szignifikancia (CLV & Z-score)', () => {
  it('számol out-of-sample ROI-t, CLV értéket és 95%-os konfidencia intervallumot', () => {
    const matches: ChronologicalMatch[] = [
      {
        matchId: 'm1',
        kickoffDate: '2024-10-01',
        kickoffTimestamp: 1000,
        leagueId: 'pl',
        leagueName: 'Premier League',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        homeScore: 2,
        awayScore: 0,
        modelProbabilities: { homeWin: 65, draw: 20, awayWin: 15 },
        closingOdds: { homeWin: 2.1, draw: 3.5, awayWin: 4.0 }, // 10 000 Ft tét -> 21 000 Ft kifizetés
      },
      {
        matchId: 'm2',
        kickoffDate: '2024-10-02',
        kickoffTimestamp: 2000,
        leagueId: 'pl',
        leagueName: 'Premier League',
        homeTeam: 'Team C',
        awayTeam: 'Team D',
        homeScore: 1,
        awayScore: 2,
        modelProbabilities: { homeWin: 60, draw: 22, awayWin: 18 },
        closingOdds: { homeWin: 2.1, draw: 3.4, awayWin: 3.8 }, // 10 000 Ft tét -> 0 Ft kifizetés
      },
    ];

    const perf = computePerformanceMetrics(matches, 10000);
    expect(perf.totalBets).toBe(2);
    expect(perf.wonBets).toBe(1);
    expect(perf.lostBets).toBe(1);
    expect(perf.winRatePct).toBe(50.0);
    expect(perf.flatStakeRoiPct).toBe(5.0); // (20000 - 20000) / 20000? Wait: bet1: +10000 profit; bet2: -10000 profit -> net 0 -> ROI 0% or positive
    expect(perf.confidenceInterval95.length).toBe(2);
    expect(typeof perf.pValue).toBe('number');
  });

  it('normalCdf és calculateOneSidedPValue numerikusan stabil és határok között marad', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 3);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 2);
    expect(normalCdf(-1.96)).toBeCloseTo(0.025, 2);

    // Z = 0 esetén p-érték 0.50
    expect(calculateOneSidedPValue(0)).toBeCloseTo(0.5, 2);
    // Erős Z = 2.5 esetén p-érték < 0.01
    expect(calculateOneSidedPValue(2.5)).toBeLessThan(0.01);
  });
});

describe('Szigorú Piaci Előny Hitelesítési Döntési Fa (Edge Verification Gate)', () => {
  const dummyCalibration = {
    brierScore: 0.21,
    naiveBrierScore: 0.33,
    brierSkillScore: 0.12,
    logLoss: 0.62,
    expectedCalibrationError: 0.04, // kiváló (< 0.08)
    maxCalibrationError: 0.06,
    reliabilityBins: [],
    calibrationVerdict: 'KIVÁLÓAN_KALIBRÁLT' as const,
  };

  const dummyPerformance = {
    totalBets: 50,
    wonBets: 32,
    lostBets: 18,
    winRatePct: 64,
    flatStakeRoiPct: 8.5,
    quarterKellyRoiPct: 9.8,
    totalNetProfit: 42500,
    avgOdds: 1.85,
    closingLineValuePct: 4.2,
    zScore: 2.1,
    pValue: 0.0178, // szignifikáns (< 0.05)
    confidenceInterval95: [1.2, 15.8] as [number, number],
  };

  it('ELUTASÍTJA az igazolt piaci előny állítását, ha a mintaméret kisebb mint N=250', () => {
    const verdict = evaluateEdgeVerificationGate(dummyCalibration, dummyPerformance, 50);

    expect(verdict.hasProvenEdge).toBe(false);
    expect(verdict.edgeStatus).toBe('INSUFFICIENT_SAMPLE');
    expect(verdict.verdictTitle).toContain('Hipotézis');
    expect(verdict.claimStatusDisclaimer).toContain('SZIGORÚ FIGYELMEZTETÉS');
    expect(verdict.sampleSufficiencyPct).toBe(20.0); // 50 / 250 = 20%
  });

  it('ELUTASÍTJA az igazolt piaci előnyt, ha a kalibrációs hiba (ECE) túl magas', () => {
    const badCalib = {
      ...dummyCalibration,
      expectedCalibrationError: 0.12, // rossz (> 0.08)
    };

    const verdict = evaluateEdgeVerificationGate(badCalib, dummyPerformance, 300);
    expect(verdict.hasProvenEdge).toBe(false);
    expect(verdict.edgeStatus).toBe('POOR_CALIBRATION');
    expect(verdict.verdictTitle).toContain('Kalibrációs Hiba');
  });

  it('ELUTASÍTJA az igazolt piaci előnyt, ha a p-érték nem szignifikáns (p >= 0.05)', () => {
    const insignificantPerf = {
      ...dummyPerformance,
      pValue: 0.18, // nem szignifikáns
      zScore: 0.95,
    };

    const verdict = evaluateEdgeVerificationGate(dummyCalibration, insignificantPerf, 300);
    expect(verdict.hasProvenEdge).toBe(false);
    expect(verdict.edgeStatus).toBe('STATISTICALLY_INSIGNIFICANT');
    expect(verdict.verdictTitle).toContain('Nem Szignifikáns');
  });

  it('KIZÁRÓLAG akkor igazolja a piaci előnyt, ha a minta N>=250, ECE<=0.08 és p<0.05', () => {
    const verdict = evaluateEdgeVerificationGate(dummyCalibration, dummyPerformance, 300);
    expect(verdict.hasProvenEdge).toBe(true);
    expect(verdict.edgeStatus).toBe('PROVEN_EDGE');
    expect(verdict.verdictTitle).toContain('Statisztikailag Igazolt Piaci Előny');
  });

  it('futtatja a beépített minta-adatbázis teljes auditját (runChronologicalCalibrationAudit)', () => {
    const report = runChronologicalCalibrationAudit();
    expect(report.totalDatasetSize).toBeGreaterThan(15);
    expect(report.inSampleCount).toBeGreaterThan(0);
    expect(report.outOfSampleCount).toBeGreaterThan(0);
    expect(report.calibration).toBeDefined();
    expect(report.performance).toBeDefined();
    // A minta 30 meccses, így szigorúan INSUFFICIENT_SAMPLE kell legyen!
    expect(report.verdict.hasProvenEdge).toBe(false);
    expect(report.verdict.edgeStatus).toBe('INSUFFICIENT_SAMPLE');
  });
});
