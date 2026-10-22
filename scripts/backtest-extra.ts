/**
 * Kisebb ligák: mennyire közelíti meg a modell a piacot ott, ahol a top-5 ligákon 0,02 log-loss a rés?
 *
 * Adat: data/backtest/extra/*.csv (football-data.co.uk "extra ligák", 16 liga) és kontrollként a top-5 ligák
 * (data/backtest/*.csv). Mindenhol ugyanaz a záró referencia: a bukmékerek átlaga (AvgC), mert a Pinnacle záró ár
 * a fájlok újabb soraiból hiányzik. Walk-forward: egy meccset csak a nála korábbi meccsek jósolnak, prior nélkül.
 * Szakaszok dátum szerint: bemelegítés < 2024-07-01, hangolás 2024-07-01..2025-06-30, holdout >= 2025-07-01.
 *
 * Futtatás: npx tsx scripts/backtest-extra.ts   (kimenet: docs/backtest-extra-leagues.md)
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseFootballDataCsv,
  parseFootballDataExtraCsv,
  walkForward,
  evaluate1x2,
  type BacktestMatch,
} from '../src/services/backtestEngine';

const TOP5_DIR = join(process.cwd(), 'data', 'backtest');
const EXTRA_DIR = join(TOP5_DIR, 'extra');
const TUNE_START = Date.UTC(2024, 6, 1);
const HOLD_START = Date.UTC(2025, 6, 1);
const TRAIN_FROM = Date.UTC(2021, 6, 1); // régebbi meccs csak lassítaná az illesztést (az időlecsengés amúgy is elhalványítja)
const MIN_HOLDOUT = 150;

const NAMES: Record<string, string> = {
  E0: 'Premier League', SP1: 'La Liga', I1: 'Serie A', D1: 'Bundesliga', F1: 'Ligue 1',
  ARG: 'Argentína', AUT: 'Ausztria', BRA: 'Brazília Série A', CHN: 'Kína', DNK: 'Dánia', FIN: 'Finnország',
  IRL: 'Írország', JPN: 'Japán J1', MEX: 'Mexikó', NOR: 'Norvégia', POL: 'Lengyelország', ROU: 'Románia',
  RUS: 'Oroszország', SWE: 'Svédország', SWZ: 'Svájc', USA: 'USA (MLS)',
};

const all: BacktestMatch[] = [];
for (const f of readdirSync(TOP5_DIR).filter((x) => x.endsWith('.csv'))) {
  const [league, season] = f.replace('.csv', '').split('_');
  all.push(...parseFootballDataCsv(readFileSync(join(TOP5_DIR, f), 'utf8'), league, season, 'avg'));
}
for (const f of readdirSync(EXTRA_DIR).filter((x) => x.endsWith('.csv'))) {
  all.push(...parseFootballDataExtraCsv(readFileSync(join(EXTRA_DIR, f), 'utf8'), f.replace('.csv', ''), 'avg'));
}
const matches = all.filter((m) => m.ts >= TRAIN_FROM);
console.log(`Meccsek: ${matches.length}, ligák: ${new Set(matches.map((m) => m.league)).size}`);

const records = walkForward(matches, { predictFromTs: TUNE_START, refitEveryDays: 14 });
console.log(`Predikciók: ${records.length}`);

const f4 = (x: number) => x.toFixed(4);
interface Row {
  code: string;
  name: string;
  nHold: number;
  naive: number;
  model: number;
  market: number;
  gap: number;
  skill: number;
  modelSkill: number;
  nTune: number;
  gapTune: number;
}
const rows: Row[] = [];
for (const code of new Set(matches.map((m) => m.league))) {
  const recs = records.filter((r) => r.match.league === code);
  const hold = evaluate1x2(recs.filter((r) => r.match.ts >= HOLD_START), 0);
  const tune = evaluate1x2(recs.filter((r) => r.match.ts < HOLD_START), 0);
  if (hold.model.n === 0) continue;
  rows.push({
    code,
    name: NAMES[code] ?? code,
    nHold: hold.model.n,
    naive: hold.naive.logLoss,
    model: hold.model.logLoss,
    market: hold.market.logLoss,
    gap: hold.model.logLoss - hold.market.logLoss,
    skill: hold.naive.logLoss - hold.market.logLoss,
    modelSkill: hold.naive.logLoss - hold.model.logLoss,
    nTune: tune.model.n,
    gapTune: tune.model.logLoss - tune.market.logLoss,
  });
}
rows.sort((a, b) => a.gap - b.gap);

const top5 = new Set(['E0', 'SP1', 'I1', 'D1', 'F1']);
const line = (r: Row) =>
  `| ${r.name}${top5.has(r.code) ? ' (kontroll)' : ''}${r.nHold < MIN_HOLDOUT ? ' *' : ''} | ${r.nHold} | ${f4(r.naive)} | ${f4(r.model)} | ${f4(r.market)} | **${r.gap.toFixed(4)}** | ${r.gapTune.toFixed(4)} | ${r.skill.toFixed(4)} | ${r.modelSkill.toFixed(4)} |`;

const md = `# Kisebb ligák backtestje: modell vs. piac

Generálva: ${new Date().toISOString().slice(0, 10)}. Forrás: football-data.co.uk (top-5 ligák és 16 "extra liga"). Záró referencia mindenhol a bukmékerek átlaga (AvgC), a Pinnacle záró ár az újabb sorokból hiányzik. Walk-forward, kézi prior nélkül, hangolt paraméterek (ξ = 0,0015, K = 5). Holdout: 2025-07-01-től; hangolás: 2024-07-01 – 2025-06-30. A * jelölt ligán a holdout kisebb, mint ${MIN_HOLDOUT} meccs (megbízhatatlan).

Rés = modell log-loss − piac log-loss (kisebb a jobb; 0: a modell eléri a piacot). Piaci előny a naivhoz = naiv − piac, modell előnye a naivhoz = naiv − modell: azt mutatja, mennyi információ van a piacban, ill. a modellben a puszta gyakorisághoz képest.

| Liga | Holdout N | Naiv | Modell | Piac | Rés (holdout) | Rés (hangolás) | Piac előnye a naivhoz | Modell előnye a naivhoz |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows.map(line).join('\n')}
`;
writeFileSync(join(process.cwd(), 'docs', 'backtest-extra-leagues.md'), md);
console.log('\n' + md);
