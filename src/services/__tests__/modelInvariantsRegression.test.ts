import { describe, it, expect } from 'vitest';
import {
  poisson,
  factorial,
  dixonColesTau,
  calculateDixonColesMatrix,
  normalizeIntegerPercentages,
  computeDixonColesExpectedGoals,
  calculateMarketProbabilities,
  devigShin,
  calculateExpectedValue,
  quarterKelly,
} from '../predictionEngine';
import { fitDixonColesModel } from '../dixonColesFitting';

describe('Matematikai és Numerikus Invariánsok Regressziós Tesztcsomag', () => {
  // =========================================================================
  // 1. DIXON-COLES TAU FAKTOR INVARIÁNSOK
  // =========================================================================
  describe('Dixon-Coles Tau Korrekciós Faktor Invariánsok', () => {
    it('invariáns: tau(i, j, lh, la, rho) szigorúan nemnegatív (>= 0.001) minden érvényes paramétertartományban', () => {
      const testLambdas = [0.1, 0.5, 1.2, 2.0, 3.5, 5.0];
      const testRhos = [-0.25, -0.20, -0.16, -0.13, -0.05, 0.0, 0.05, 0.1];

      for (const lh of testLambdas) {
        for (const la of testLambdas) {
          for (const rho of testRhos) {
            for (let i = 0; i <= 2; i++) {
              for (let j = 0; j <= 2; j++) {
                const tauVal = dixonColesTau(i, j, lh, la, rho);
                expect(tauVal).toBeGreaterThanOrEqual(0.001);
                expect(Number.isFinite(tauVal)).toBe(true);
              }
            }
          }
        }
      }
    });

    it('invariáns: rho = 0 esetén a tau faktor pontosan 1.0 minden cellára (független Poisson)', () => {
      const lh = 1.75;
      const la = 1.25;
      for (let i = 0; i <= 3; i++) {
        for (let j = 0; j <= 3; j++) {
          expect(dixonColesTau(i, j, lh, la, 0)).toBe(1.0);
        }
      }
    });

    it('invariáns: magas gólszámú cellákra (i > 1 vagy j > 1) a tau faktor mindig pontosan 1.0', () => {
      const lh = 2.1;
      const la = 1.4;
      const rho = -0.13;
      expect(dixonColesTau(2, 0, lh, la, rho)).toBe(1.0);
      expect(dixonColesTau(0, 2, lh, la, rho)).toBe(1.0);
      expect(dixonColesTau(2, 2, lh, la, rho)).toBe(1.0);
      expect(dixonColesTau(3, 1, lh, la, rho)).toBe(1.0);
    });

    it('invariáns: negatív rho esetén a 0-0 és 1-1 cellák növekednek, a 0-1 és 1-0 cellák csökkennek', () => {
      const lh = 1.5;
      const la = 1.2;
      const rho = -0.13;

      expect(dixonColesTau(0, 0, lh, la, rho)).toBeGreaterThan(1.0);
      expect(dixonColesTau(1, 1, lh, la, rho)).toBeGreaterThan(1.0);
      expect(dixonColesTau(0, 1, lh, la, rho)).toBeLessThan(1.0);
      expect(dixonColesTau(1, 0, lh, la, rho)).toBeLessThan(1.0);
    });
  });

  // =========================================================================
  // 2. POISSON ÉS FAKTORIÁLIS INVARIÁNSOK
  // =========================================================================
  describe('Poisson Eloszlás és Faktoriális Invariánsok', () => {
    it('invariáns: Poisson valószínűség P(k; lambda) >= 0 és véges', () => {
      for (let k = 0; k <= 15; k++) {
        const p = poisson(k, 1.8);
        expect(p).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(p)).toBe(true);
      }
    });

    it('invariáns: Poisson eloszlás összege a tartomány felett 1.0-hoz tart', () => {
      const lambdas = [0.5, 1.2, 2.0, 3.5];
      for (const lam of lambdas) {
        let sum = 0;
        for (let k = 0; k <= 25; k++) {
          sum += poisson(k, lam);
        }
        expect(sum).toBeCloseTo(1.0, 4);
      }
    });

    it('invariáns: Poisson várható érték: sum(k * P(k)) == lambda', () => {
      const lambda = 2.3;
      let expVal = 0;
      for (let k = 0; k <= 30; k++) {
        expVal += k * poisson(k, lambda);
      }
      expect(expVal).toBeCloseTo(lambda, 3);
    });

    it('invariáns: faktoriális alaptulajdonságok (0! = 1, n! = n * (n-1)!)', () => {
      expect(factorial(0)).toBe(1);
      expect(factorial(1)).toBe(1);
      expect(factorial(2)).toBe(2);
      expect(factorial(3)).toBe(6);
      expect(factorial(4)).toBe(24);
      expect(factorial(5)).toBe(120);
      expect(factorial(6)).toBe(720);
    });
  });

  // =========================================================================
  // 3. DIXON-COLES KÉTVÁLTOZÓS GÓLMÁTRIX INVARIÁNSOK
  // =========================================================================
  describe('Kétváltozós Dixon-Coles Mátrix Invariánsok', () => {
    it('invariáns: a mátrix elemeinek összege pontosan 1.0 (összeg invariáns)', () => {
      const testCases = [
        { lh: 0.8, la: 0.6, rho: -0.16 },
        { lh: 1.45, la: 1.15, rho: -0.13 },
        { lh: 2.2, la: 1.8, rho: -0.10 },
        { lh: 3.5, la: 0.7, rho: -0.13 },
        { lh: 0.35, la: 0.35, rho: -0.22 },
      ];

      for (const tc of testCases) {
        const m = calculateDixonColesMatrix(tc.lh, tc.la, tc.rho);
        let sum = 0;
        for (let i = 0; i < m.length; i++) {
          for (let j = 0; j < m[i].length; j++) {
            expect(m[i][j]).toBeGreaterThanOrEqual(0);
            sum += m[i][j];
          }
        }
        expect(sum).toBeCloseTo(1.0, 7);
      }
    });

    it('invariáns: tetszőleges maxGoals dimenziót támogat és normalizálja', () => {
      const m8 = calculateDixonColesMatrix(1.5, 1.2, -0.13, 8);
      const m10 = calculateDixonColesMatrix(1.5, 1.2, -0.13, 10);

      expect(m8.length).toBe(8);
      expect(m8[0].length).toBe(8);
      expect(m10.length).toBe(10);
      expect(m10[0].length).toBe(10);

      let sum10 = 0;
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) sum10 += m10[i][j];
      }
      expect(sum10).toBeCloseTo(1.0, 7);
    });
  });

  // =========================================================================
  // 4. HARE-NIEMEYER LEGNAGYOBB MARADVÁNY MÓDSZER INVARIÁNSOK
  // =========================================================================
  describe('Hare-Niemeyer Egész Százalék Partíció Invariánsok', () => {
    it('invariáns: tetszőleges valószínűségi tömb kimenete pontosan 100 összeget ad', () => {
      const testInputs = [
        [0.333333, 0.333333, 0.333334],
        [0.654, 0.221, 0.125],
        [0.555, 0.445],
        [0.25, 0.25, 0.25, 0.25],
        [0.999, 0.0006, 0.0004],
        [0.1428, 0.1428, 0.1428, 0.1428, 0.1428, 0.1428, 0.1432],
      ];

      for (const input of testInputs) {
        const normed = normalizeIntegerPercentages(input);
        const sum = normed.reduce((a, b) => a + b, 0);
        expect(sum).toBe(100);
        normed.forEach((val) => {
          expect(Number.isInteger(val)).toBe(true);
          expect(val).toBeGreaterThanOrEqual(0);
          expect(val).toBeLessThanOrEqual(100);
        });
      }
    });

    it('invariáns: üres tömb esetén üres tömböt ad vissza', () => {
      expect(normalizeIntegerPercentages([])).toEqual([]);
    });
  });

  // =========================================================================
  // 5. PIACI VALÓSZÍNŰSÉGEK AXIOMATIKUS INVARIÁNSAI
  // =========================================================================
  describe('Központi calculateMarketProbabilities Axiomatikus Invariánsok', () => {
    const scenarios = [
      { name: 'Kiegyenlített rangadó', lh: 1.45, la: 1.35, adv: 1.0, rho: -0.13 },
      { name: 'Nagy hazai favorit', lh: 2.80, la: 0.60, adv: 1.0, rho: -0.13 },
      { name: 'Vendég dominancia', lh: 0.70, la: 2.50, adv: 1.0, rho: -0.13 },
      { name: 'Gólszegény taktikai meccs', lh: 0.85, la: 0.75, adv: 1.0, rho: -0.18 },
      { name: 'Gólzápor meccs', lh: 3.20, la: 2.40, adv: 1.0, rho: -0.10 },
      { name: 'Extrém minimális xG', lh: 0.20, la: 0.20, adv: 1.0, rho: -0.13 },
    ];

    for (const sc of scenarios) {
      describe(`Szcenárió: ${sc.name} (lh=${sc.lh}, la=${sc.la})`, () => {
        const probs = calculateMarketProbabilities(sc.lh, sc.la, sc.adv, sc.rho);

        it('1X2 Partíció Invariáns: homeWin + draw + awayWin == 100%', () => {
          const sum1X2 = probs.homeWin + probs.draw + probs.awayWin;
          expect(sum1X2).toBe(100);
        });

        it('Gólszám Monotonitási Invariáns: Over 3.5 <= Over 2.5 <= Over 1.5', () => {
          expect(probs.over35).toBeLessThanOrEqual(probs.over25);
          expect(probs.over25).toBeLessThanOrEqual(probs.over15);
        });

        it('Fréchet / Copula határok a BTTS & Over 2.5 kombinált piacra', () => {
          // bttsAndOver25 nem haladhatja meg a komponensek minimumát
          expect(probs.bttsAndOver25).toBeLessThanOrEqual(probs.bttsYes);
          expect(probs.bttsAndOver25).toBeLessThanOrEqual(probs.over25);

          // Fréchet alsó korlát: max(0, P(A) + P(B) - 100)
          const lowerBound = Math.max(0, probs.bttsYes + probs.over25 - 100);
          expect(probs.bttsAndOver25).toBeGreaterThanOrEqual(lowerBound);
        });

        it('Félidő Invariáns: 0 <= fhOver05 <= 100', () => {
          expect(probs.fhOver05).toBeGreaterThanOrEqual(0);
          expect(probs.fhOver05).toBeLessThanOrEqual(100);
        });
      });
    }
  });

  // =========================================================================
  // 6. KANONIKUS DIXON-COLES VÁRHATÓ GÓL KÉPLET INVARIÁNSOK
  // =========================================================================
  describe('Kanonikus computeDixonColesExpectedGoals Invariánsok', () => {
    it('invariáns: lh és la strictly pozitív és numerikus korlátok között van [0.2, 5.5]', () => {
      const res = computeDixonColesExpectedGoals({
        attackHome: 1.25,
        defenseHome: 0.90,
        attackAway: 1.10,
        defenseAway: 1.05,
        avgHomeGoals: 1.50,
        avgAwayGoals: 1.20,
        homeAdvantage: 1.18,
      });

      expect(res.lh).toBeGreaterThanOrEqual(0.2);
      expect(res.lh).toBeLessThanOrEqual(5.5);
      expect(res.la).toBeGreaterThanOrEqual(0.2);
      expect(res.la).toBeLessThanOrEqual(5.5);
    });

    it('invariáns: erősebb támadóerő magasabb várható gólt eredményez', () => {
      const base = computeDixonColesExpectedGoals({
        attackHome: 1.0,
        defenseHome: 1.0,
        attackAway: 1.0,
        defenseAway: 1.0,
      });
      const strongHome = computeDixonColesExpectedGoals({
        attackHome: 1.4,
        defenseHome: 1.0,
        attackAway: 1.0,
        defenseAway: 1.0,
      });

      expect(strongHome.lh).toBeGreaterThan(base.lh);
      expect(strongHome.la).toBe(base.la); // Vendég gól nem változik
    });

    it('invariáns: gyengébb védelem (magasabb defense érték) több kapott gólt eredményez', () => {
      const solidAwayDef = computeDixonColesExpectedGoals({
        attackHome: 1.0,
        defenseHome: 1.0,
        attackAway: 1.0,
        defenseAway: 0.7,
      });
      const weakAwayDef = computeDixonColesExpectedGoals({
        attackHome: 1.0,
        defenseHome: 1.0,
        attackAway: 1.0,
        defenseAway: 1.4,
      });

      expect(weakAwayDef.lh).toBeGreaterThan(solidAwayDef.lh);
    });

    it('invariáns: hazai előny (gamma) egyszeres szorzása, nincs kétszeres torzítás', () => {
      // Két azonos átlagos erősségű csapat (1.0 vs 1.0)
      const res = computeDixonColesExpectedGoals({
        attackHome: 1.0,
        defenseHome: 1.0,
        attackAway: 1.0,
        defenseAway: 1.0,
        avgHomeGoals: 1.50,
        avgAwayGoals: 1.20,
        homeAdvantage: 1.25,
      });

      // lh pontosan 1.20 * 1.25 = 1.50, la pontosan 1.20
      expect(res.lh).toBe(1.50);
      expect(res.la).toBe(1.20);
      expect(Number((res.lh / res.la).toFixed(2))).toBe(1.25);
    });

    it('invariáns: ha nincs explicit homeAdvantage megadva, avgHomeGoals / avgAwayGoals-ból pontosan származtatható', () => {
      const res = computeDixonColesExpectedGoals({
        attackHome: 1.0,
        defenseHome: 1.0,
        attackAway: 1.0,
        defenseAway: 1.0,
        avgHomeGoals: 1.45,
        avgAwayGoals: 1.15,
      });

      expect(res.lh).toBe(1.45);
      expect(res.la).toBe(1.15);
    });
  });

  // =========================================================================
  // 6.B DIXON-COLES ILLESZTÉS (MLE IDŐBELI SÚLYOZÁS ÉS PROFIL-LIKELIHOOD)
  // =========================================================================
  describe('fitDixonColesModel Időbeli Súlyozott MLE és Profil-Likelihood Invariánsok', () => {
    it('invariáns: gamma és rho illesztése stabil és korlátok között van időbeli súlyozással', () => {
      const dummyMatches = [
        { homeTeam: 'Arsenal', awayTeam: 'Chelsea', homeGoals: 2, awayGoals: 1, date: '2026-10-15' },
        { homeTeam: 'Liverpool', awayTeam: 'Man City', homeGoals: 1, awayGoals: 1, date: '2026-10-16' },
        { homeTeam: 'Arsenal', awayTeam: 'Liverpool', homeGoals: 3, awayGoals: 1, date: '2026-10-18' },
        { homeTeam: 'Chelsea', awayTeam: 'Man City', homeGoals: 0, awayGoals: 2, date: '2026-10-19' },
        { homeTeam: 'Man City', awayTeam: 'Arsenal', homeGoals: 2, awayGoals: 2, date: '2026-10-20' },
        { homeTeam: 'Chelsea', awayTeam: 'Liverpool', homeGoals: 1, awayGoals: 2, date: '2026-10-21' },
      ];

      const model = fitDixonColesModel(dummyMatches, 'PL_TEST', 0.003, 20);

      expect(model.homeAdvantage).toBeGreaterThanOrEqual(1.05);
      expect(model.homeAdvantage).toBeLessThanOrEqual(1.60);
      expect(model.rho).toBeGreaterThanOrEqual(-0.24);
      expect(model.rho).toBeLessThanOrEqual(0.02);
      expect(model.teams['arsenal']).toBeDefined();
      expect(model.teams['arsenal'].attack).toBeGreaterThan(0.5);
    });
  });

  // =========================================================================
  // 7. SHIN (1993) DE-VIGGING ÉS BUCHDAHL INVARIÁNSOK
  // =========================================================================
  describe('Shin De-vigging Algoritmus Invariánsok', () => {
    it('invariáns: Shin valószínűségek összege pontosan 1.0', () => {
      const oddsList = [
        [1.85, 3.60, 4.20],
        [1.30, 5.50, 10.50],
        [2.40, 3.25, 3.00],
      ];

      for (const odds of oddsList) {
        const { probs, margin } = devigShin(odds);
        const sum = probs.reduce((a, b) => a + b, 0);
        expect(sum).toBeCloseTo(1.0, 5);
        expect(margin).toBeGreaterThan(0);
      }
    });

    it('invariáns: alacsonyabb odds magasabb Shin valószínűséget kap (monoton inverz)', () => {
      const { probs } = devigShin([1.50, 4.00, 6.50]);
      expect(probs[0]).toBeGreaterThan(probs[1]);
      expect(probs[1]).toBeGreaterThan(probs[2]);
    });

    it('invariáns: pozitív bukméker árrésnél a fair valószínűségek alacsonyabbak mint a nyers inverzek (1/odds)', () => {
      const odds = [1.90, 3.40, 4.10];
      const { probs } = devigShin(odds);
      for (let i = 0; i < odds.length; i++) {
        expect(probs[i]).toBeLessThanOrEqual(1 / odds[i]);
      }
    });
  });

  // =========================================================================
  // 8. KELLY-KRITÉRIUM ÉS VÁRHATÓ ÉRTÉK (+EV) INVARIÁNSOK
  // =========================================================================
  describe('Kelly-Kritérium és Várható Érték (+EV) Invariánsok', () => {
    it('invariáns: EV <= 0 esetén a Quarter-Kelly tét pontosan 0%', () => {
      expect(calculateExpectedValue(50, 2.00)).toBe(0);
      expect(quarterKelly(50, 2.00)).toBe(0);

      expect(calculateExpectedValue(45, 2.00)).toBeLessThan(0);
      expect(quarterKelly(45, 2.00)).toBe(0);
    });

    it('invariáns: EV > 0 esetén a Quarter-Kelly tét > 0% és nem lépi túl a cap korlátot', () => {
      const cap = 0.25;
      const qk = quarterKelly(65, 2.00, cap);
      expect(qk).toBeGreaterThan(0);
      expect(qk).toBeLessThanOrEqual(6.3);
    });

    it('invariáns: azonos oddsnál nagyobb valószínűség szigorúan nagyobb tétméretet ad', () => {
      const qk1 = quarterKelly(55, 2.20);
      const qk2 = quarterKelly(62, 2.20);
      expect(qk2).toBeGreaterThan(qk1);
    });
  });

  // =========================================================================
  // 9. REGRESSZIÓS FIX ÉRTÉK PÖCKÖK (GOLDEN REGRESSION PINS)
  // Megakadályozza a számítási képletek észrevétlen elcsúszását
  // =========================================================================
  describe('Golden Regression Pins (Referencia Értékek)', () => {
    it('Pin 1: Standard Premier League meccs (Arsenal vs Aston Villa: lh=1.80, la=1.10, rho=-0.13)', () => {
      const probs = calculateMarketProbabilities(1.80, 1.10, 1.0, -0.13);

      // Partíció összeg
      expect(probs.homeWin + probs.draw + probs.awayWin).toBe(100);
      expect(probs.homeWin).toBe(52);
      expect(probs.draw).toBe(26);
      expect(probs.awayWin).toBe(22);
      // Gólpiacok és Fréchet határok
      expect(probs.over15).toBe(80);
      expect(probs.over25).toBe(55);
      expect(probs.over35).toBe(33);
      expect(probs.bttsYes).toBe(57);
      expect(probs.bttsAndOver25).toBe(45);
      expect(probs.fhOver05).toBe(70);
    });

    it('Pin 2: Gólzápor rangadó (Bayern vs Dortmund: lh=2.80, la=1.70, rho=-0.13)', () => {
      const probs = calculateMarketProbabilities(2.80, 1.70, 1.0, -0.13);

      expect(probs.homeWin + probs.draw + probs.awayWin).toBe(100);
      expect(probs.homeWin).toBe(60);
      expect(probs.draw).toBe(19);
      expect(probs.awayWin).toBe(21);
      expect(probs.over15).toBe(95);
      expect(probs.over25).toBe(83); // MAXG 8->12: a korábbi csonkolás ~1 pp-et elvitt a magas gólszámú meccseken
      expect(probs.over35).toBe(66);
      expect(probs.bttsYes).toBe(77);
      expect(probs.bttsAndOver25).toBe(71);
      expect(probs.fhOver05).toBe(84);
    });

    it('Pin 3: Taktikai kevés gólos meccs (Juventus vs Roma: lh=1.00, la=0.80, rho=-0.16)', () => {
      const probs = calculateMarketProbabilities(1.00, 0.80, 1.0, -0.16);

      expect(probs.homeWin + probs.draw + probs.awayWin).toBe(100);
      expect(probs.homeWin).toBe(37);
      expect(probs.draw).toBe(37);
      expect(probs.awayWin).toBe(26);
      expect(probs.over15).toBe(56);
      expect(probs.over25).toBe(27);
      expect(probs.over35).toBe(11);
      expect(probs.bttsYes).toBe(37);
      expect(probs.bttsAndOver25).toBe(22);
      expect(probs.fhOver05).toBe(53);
    });
  });
});
