/**
 * Előre számolt (pillanatkép) Dixon–Coles csapaterősségek az API-Sports ligákhoz.
 *
 * Miért: az API-Sports ingyenes csomagja nem ad szezon-előzményt, ezért ezeken a ligákon a modell a ligaátlagra
 * esett vissza (minden meccs ugyanaz a becslés). A football-data.co.uk "extra ligák" CSV-iből itt illesztünk
 * modellt, és a származtatott erősségeket (nem a nyers adatot) egy kis JSON-ba mentjük.
 *
 * Futtatás:
 *   node scripts/backtest-download.mjs --extra     (a CSV-k letöltése a data/backtest/extra mappába)
 *   npx tsx scripts/build-league-models.ts          (kimenet: src/data/leagueModels.json)
 *
 * A pillanatkép idővel avul (az időlecsengés a generálás napjához igazodik), ezért időnként újra kell futtatni;
 * az app a `generatedAt` alapján jelzi/figyelmen kívül hagyja az elavult modellt.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fitDixonColesModel } from '../src/services/dixonColesFitting';
import { parseFootballDataExtraCsv } from '../src/services/backtestEngine';

/** API-Sports liga-azonosító -> football-data.co.uk fájlkód. */
const LEAGUES: Record<number, { code: string; name: string }> = {
  103: { code: 'NOR', name: 'Eliteserien' },
  113: { code: 'SWE', name: 'Allsvenskan' },
  119: { code: 'DNK', name: 'Superliga' },
  244: { code: 'FIN', name: 'Veikkausliiga' },
  357: { code: 'IRL', name: 'League of Ireland Premier Division' },
  98: { code: 'JPN', name: 'J1 League' },
  262: { code: 'MEX', name: 'Liga MX' },
  283: { code: 'ROU', name: 'Liga I' },
  207: { code: 'SWZ', name: 'Super League' },
  106: { code: 'POL', name: 'Ekstraklasa' },
  218: { code: 'AUT', name: 'Bundesliga (Ausztria)' },
  253: { code: 'USA', name: 'MLS' },
};

/**
 * Csapatnév-eltérések: az API-Sports neve (normalizálva) -> a CSV-beli név (normalizálva).
 * Csak ott kell, ahol a két forrás neve nem egyezik, és a program szubsztring-egyeztetése sem találná meg.
 * Kiegészíthető a `scripts/check-league-names.ts` kimenete alapján.
 */
const ALIASES: Record<number, Record<string, string>> = {
  283: {
    universitateacluj: 'ucluj',
    universitateacraiova: 'univcraiova',
    sepsiosk: 'sepsisfgheorghe',
    metaloglobusbucuresti: 'metaloglobusbucharest',
    csikszeredamiercureaciuc: 'csikszeredamciuc',
  },
  98: {
    tokyoverdy: 'verdy',
    yokohamafc: 'yokohama',
  },
  262: {
    atleticosanluis: 'atlsanluis',
  },
};

const MIN_DATE = Date.UTC(2023, 6, 1); // az utolsó ~3 szezon
const DATA_DIR = join(process.cwd(), 'data', 'backtest', 'extra');

import { normalizeTeamName } from '../src/utils/teamUtils';

const out: {
  generatedAt: string;
  source: string;
  xi: number;
  priorStrength: number;
  leagues: Record<string, { code: string; name: string; mu: number; gamma: number; rho: number; n: number; lastMatch: string; teams: Record<string, [number, number, number]> }>;
} = {
  generatedAt: new Date().toISOString(),
  source: 'football-data.co.uk (extra ligák) -> származtatott Dixon–Coles erősségek',
  xi: 0.0015,
  priorStrength: 5,
  leagues: {},
};

for (const [idStr, cfg] of Object.entries(LEAGUES)) {
  const id = Number(idStr);
  const text = readFileSync(join(DATA_DIR, `${cfg.code}.csv`), 'utf8');
  const ms = parseFootballDataExtraCsv(text, cfg.code).filter((m) => m.ts >= MIN_DATE);
  if (ms.length < 100) {
    console.warn(`${cfg.name}: túl kevés meccs (${ms.length}), kihagyva`);
    continue;
  }
  const last = Math.max(...ms.map((m) => m.ts));
  const model = fitDixonColesModel(
    ms.map((m) => ({
      homeTeam: m.home,
      awayTeam: m.away,
      homeGoals: m.hg,
      awayGoals: m.ag,
      date: new Date(m.ts).toISOString().slice(0, 10),
    })),
    `apisports_${id}`,
    out.xi,
    35,
    Date.now(),
    out.priorStrength
  );

  // Csak a legutóbbi szezonokban játszó csapatok maradnak (az utolsó 400 napban lépett pályára)
  const recent = new Set<string>();
  const cutoff = last - 400 * 24 * 3600 * 1000;
  for (const m of ms) {
    if (m.ts >= cutoff) {
      recent.add(normalizeTeamName(m.home));
      recent.add(normalizeTeamName(m.away));
    }
  }
  const teams: Record<string, [number, number, number]> = {};
  for (const [k, t] of Object.entries(model.teams)) {
    if (recent.has(k)) teams[k] = [t.attack, t.defense, t.matchesPlayed];
  }
  for (const [alias, target] of Object.entries(ALIASES[id] ?? {})) {
    if (teams[target]) teams[alias] = teams[target];
  }

  out.leagues[String(id)] = {
    code: cfg.code,
    name: cfg.name,
    mu: model.avgAwayGoals,
    gamma: model.homeAdvantage,
    rho: model.rho,
    n: model.sampleSize,
    lastMatch: new Date(last).toISOString().slice(0, 10),
    teams,
  };
  console.log(
    `${cfg.name.padEnd(36)} meccs ${String(ms.length).padStart(4)}, csapat ${String(Object.keys(teams).length).padStart(2)}, μ=${model.avgAwayGoals} γ=${model.homeAdvantage} ρ=${model.rho}, utolsó: ${out.leagues[String(id)].lastMatch}`
  );
}

writeFileSync(join(process.cwd(), 'src', 'data', 'leagueModels.json'), JSON.stringify(out));
console.log(`\nMentve: src/data/leagueModels.json (${JSON.stringify(out).length} bájt)`);
