/**
 * Strukturális modellváltoztatások mérése a walk-forward backtesten:
 *  1. hazai/idegenbeli erősség szétválasztása (homeAwaySplitStrength)
 *  2. a feljutó (korábban nem látott) csapatok kezdeti erőssége (unknownTeamPrior)
 *
 * Elv: a paramétert a "tune" szezon (2024/25) log-loss-a alapján választjuk, és a "holdout" (2025/26) igazolja.
 * Futtatás: npx tsx scripts/backtest-structure.ts
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseFootballDataCsv, walkForward, evaluate1x2, type BacktestMatch } from '../src/services/backtestEngine';

const DATA_DIR = join(process.cwd(), 'data', 'backtest');
const TUNE = '2425';
const HOLDOUT = '2526';

function load(): BacktestMatch[] {
  const all: BacktestMatch[] = [];
  for (const f of readdirSync(DATA_DIR).filter((x) => x.endsWith('.csv'))) {
    const [league, season] = f.replace('.csv', '').split('_');
    all.push(...parseFootballDataCsv(readFileSync(join(DATA_DIR, f), 'utf8'), league, season));
  }
  return all;
}

const matches = load();
const tuneStart = Math.min(...matches.filter((m) => m.season === TUNE).map((m) => m.ts));
const f4 = (x: number) => x.toFixed(4);

function run(label: string, opts: Parameters<typeof walkForward>[1]) {
  const recs = walkForward(matches, { predictFromTs: tuneStart, refitEveryDays: 14, ...opts });
  const t = evaluate1x2(recs.filter((r) => r.match.season === TUNE), 0);
  const h = evaluate1x2(recs.filter((r) => r.match.season === HOLDOUT), 0);
  console.log(`${label.padEnd(34)} tune ${f4(t.model.logLoss)}  holdout ${f4(h.model.logLoss)}  (RPS holdout ${f4(h.model.rps)})`);
  return { tune: t.model.logLoss, hold: h.model.logLoss };
}

console.log('--- 1. hazai/idegenbeli szétválasztás ---');
run('alap (nincs szétválasztás)', {});
for (const k of [5, 10, 20, 40, 80]) run(`szétválasztás K=${k}`, { homeAwaySplitStrength: k });

console.log('\n--- 2. feljutó/ismeretlen csapat kezdeti erőssége ---');
for (const [att, def] of [
  [1.0, 1.0],
  [0.95, 1.05],
  [0.9, 1.1],
  [0.85, 1.15],
  [0.8, 1.2],
]) {
  run(`ismeretlen csapat att=${att} def=${def}`, { unknownTeamPrior: { attack: att, defense: def } });
}
