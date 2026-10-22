/**
 * Walk-forward backtest: modell vs. piac vs. keverék, valós záró oddsokon.
 *
 * Futtatás:
 *   npx tsx scripts/backtest-download.mjs   (egyszeri letöltés: data/backtest/*.csv)
 *   npx tsx scripts/backtest.ts
 *
 * Kimenet: src/data/backtestReport.json (a Módszertan nézet ezt jeleníti meg) és docs/backtest-report.md.
 * A keverési súlyt (marketBlend.ts) a "tune" szezonon hangoljuk, és a "holdout" szezonon mérjük.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseFootballDataCsv,
  walkForward,
  evaluate1x2,
  evaluateTotals,
  fitBlendWeight1x2,
  fitBlendWeightTotals,
  reliabilityBins1x2,
  simulateBetting,
  baselineBetAll,
  weightCurve1x2,
  marketClose1x2,
  outcomeIndex,
  type BacktestMatch,
  type PredictionRecord,
} from '../src/services/backtestEngine';
import { blendLogPool } from '../src/services/marketBlend';

const DATA_DIR = join(process.cwd(), 'data', 'backtest');
// A 2023/24 szezon (2324) csak tanít: a predikciók a hangolási szezonnal (TUNE) kezdődnek.
const TUNE = '2425';
const HOLDOUT = '2526';
const LEAGUE_NAMES: Record<string, string> = {
  E0: 'Premier League',
  SP1: 'La Liga',
  I1: 'Serie A',
  D1: 'Bundesliga',
  F1: 'Ligue 1',
};

function load(): BacktestMatch[] {
  const files = readdirSync(DATA_DIR).filter((f) => f.endsWith('.csv'));
  if (files.length === 0) throw new Error('Nincs CSV a data/backtest mappában. Futtasd: node scripts/backtest-download.mjs');
  const all: BacktestMatch[] = [];
  for (const f of files) {
    const [league, season] = f.replace('.csv', '').split('_');
    all.push(...parseFootballDataCsv(readFileSync(join(DATA_DIR, f), 'utf8'), league, season));
  }
  return all;
}

const f4 = (x: number) => x.toFixed(4);
const f1 = (x: number) => x.toFixed(1);

function main() {
  const matches = load();
  const t0 = Date.now();
  const tuneStart = Math.min(...matches.filter((m) => m.season === TUNE).map((m) => m.ts));
  console.log(`Meccsek: ${matches.length} (${[...new Set(matches.map((m) => m.league))].join(', ')})`);

  const records: PredictionRecord[] = walkForward(matches, { predictFromTs: tuneStart });
  console.log(`Predikciók: ${records.length} (${((Date.now() - t0) / 1000).toFixed(1)} mp)`);

  const tune = records.filter((r) => r.match.season === TUNE);
  const hold = records.filter((r) => r.match.season === HOLDOUT);

  const w1x2 = fitBlendWeight1x2(tune);
  const wTot = fitBlendWeightTotals(tune);
  console.log(`Hangolt modell-súly (tune ${TUNE}): 1X2 = ${w1x2.w}, O/U 2.5 = ${wTot.w}`);

  const tuneScores = evaluate1x2(tune, w1x2.w);
  const holdScores = evaluate1x2(hold, w1x2.w);
  const holdTotals = evaluateTotals(hold, wTot.w);
  const tuneTotals = evaluateTotals(tune, wTot.w);

  const thresholds = [0, 0.02, 0.05];
  const betting = (source: 'model' | 'blend', recs: PredictionRecord[]) =>
    thresholds.map((t) => simulateBetting(recs, source, w1x2.w, t));
  const bettingHold = { model: betting('model', hold), blend: betting('blend', hold) };
  const all = [...tune, ...hold];
  const bettingAll = { model: betting('model', all), blend: betting('blend', all) };
  const baseline = baselineBetAll(hold);

  const holdItems = hold
    .filter((r) => marketClose1x2(r.match))
    .map((r) => ({ r, idx: outcomeIndex(r.match.hg, r.match.ag) }));
  const reliabilityModel = reliabilityBins1x2(holdItems.map((x) => ({ p: x.r.model, idx: x.idx })));
  const reliabilityBlend = reliabilityBins1x2(
    holdItems.map((x) => ({ p: blendLogPool(x.r.model, marketClose1x2(x.r.match)!, w1x2.w), idx: x.idx }))
  );

  const perLeague = Object.keys(LEAGUE_NAMES).map((lg) => {
    const recs = hold.filter((r) => r.match.league === lg);
    const s = evaluate1x2(recs, w1x2.w);
    return { league: LEAGUE_NAMES[lg], n: s.model.n, modelLL: s.model.logLoss, marketLL: s.market.logLoss, blendLL: s.blend.logLoss };
  });

  const curve = weightCurve1x2(tune, [0, 0.05, 0.1, 0.2, 0.3, 0.5, 0.75, 1]);
  const report = {
    generatedAt: new Date().toISOString(),
    source: 'football-data.co.uk (Pinnacle záró és nyitó szorzók)',
    leagues: Object.values(LEAGUE_NAMES),
    seasons: { warmup: '2023/24', tune: '2024/25', holdout: '2025/26' },
    weights: { modelWeight1x2: w1x2.w, modelWeightTotals: wTot.w, curve1x2: curve },
    tune: { n: tuneScores.model.n, scores: tuneScores, totals: tuneTotals },
    holdout: { n: holdScores.model.n, scores: holdScores, totals: holdTotals, perLeague },
    betting: { holdout: bettingHold, tuneAndHoldout: bettingAll, baselineBetAllRoiPct: baseline.roiPct },
    reliability: { model: reliabilityModel, blend: reliabilityBlend },
  };

  mkdirSync(join(process.cwd(), 'src', 'data'), { recursive: true });
  mkdirSync(join(process.cwd(), 'docs'), { recursive: true });
  writeFileSync(join(process.cwd(), 'src', 'data', 'backtestReport.json'), JSON.stringify(report, null, 1));

  const row = (name: string, s: { n: number; logLoss: number; brier: number; rps: number }) =>
    `| ${name} | ${s.n} | ${f4(s.logLoss)} | ${f4(s.brier)} | ${f4(s.rps)} |`;
  const bet = (name: string, arr: ReturnType<typeof betting>) =>
    arr.map((b) => `| ${name} | EV > ${(b.threshold * 100).toFixed(0)}% | ${b.bets} | ${f1(b.claimedEvPct)}% | ${f1(b.roiPct)}% | ${f1(b.clvPct)}% | ${b.zScore.toFixed(2)} |`).join('\n');

  const md = `# Backtest jelentés

Generálva: ${report.generatedAt}. Forrás: ${report.source}. Ligák: ${report.leagues.join(', ')}.
Szezonok: bemelegítés ${report.seasons.warmup} (csak tanít), hangolás ${report.seasons.tune}, **holdout ${report.seasons.holdout}** (a súlyt nem látta).
Walk-forward: egy meccset csak a nála korábbi meccsekből illesztett modell jósol, a kézi klub-priorok nélkül; újraillesztés hetente.

## 1X2 pontosság a holdout szezonon (kisebb a jobb)

| Forrás | N | Log-loss | Brier | RPS |
| :--- | ---: | ---: | ---: | ---: |
${row('Naiv (gyakoriság)', holdScores.naive)}
${row('Modell (Dixon–Coles)', holdScores.model)}
${row('Piac (Pinnacle záró, Shin)', holdScores.market)}
${row(`Keverék (modell súly ${w1x2.w})`, holdScores.blend)}

Over/Under 2.5 log-loss (N=${holdTotals.n}): modell ${f4(holdTotals.model)}, piac ${f4(holdTotals.market)}, keverék (súly ${wTot.w}) ${f4(holdTotals.blend)}.

## Fogadási szimuláció a holdout szezonon (nyitó Pinnacle szorzón)

| Forrás | Küszöb | Fogadás | Állított EV | Valós ROI | CLV | z |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
${bet('Nyers modell', bettingHold.model)}
${bet(`Keverék (nyitó piac, w=${w1x2.w})`, bettingHold.blend)}

Viszonyítás: minden kimenetelre fogadva a hozam ${f1(baseline.roiPct)}% (a piac árrése).
Hangolási görbe (tune szezon, 1X2 log-loss a modell súlyának függvényében): ${curve.map((c) => `w=${c.w}: ${f4(c.logLoss)}`).join('; ')}.

CLV: a nyitó szorzó és a záró, de-vigelt fair ár különbsége. Tartósan pozitív CLV az egyetlen megbízható jele a piacnál jobb információnak.

## Ligánként (holdout, 1X2 log-loss)

| Liga | N | Modell | Piac | Keverék |
| :--- | ---: | ---: | ---: | ---: |
${perLeague.map((p) => `| ${p.league} | ${p.n} | ${f4(p.modelLL)} | ${f4(p.marketLL)} | ${f4(p.blendLL)} |`).join('\n')}
`;
  writeFileSync(join(process.cwd(), 'docs', 'backtest-report.md'), md);
  console.log('\n' + md);
}

main();
