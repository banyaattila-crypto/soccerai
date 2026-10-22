import { describe, it, expect } from 'vitest';
import {
  parseFootballDataCsv,
  parseFootballDataExtraCsv,
  logLoss,
  brier,
  rps,
  outcomeIndex,
  walkForward,
  evaluate1x2,
  fitBlendWeight1x2,
  reliabilityBins1x2,
  simulateBetting,
  type BacktestMatch,
} from '../backtestEngine';

const HEADER = 'Div,Date,Time,HomeTeam,AwayTeam,FTHG,FTAG,FTR,PSH,PSD,PSA,PSCH,PSCD,PSCA,P>2.5,P<2.5,PC>2.5,PC<2.5';

describe('parseFootballDataCsv', () => {
  it('értelmezi a dátumot, az eredményt és a nyitó/záró szorzókat (BOM-mal is)', () => {
    const csv = `﻿${HEADER}\nE0,15/08/2025,20:00,Liverpool,Bournemouth,4,2,H,1.30,6.00,9.00,1.28,6.50,10.0,1.50,2.60,1.45,2.75\n`;
    const [m] = parseFootballDataCsv(csv, 'E0', '2526');
    expect(m.home).toBe('Liverpool');
    expect(m.hg).toBe(4);
    expect(m.ts).toBe(Date.UTC(2025, 7, 15, 20, 0));
    expect(m.open1x2).toEqual([1.3, 6, 9]);
    expect(m.close1x2).toEqual([1.28, 6.5, 10]);
    expect(m.closeOU).toEqual([1.45, 2.75]);
  });

  it('kétjegyű évet és hiányzó szorzót is kezel; eredmény nélküli sort kihagy', () => {
    const csv = `${HEADER}\nE0,01/09/24,,A,B,1,1,D,,,,,,,,,,\nE0,02/09/24,,C,D,,,,,,,,,,,,,\n`;
    const out = parseFootballDataCsv(csv, 'E0', '2425');
    expect(out).toHaveLength(1);
    expect(out[0].close1x2).toBeUndefined();
    expect(new Date(out[0].ts).getUTCFullYear()).toBe(2024);
  });
});

describe('pontozó függvények', () => {
  it('log-loss, Brier és RPS ismert értékeken', () => {
    expect(logLoss([0.5, 0.3, 0.2], 0)).toBeCloseTo(-Math.log(0.5), 9);
    expect(brier([1, 0, 0], 0)).toBe(0);
    expect(brier([0, 1, 0], 0)).toBe(2);
    // RPS: tökéletes jóslat 0; a "távolabbi" tévedés nagyobb büntetést kap (sorrendi jelleg)
    expect(rps([1, 0, 0], 0)).toBe(0);
    expect(rps([0, 0, 1], 0)).toBeGreaterThan(rps([0, 1, 0], 0));
    expect(rps([0, 0, 1], 0)).toBeCloseTo(1, 9);
  });

  it('a kimenetel-index', () => {
    expect(outcomeIndex(2, 1)).toBe(0);
    expect(outcomeIndex(1, 1)).toBe(1);
    expect(outcomeIndex(0, 3)).toBe(2);
  });
});

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
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

/** Szintetikus liga: igazi erősségek, az "igaz" piac az igazi valószínűségekből (2% árrés). */
function syntheticLeague(seed: number): BacktestMatch[] {
  const r = rng(seed);
  const N = 12;
  const att = Array.from({ length: N }, () => Math.exp(0.3 * (r() - 0.5) * 2));
  const def = Array.from({ length: N }, () => Math.exp(0.25 * (r() - 0.5) * 2));
  const out: BacktestMatch[] = [];
  let day = 0;
  for (let round = 0; round < 3; round++) {
    for (let h = 0; h < N; h++) {
      for (let a = 0; a < N; a++) {
        if (h === a) continue;
        const lh = 1.5 * att[h] * def[a];
        const la = 1.2 * att[a] * def[h];
        // tényleges Poisson-valószínűségek a piachoz
        let ph = 0;
        let pd = 0;
        let pa = 0;
        const f = (k: number, l: number) => Math.exp(-l) * Math.pow(l, k) / [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800][k];
        for (let i = 0; i < 11; i++)
          for (let j = 0; j < 11; j++) {
            const p = f(i, lh) * f(j, la);
            if (i > j) ph += p;
            else if (i === j) pd += p;
            else pa += p;
          }
        const s = ph + pd + pa;
        const odds: [number, number, number] = [s / ph / 1.02, s / pd / 1.02, s / pa / 1.02];
        out.push({
          league: 'X',
          season: '2425',
          ts: Date.UTC(2024, 7, 1) + day * 86400000,
          home: 'T' + h,
          away: 'T' + a,
          hg: poisson(lh, r),
          ag: poisson(la, r),
          close1x2: odds,
          open1x2: odds,
        });
        day += 0.5;
      }
    }
  }
  return out;
}

describe('walkForward', () => {
  const matches = syntheticLeague(11);

  it('nincs előretekintés: a predikció időpontja előtti meccsek száma legalább minTrainMatches', () => {
    const recs = walkForward(matches, { minTrainMatches: 100 });
    expect(recs.length).toBeGreaterThan(100);
    const sorted = [...matches].sort((a, b) => a.ts - b.ts);
    for (const r of recs) {
      const before = sorted.filter((m) => m.ts < r.match.ts).length;
      expect(before).toBeGreaterThanOrEqual(100);
    }
  });

  it('a valószínűségek összege 1, az Over 2.5 a (0,1) sávban', () => {
    for (const r of walkForward(matches, {}).slice(0, 50)) {
      expect(r.model[0] + r.model[1] + r.model[2]).toBeCloseTo(1, 6);
      expect(r.modelOver25).toBeGreaterThan(0);
      expect(r.modelOver25).toBeLessThan(1);
    }
  });

  it('ha a piac az igazi valószínűség, a hangolt modell-súly kicsi, a keverék legalább a piac szintjén van', () => {
    const recs = walkForward(matches, {});
    const best = fitBlendWeight1x2(recs);
    expect(best.w).toBeLessThanOrEqual(0.5);
    const s = evaluate1x2(recs, best.w);
    expect(s.blend.logLoss).toBeLessThanOrEqual(s.market.logLoss + 1e-9);
    // a nyers modell ilyen kis szintetikus mintán (12 csapat, <300 tanító meccs) nem feltétlenül jobb a naivnál,
    // de a piacnál (ami az igazi valószínűség) szigorúan rosszabb
    expect(s.model.logLoss).toBeGreaterThan(s.market.logLoss);
  });

  it('a nyers modell "+EV" fogadásainak állított EV-je nagyobb a valós hozamnál (hatékony piacon)', () => {
    const recs = walkForward(matches, {});
    const b = simulateBetting(recs, 'model', 0, 0.02);
    expect(b.bets).toBeGreaterThan(20);
    expect(b.claimedEvPct).toBeGreaterThan(b.roiPct);
  });
});

describe('reliabilityBins1x2', () => {
  it('a sávok elemszáma a kimenetelek számával egyezik (3 / meccs), a gyakoriság 0..100', () => {
    const items = [
      { p: [0.6, 0.25, 0.15], idx: 0 },
      { p: [0.2, 0.3, 0.5], idx: 2 },
      { p: [0.34, 0.33, 0.33], idx: 1 },
    ];
    const bins = reliabilityBins1x2(items);
    expect(bins.reduce((s, b) => s + b.count, 0)).toBe(9);
    bins.forEach((b) => {
      expect(b.observedHitRate).toBeGreaterThanOrEqual(0);
      expect(b.observedHitRate).toBeLessThanOrEqual(100);
    });
  });
});

describe('parseFootballDataExtraCsv', () => {
  const HEADER = 'Country,League,Season,Date,Time,Home,Away,HG,AG,Res,PSCH,PSCD,PSCA,MaxCH,MaxCD,MaxCA,AvgCH,AvgCD,AvgCA';

  it('az extra ligák formátumát értelmezi, az átlag záró szorzót preferálja', () => {
    const csv = `﻿${HEADER}\nSweden,Allsvenskan,2026,19/10/2026,18:00,Degerfors,Kalmar,1,2,A,,,,3.1,3.3,2.4,2.95,3.13,2.32\n`;
    const [m] = parseFootballDataExtraCsv(csv, 'SWE');
    expect(m.league).toBe('SWE');
    expect(m.home).toBe('Degerfors');
    expect(m.ag).toBe(2);
    expect(m.ts).toBe(Date.UTC(2026, 9, 19, 18, 0));
    expect(m.close1x2).toEqual([2.95, 3.13, 2.32]);
    expect(m.open1x2).toBeUndefined();
  });

  it('pinnacle előnyben részesítésnél a PSC-t használja, ha van', () => {
    const csv = `${HEADER}\nRomania,Superliga,2012/2013,20/07/2012,16:30,A,B,6,2,H,1.51,4.24,7.59,1.55,4.25,7.59,1.47,3.85,6.43\n`;
    expect(parseFootballDataExtraCsv(csv, 'ROU', 'pinnacle')[0].close1x2).toEqual([1.51, 4.24, 7.59]);
    expect(parseFootballDataExtraCsv(csv, 'ROU', 'avg')[0].close1x2).toEqual([1.47, 3.85, 6.43]);
  });

  it('eredmény nélküli vagy hibás dátumú sort kihagy', () => {
    const csv = `${HEADER}\nX,Y,2026,01/01/2026,,A,B,,,,,,,,,,,,\nX,Y,2026,nincs,,A,B,1,1,D,,,,,,,,,\n`;
    expect(parseFootballDataExtraCsv(csv, 'X')).toHaveLength(0);
  });
});
