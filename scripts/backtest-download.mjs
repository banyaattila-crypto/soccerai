// Historikus meccs- és szorzó-CSV-k letöltése a backtesthez (football-data.co.uk).
// Futtatás: node scripts/backtest-download.mjs            (top-5 ligák, 3 szezon)
//           node scripts/backtest-download.mjs --extra    (16 "extra liga": ARG, AUT, BRA, CHN, DNK, FIN, IRL, JPN, MEX, NOR, POL, ROU, RUS, SWE, SWZ, USA)
// A fájlok a data/backtest/ mappába kerülnek (gitignore-olt), a letöltött adat nem megbízható forrásból
// származik: a backtest csak értelmezi (CSV-parser), semmit nem hajt végre belőle.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const LEAGUES = ['E0', 'SP1', 'I1', 'D1', 'F1']; // PL, La Liga, Serie A, Bundesliga, Ligue 1
const SEASONS = ['2324', '2425', '2526'];
const DIR = join(process.cwd(), 'data', 'backtest');
mkdirSync(DIR, { recursive: true });

for (const league of LEAGUES) {
  for (const season of SEASONS) {
    const url = `https://www.football-data.co.uk/mmz4281/${season}/${league}.csv`;
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) {
      console.error(`HIBA ${league} ${season}: HTTP ${res.status}`);
      continue;
    }
    const text = await res.text();
    writeFileSync(join(DIR, `${league}_${season}.csv`), text);
    console.log(`${league} ${season}: ${text.length} bájt`);
  }
}

if (process.argv.includes('--extra')) {
  const EXTRA = ['ARG', 'AUT', 'BRA', 'CHN', 'DNK', 'FIN', 'IRL', 'JPN', 'MEX', 'NOR', 'POL', 'ROU', 'RUS', 'SWE', 'SWZ', 'USA'];
  const EXTRA_DIR = join(DIR, 'extra');
  mkdirSync(EXTRA_DIR, { recursive: true });
  for (const code of EXTRA) {
    const res = await fetch(`https://www.football-data.co.uk/new/${code}.csv`, { redirect: 'follow' });
    if (!res.ok) {
      console.error(`HIBA ${code}: HTTP ${res.status}`);
      continue;
    }
    const text = await res.text();
    writeFileSync(join(EXTRA_DIR, `${code}.csv`), text);
    console.log(`${code}: ${text.length} bájt`);
  }
}
