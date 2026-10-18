import { describe, it, expect } from 'vitest';
import {
  calculateDixonColesMatrix,
  extractMarketsFromMatrix,
  calculateMarketProbabilities,
  devigShin,
  quarterKelly,
  calculateExpectedValue,
  robustnessGridTest,
  lambdaInversionReport,
} from '../predictionEngine';

describe('predictionEngine - Matematikai és Kvantitatív Motor', () => {
  describe('Dixon-Coles Bivariate Poisson Mátrix', () => {
    it('8x8 valószínűségi mátrixot generál, amelynek összege pontosan 1.0 (100%)', () => {
      const lambdaHome = 1.65;
      const lambdaAway = 1.15;
      const matrix = calculateDixonColesMatrix(lambdaHome, lambdaAway, -0.13);

      expect(matrix.length).toBe(8);
      expect(matrix[0].length).toBe(8);

      let sum = 0;
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          expect(matrix[i][j]).toBeGreaterThanOrEqual(0);
          sum += matrix[i][j];
        }
      }

      // Valószínűségi eloszlás normalizálva van pontosan 1.0-ra
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('alacsony gólszámos korrelációs korrekció (tau/rho paraméter) módosítja a low-score valószínűségeket', () => {
      const lh = 1.5;
      const la = 1.2;
      // Független Poisson (rho = 0) vs Dixon-Coles korrigált (rho = -0.13)
      const indepMatrix = calculateDixonColesMatrix(lh, la, 0);
      const dcMatrix = calculateDixonColesMatrix(lh, la, -0.13);

      // Negatív rho mellett a 0-0 valószínűsége megnő az empirikus Dixon-Coles modell szerint
      expect(dcMatrix[0][0]).not.toEqual(indepMatrix[0][0]);
    });
  });

  describe('Piacok Kinyerése a Mátrixból (extractMarketsFromMatrix)', () => {
    it('az 1X2 valószínűségek (home + draw + away) összege 1.0 (100%)', () => {
      const matrix = calculateDixonColesMatrix(1.8, 1.0, -0.13);
      const mk = extractMarketsFromMatrix(matrix);

      const sum1X2 = mk.home + mk.draw + mk.away;
      expect(sum1X2).toBeCloseTo(1.0, 4);
    });

    it('az Over/Under gólszám valószínűségek logikailag monoton csökkennek', () => {
      const matrix = calculateDixonColesMatrix(2.2, 1.8, -0.13);
      const mk = extractMarketsFromMatrix(matrix);

      expect(mk.over15).toBeGreaterThan(mk.over25);
      expect(mk.over25).toBeGreaterThan(mk.over35);
      expect(mk.over25).toBeGreaterThan(0.5); // Magas lambdák esetén Over 2.5 esélyes
    });

    it('a BTTS & Over 2.5 közvetlenül a gólmátrix celláiból épül fel', () => {
      const matrix = calculateDixonColesMatrix(1.5, 1.3, -0.13);
      const mk = extractMarketsFromMatrix(matrix);

      expect(mk.bttsAndOver25).toBeGreaterThan(0);
      // Nem lehet nagyobb se a BTTS-nél, se az Over 2.5-nél
      expect(mk.bttsAndOver25).toBeLessThanOrEqual(mk.btts);
      expect(mk.bttsAndOver25).toBeLessThanOrEqual(mk.over25);
    });
  });

  describe('Központi Valószínűségszámítás (calculateMarketProbabilities)', () => {
    it('helyesen számítja és kerekíti százalékos értékekre a fő piacokat', () => {
      const probs = calculateMarketProbabilities(1.8, 1.1);

      expect(probs.homeWin).toBeGreaterThan(probs.awayWin);
      expect(probs.homeWin + probs.draw + probs.awayWin).toBeGreaterThanOrEqual(99);
      expect(probs.homeWin + probs.draw + probs.awayWin).toBeLessThanOrEqual(101);
      expect(probs.fhOver05).toBeGreaterThan(0);
      expect(probs.fhOver05).toBeLessThan(100);
    });
  });

  describe('Shin (1993) Odds Devigging (Árrés Levonás)', () => {
    it('sikeresen eltávolítja a bukmékeri margin-t és 1.0-ra normalizál', () => {
      const odds = [1.95, 3.40, 4.00];
      const { probs, margin } = devigShin(odds);

      expect(margin).toBeGreaterThan(0); // Árrés pozitív
      expect(probs.length).toBe(3);

      const sumProbs = probs.reduce((a, b) => a + b, 0);
      expect(Math.abs(sumProbs - 1.0)).toBeLessThan(0.001); // Összegük 1.0
    });

    it('a Shin valószínűségek alacsonyabbak az esélytelenebb kimeneteleknél a favorite-longshot bias korrekció miatt', () => {
      const odds = [1.30, 5.50, 10.0];
      const { probs } = devigShin(odds);

      // A nyers inverz valószínűség (1/10 = 0.10) a Shin korrekció után kisebb lesz
      const rawLongshot = 1 / 10.0;
      expect(probs[2]).toBeLessThan(rawLongshot);
    });
  });

  describe('Kelly-Kritérium és Várható Érték (+EV)', () => {
    it('calculateExpectedValue helyesen számítja a százalékos EV-t', () => {
      // 60% esély @ 2.00 odds -> EV = (0.60 * 2.00 - 1) * 100 = +20%
      const ev = calculateExpectedValue(60, 2.00);
      expect(ev).toBeCloseTo(20.0, 1);

      // 40% esély @ 2.00 odds -> EV = (0.40 * 2.00 - 1) * 100 = -20%
      const evNeg = calculateExpectedValue(40, 2.00);
      expect(evNeg).toBeCloseTo(-20.0, 1);
    });

    it('quarterKelly pozitív EV esetén frakcionált ajánlott tét %-ot ad, negatív vagy 0 EV esetén 0-t', () => {
      // Negatív EV esetén 0 tét
      expect(quarterKelly(40, 2.00)).toBe(0);
      expect(quarterKelly(50, 2.00)).toBe(0);

      // Pozitív EV: 60% @ 2.00 -> teljes Kelly: (1 * 0.6 - 0.4) / 1 = 0.20 -> Negyed-Kelly: 0.05 (5.0%)
      const qk = quarterKelly(60, 2.00, 0.25);
      expect(qk).toBe(5.0);
    });

    it('quarterKelly sosem lépi túl a megadott biztonsági plafont (cap)', () => {
      // Ha cap = 0.10, akkor negyed-Kelly max 2.5% lehet (0.10 * 0.25 * 100 = 2.5)
      const cap = 0.10;
      const qk = quarterKelly(95, 3.00, cap);
      expect(qk).toBeLessThanOrEqual(cap * 100 * 0.25 + 0.1);
    });
  });

  describe('Robusztussági Szimuláció (robustnessGridTest)', () => {
    it('szilárd előny esetén ROBUSZTUS minősítést ad', () => {
      // Hazai dominancia: lh = 2.6, la = 0.5, piac = '1', odds = 2.10
      const res = robustnessGridTest(2.6, 0.5, 75, 2.10, '1', 0.20);

      expect(res.verdict).toBe('ROBUSZTUS');
      expect(res.minEdge).toBeGreaterThan(0);
      expect(res.medianEdge).toBeGreaterThan(0);
    });

    it('negatív vagy határeset esetén ELVETVE minősítést ad', () => {
      // Kiegyenlített meccs alacsony odds mellett: lh = 1.0, la = 1.0, odds = 1.80
      const res = robustnessGridTest(1.0, 1.0, 35, 1.80, '1', 0.25);

      expect(res.verdict).toBe('ELVETVE');
      expect(res.medianEdge).toBeLessThanOrEqual(0);
    });
  });

  describe('Lambda Inverzió (lambdaInversionReport)', () => {
    it('kiszámítja a piaci vélekedés szerinti lambda értéket Over/Under oddsokból', () => {
      const rep = lambdaInversionReport(1.85, 1.95, 2.4, 3.0);
      expect(rep.marketLambda).toBeGreaterThan(1.5);
      expect(rep.marketLambda).toBeLessThan(4.0);
      expect(typeof rep.verdict).toBe('string');
    });
  });
});
