import { describe, it, expect } from 'vitest';
import {
  fitDixonColesModel,
  computeExpectedGoalsFromModel,
  FinishedMatchResult,
} from '../dixonColesFitting';
import { calculateMarketProbabilities } from '../predictionEngine';

/**
 * Pontossági regresszió szintetikus ligán (ismert igazi erősségekkel).
 * Az audit (2026-10-22) két hibát talált, amit ez a csomag őriz:
 *  - skála-inkonzisztencia: az illesztett modell +21% / +10% gólt jósolt;
 *  - vékony minta: 3 napos ablakból illesztve a modell rosszabb volt a ligaátlagnál.
 */

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const normal = (r: () => number) => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r());
function poisson(l: number, r: () => number) {
  const L = Math.exp(-l);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= r();
  } while (p > L);
  return k - 1;
}

const N = 20;
const MU = 1.2;
const GAMMA = 1.25;

function makeLeague(r: () => number) {
  let att = Array.from({ length: N }, () => Math.exp(0.25 * normal(r)));
  let def = Array.from({ length: N }, () => Math.exp(0.2 * normal(r)));
  const ma = att.reduce((a, b) => a + b) / N;
  const md = def.reduce((a, b) => a + b) / N;
  att = att.map((x) => x / ma);
  def = def.map((x) => x / md);
  return { att, def };
}
type League = ReturnType<typeof makeLeague>;
const lam = (L: League, h: number, a: number) => ({
  lh: MU * GAMMA * L.att[h] * L.def[a],
  la: MU * L.att[a] * L.def[h],
});

function season(L: League, r: () => number, count: number): FinishedMatchResult[] {
  const all: [number, number][] = [];
  for (let h = 0; h < N; h++) for (let a = 0; a < N; a++) if (h !== a) all.push([h, a]);
  all.sort(() => r() - 0.5);
  return all.slice(0, count).map(([h, a], idx) => {
    const { lh, la } = lam(L, h, a);
    const d = new Date(Date.now() - (1 - idx / count) * 300 * 86400000 - 86400000);
    return {
      homeTeam: 'T' + h,
      awayTeam: 'T' + a,
      homeGoals: poisson(lh, r),
      awayGoals: poisson(la, r),
      date: d.toISOString().split('T')[0],
    };
  });
}

function logLoss(p: { h: number; d: number; a: number }, res: 'h' | 'd' | 'a') {
  const x = res === 'h' ? p.h : res === 'd' ? p.d : p.a;
  return -Math.log(Math.max(0.01, x));
}

describe('Dixon–Coles illesztés pontossága szintetikus ligán', () => {
  const REPS = 6;
  let sumLh = 0;
  let sumLa = 0;
  let trueLh = 0;
  let trueLa = 0;
  let n = 0;
  let llModel = 0;
  let llNaive = 0;
  let llOracle = 0;
  let meanAlpha = 0;
  let meanBeta = 0;

  for (let rep = 0; rep < REPS; rep++) {
    const r = rng(4200 + rep);
    const L = makeLeague(r);
    const model = fitDixonColesModel(season(L, r, 380), 'X');
    const teams = Object.values(model.teams);
    meanAlpha += teams.reduce((a, t) => a + t.attack, 0) / teams.length / REPS;
    meanBeta += teams.reduce((a, t) => a + t.defense, 0) / teams.length / REPS;

    for (let h = 0; h < N; h++) {
      for (let a = 0; a < N; a++) {
        if (h === a) continue;
        const t = lam(L, h, a);
        const gh = poisson(t.lh, r);
        const ga = poisson(t.la, r);
        const res = gh > ga ? 'h' : gh === ga ? 'd' : 'a';
        const est = computeExpectedGoalsFromModel(model, 'T' + h, 'T' + a);
        const pm = calculateMarketProbabilities(est.homeXg, est.awayXg, 1.0, model.rho);
        const pn = calculateMarketProbabilities(1.45, 1.15, 1.0, -0.13);
        const po = calculateMarketProbabilities(t.lh, t.la, 1.0, -0.13);
        llModel += logLoss({ h: pm.homeWin / 100, d: pm.draw / 100, a: pm.awayWin / 100 }, res);
        llNaive += logLoss({ h: pn.homeWin / 100, d: pn.draw / 100, a: pn.awayWin / 100 }, res);
        llOracle += logLoss({ h: po.homeWin / 100, d: po.draw / 100, a: po.awayWin / 100 }, res);
        sumLh += est.homeXg;
        sumLa += est.awayXg;
        trueLh += t.lh;
        trueLa += t.la;
        n++;
      }
    }
  }

  it('az átlagos várható gól az igazi érték ±3%-án belül van (nincs dupla skálázás)', () => {
    expect(Math.abs(sumLh / trueLh - 1)).toBeLessThan(0.03);
    expect(Math.abs(sumLa / trueLa - 1)).toBeLessThan(0.03);
  });

  it('α és β átlaga 1,0 (egységes konvenció a klub-priorokkal)', () => {
    expect(meanAlpha).toBeCloseTo(1.0, 2);
    expect(meanBeta).toBeCloseTo(1.0, 2);
  });

  it('teljes szezonból illesztve jobb a ligaátlagnál, és közel az orákulumhoz (1X2 log-loss)', () => {
    expect(llModel / n).toBeLessThan(llNaive / n);
    expect(llModel / n - llOracle / n).toBeLessThan(0.03);
  });
});

describe('Illesztés szélső esetek', () => {
  it('a meccs nélküli csapat nem kerül a modellbe (a hívó 1,0-ra vagy klub-priorra esik vissza)', () => {
    const r = rng(7);
    const L = makeLeague(r);
    const matches = season(L, r, 120).filter((m) => m.homeTeam !== 'T0' && m.awayTeam !== 'T0');
    const model = fitDixonColesModel(matches, 'X');
    expect(model.teams['t0']).toBeUndefined();
  });

  it('a liga alapszintje (μ) és a hazai előny (γ) értelmes tartományban marad', () => {
    const r = rng(11);
    const L = makeLeague(r);
    const model = fitDixonColesModel(season(L, r, 380), 'X');
    expect(model.avgAwayGoals).toBeGreaterThan(1.0);
    expect(model.avgAwayGoals).toBeLessThan(1.4);
    expect(model.homeAdvantage).toBeGreaterThanOrEqual(1.05);
    expect(model.homeAdvantage).toBeLessThanOrEqual(1.7);
  });
});
