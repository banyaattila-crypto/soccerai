import { describe, it, expect } from 'vitest';
import {
  blendLogPool,
  marketProbsFromOdds,
  marketFairFromBookmakers,
  blendedMarketPct,
  MARKET_BLEND_MODEL_WEIGHT_1X2,
} from '../marketBlend';

describe('blendLogPool', () => {
  const model = [0.5, 0.3, 0.2];
  const market = [0.4, 0.3, 0.3];

  it('w=1 a modellt, w=0 a piacot adja vissza', () => {
    blendLogPool(model, market, 1).forEach((x, i) => expect(x).toBeCloseTo(model[i], 9));
    blendLogPool(model, market, 0).forEach((x, i) => expect(x).toBeCloseTo(market[i], 9));
  });

  it('a kimenet összege 1, és a két forrás közé esik', () => {
    const b = blendLogPool(model, market, 0.5);
    expect(b.reduce((a, c) => a + c, 0)).toBeCloseTo(1, 9);
    expect(b[0]).toBeGreaterThan(0.4);
    expect(b[0]).toBeLessThan(0.5);
  });

  it('hosszeltérésre hibát dob, a súlyt 0..1-re vágja', () => {
    expect(() => blendLogPool([0.5, 0.5], [0.3, 0.3, 0.4], 0.5)).toThrow();
    blendLogPool(model, market, 7).forEach((x, i) => expect(x).toBeCloseTo(model[i], 9));
  });
});

describe('marketProbsFromOdds', () => {
  it('a de-vigelt valószínűségek összege 1, a favorit nagyobb', () => {
    const p = marketProbsFromOdds([2.0, 3.5, 3.8])!;
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
    expect(p[0]).toBeGreaterThan(p[1]);
  });

  it('érvénytelen szorzóra null', () => {
    expect(marketProbsFromOdds([1.0, 3, 3])).toBeNull();
    expect(marketProbsFromOdds([NaN, 3, 3])).toBeNull();
  });
});

describe('marketFairFromBookmakers', () => {
  const books = [
    { name: 'Bet365', home: 2.2, draw: 3.4, away: 3.4, over25: 1.9, under25: 1.95 },
    { name: 'Pinnacle', home: 2.1, draw: 3.5, away: 3.6, over25: 1.85, under25: 2.05 },
    { name: 'Hiányos', home: 2.0 },
  ];

  it('a Pinnacle elsőbbséget élvez, a hiányos sorokat kihagyja', () => {
    const fair = marketFairFromBookmakers(books);
    const pin = marketProbsFromOdds([2.1, 3.5, 3.6])!;
    fair.p1x2!.forEach((x, i) => expect(x).toBeCloseTo(pin[i], 9));
    expect(fair.pOver25).toBeCloseTo(marketProbsFromOdds([1.85, 2.05])![0], 9);
  });

  it('Pinnacle híján az átlagot használja; adat nélkül üres', () => {
    const fair = marketFairFromBookmakers([books[0]]);
    expect(fair.p1x2).toBeDefined();
    expect(marketFairFromBookmakers([books[2]])).toEqual({ p1x2: undefined, pOver25: undefined });
  });
});

describe('blendedMarketPct', () => {
  const model = { home: 60, draw: 22, away: 18, over25: 65 };
  const fair = { p1x2: [0.46, 0.27, 0.27], pOver25: 0.55 };

  it('a backtest-hangolt súllyal (0) a piaci referencia jön vissza', () => {
    expect(MARKET_BLEND_MODEL_WEIGHT_1X2).toBe(0);
    expect(blendedMarketPct('1', model, fair)).toBeCloseTo(46, 6);
    expect(blendedMarketPct('X', model, fair)).toBeCloseTo(27, 6);
    expect(blendedMarketPct('UNDER_25', model, fair)).toBeCloseTo(45, 6);
  });

  it('nagyobb modell-súllyal a modell felé mozdul', () => {
    const a = blendedMarketPct('1', model, fair, 0.5, 0.5)!;
    expect(a).toBeGreaterThan(46);
    expect(a).toBeLessThan(60);
  });

  it('piaci referencia nélküli piacra (BTTS, félidő) és referencia hiányában null', () => {
    expect(blendedMarketPct('BTTS_YES', model, fair)).toBeNull();
    expect(blendedMarketPct('FH_OVER_05', model, fair)).toBeNull();
    expect(blendedMarketPct('1', model, undefined)).toBeNull();
    expect(blendedMarketPct('1', model, { pOver25: 0.5 })).toBeNull();
  });

  it('ár-előny: a legjobb szorzó a fair valószínűség ellen pozitív EV-t ad, ugyanazon a könyvön negatívat', () => {
    const books = [
      { name: 'Pinnacle', home: 2.1, draw: 3.5, away: 3.6 },
      { name: 'Bet365', home: 2.25, draw: 3.4, away: 3.5 },
    ];
    const f = marketFairFromBookmakers(books);
    const p = blendedMarketPct('1', model, f)! / 100;
    expect(2.25 * p - 1).toBeGreaterThan(0); // jobb ár a konszenzusnál
    expect(2.1 * p - 1).toBeLessThan(0); // a referencia saját árán az árrés miatt negatív
  });
});

import { applyMarketProbabilities, isMarketAnchoredMarket } from '../marketBlend';
import { calculateMarketProbabilities } from '../predictionEngine';

describe('applyMarketProbabilities', () => {
  const model = calculateMarketProbabilities(1.9, 1.1, 1.0, -0.1);
  const fair = { p1x2: [0.5, 0.26, 0.24], pOver25: 0.55 };

  it('a backtest-hangolt súllyal (0) az 1X2 és az O/U 2.5 a piaci referencia', () => {
    const out = applyMarketProbabilities(model, fair)!;
    expect(out.homeWin).toBe(50);
    expect(out.draw).toBe(26);
    expect(out.awayWin).toBe(24);
    expect(out.over25).toBe(55);
  });

  it('az 1X2 egész százalékai pontosan 100-ra jönnek ki', () => {
    const out = applyMarketProbabilities(model, { p1x2: [0.4567, 0.2733, 0.27] })!;
    expect(out.homeWin + out.draw + out.awayWin).toBe(100);
  });

  it('megőrzi a gólpiacok monotonitását és a kombinált piac korlátait', () => {
    for (const over of [0.2, 0.55, 0.9]) {
      const out = applyMarketProbabilities(model, { pOver25: over })!;
      expect(out.over35).toBeLessThanOrEqual(out.over25);
      expect(out.over25).toBeLessThanOrEqual(out.over15);
      expect(out.bttsAndOver25!).toBeLessThanOrEqual(Math.min(out.bttsYes, out.over25));
      // a nem érintett mezők (BTTS, félidő) a modell értékei maradnak
      expect(out.bttsYes).toBe(model.bttsYes);
      expect(out.fhOver05).toBe(model.fhOver05);
    }
  });

  it('az exact mezők a piaci értékekhez igazodnak; a bemenetet nem módosítja', () => {
    const before = JSON.stringify(model);
    const out = applyMarketProbabilities(model, fair)!;
    expect(out.exact!.homeWin).toBeCloseTo(50, 1);
    expect(out.exact!.over25).toBeCloseTo(55, 1);
    expect(JSON.stringify(model)).toBe(before);
  });

  it('piaci referencia nélkül null; a piacosztályozás', () => {
    expect(applyMarketProbabilities(model, {})).toBeNull();
    expect(isMarketAnchoredMarket('1')).toBe(true);
    expect(isMarketAnchoredMarket('OVER_25')).toBe(true);
    expect(isMarketAnchoredMarket('BTTS_YES')).toBe(false);
    expect(isMarketAnchoredMarket('FH_OVER_05')).toBe(false);
  });
});
