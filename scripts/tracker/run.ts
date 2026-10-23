/**
 * Szerveroldali szorzó-követő futtatása (GitHub Actions időzítve, vagy kézzel).
 *
 *   API_SPORTS_KEY=... npx tsx scripts/tracker/run.ts --data tracker-data
 *   npx tsx scripts/tracker/run.ts --data tracker-data --dry     (nem hív API-t, csak a tervet írja ki)
 *   --now <ISO időpont>                                        (csak teszteléshez: az idő előretekerése)
 *
 * Környezeti változók: API_SPORTS_KEY (kötelező, kivéve --dry), TRACKER_DAILY_BUDGET (alap: 50),
 * TRACKER_RESERVE (alap: 12), TRACKER_LEAGUES (vesszővel elválasztott API-Sports ligaazonosítók),
 * TRACKER_API_BASE (csak teszteléshez).
 *
 * Kimenet a --data mappában: state.json (aktív állapot), settled.ndjson (lezárt jelöltek, hozzáfűzve),
 * summary.json és README.md (összegzés). Ha nem volt teendő, nem ír semmit (nincs felesleges commit).
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runTracker, type ApiResponse } from '../../src/services/tracker/trackerRunner';
import {
  TRACKER_CONFIG,
  budgetUsed,
  emptyState,
  planCloseSnapshots,
  planEarlySnapshots,
  planFixtureRefreshes,
  renderSummaryMarkdown,
  summarize,
  type SettledRecord,
  type TrackerState,
} from '../../src/services/tracker/trackerCore';
import { parseLeagueIds } from '../../src/services/tracker/trackerLeagues';

// A TRACKER_API_BASE csak teszteléshez (helyi hamis szerver); élesben az API-Sports végpontja.
const BASE_URL = process.env.TRACKER_API_BASE || 'https://v3.football.api-sports.io';

function argValue(name: string, fallback: string): string {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function readSettled(file: string): SettledRecord[] {
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((l) => JSON.parse(l) as SettledRecord);
}

async function main(): Promise<void> {
  const dir = argValue('--data', 'tracker-data');
  const dry = process.argv.includes('--dry');
  // --now <ISO>: csak teszteléshez (az idő előretekerése)
  const nowArg = argValue('--now', '');
  const nowMs = nowArg ? Date.parse(nowArg) : Date.now();
  mkdirSync(dir, { recursive: true });

  const stateFile = join(dir, 'state.json');
  const settledFile = join(dir, 'settled.ndjson');
  const state: TrackerState = existsSync(stateFile)
    ? (JSON.parse(readFileSync(stateFile, 'utf8')) as TrackerState)
    : emptyState(nowMs);

  const leagueIds = parseLeagueIds(process.env.TRACKER_LEAGUES);
  const cap = Number(process.env.TRACKER_DAILY_BUDGET) || TRACKER_CONFIG.DAILY_BUDGET;
  const reserve = Number(process.env.TRACKER_RESERVE) || TRACKER_CONFIG.RESERVE;

  if (dry) {
    console.log(`Terv (${new Date(nowMs).toISOString()}), keret: ${budgetUsed(state, nowMs)}/${cap}`);
    console.log('záró pillanatképek:', planCloseSnapshots(state, nowMs));
    console.log('meccslisták:', planFixtureRefreshes(state, nowMs));
    console.log('korai pillanatképek:', planEarlySnapshots(state, nowMs));
    return;
  }

  const key = process.env.API_SPORTS_KEY;
  if (!key) {
    console.error('Hiányzik az API_SPORTS_KEY környezeti változó.');
    process.exit(1);
  }

  const api = async (path: string): Promise<ApiResponse> => {
    const res = await fetch(`${BASE_URL}${path}`, { headers: { 'x-apisports-key': key } });
    const remainingHeader = res.headers.get('x-ratelimit-requests-remaining');
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    return {
      status: res.status,
      remaining: remainingHeader !== null && remainingHeader !== '' ? Number(remainingHeader) : undefined,
      json,
    };
  };

  const result = await runTracker(state, {
    api,
    nowMs,
    leagueIds,
    budgetCap: cap,
    reserve,
    log: (m) => console.log(m),
  });

  console.log(
    `Kész: ${result.calls} API-hívás, ${result.newCandidates} új jelölt, ${result.settled.length} lezárt` +
      `${result.stopped ? `, leállt: ${result.stopped}` : ''}. Napi keret: ${budgetUsed(state, nowMs)}/${cap}.`
  );

  // Ha nem történt semmi, nem írunk (nincs felesleges commit az adat-ágon)
  if (result.calls === 0 && result.settled.length === 0) return;

  writeFileSync(stateFile, JSON.stringify(state));
  if (result.settled.length > 0) {
    appendFileSync(settledFile, result.settled.map((s) => JSON.stringify(s)).join('\n') + '\n');
  }
  const allSettled = readSettled(settledFile);
  const summary = summarize(state, allSettled, nowMs);
  writeFileSync(join(dir, 'summary.json'), JSON.stringify(summary, null, 2));
  writeFileSync(join(dir, 'README.md'), renderSummaryMarkdown(summary));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
