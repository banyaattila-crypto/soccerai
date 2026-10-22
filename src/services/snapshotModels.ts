import { FittedDixonColesModel, TeamRating } from './dixonColesFitting';
import snapshot from '../data/leagueModels.json';

/**
 * Előre számolt (pillanatkép) Dixon–Coles modellek az API-Sports ligákhoz (scripts/build-league-models.ts).
 * Az API-Sports ingyenes csomagja nem ad szezon-előzményt, ezért itt a football-data.co.uk előzményeiből
 * származtatott csapaterősségek pótolják a ligaátlagot.
 */

/** Ennyi nap után a pillanatkép elavultnak számít (az erősségek változnak, az időlecsengés a generálás napjához igazodik). */
export const SNAPSHOT_MAX_AGE_DAYS = 120;

interface SnapshotLeague {
  code: string;
  name: string;
  mu: number;
  gamma: number;
  rho: number;
  n: number;
  lastMatch: string;
  teams: Record<string, [number, number, number]>;
}

const leagues = (snapshot as unknown as { leagues: Record<string, SnapshotLeague> }).leagues;
const generatedAt = (snapshot as { generatedAt: string }).generatedAt;

export function getSnapshotAgeDays(nowMs: number = Date.now()): number {
  return (nowMs - new Date(generatedAt).getTime()) / (24 * 3600 * 1000);
}

/**
 * A liga pillanatkép-modellje, vagy null, ha nincs ilyen liga, vagy a pillanatkép elavult.
 */
export function getSnapshotLeagueModel(apiSportsLeagueId: number, nowMs: number = Date.now()): FittedDixonColesModel | null {
  const l = leagues[String(apiSportsLeagueId)];
  if (!l) return null;
  if (getSnapshotAgeDays(nowMs) > SNAPSHOT_MAX_AGE_DAYS) return null;

  const teams: Record<string, TeamRating> = {};
  for (const [key, [attack, defense, played]] of Object.entries(l.teams)) {
    teams[key] = {
      attack,
      defense,
      goalsScored: 0,
      goalsConceded: 0,
      matchesPlayed: played,
      homeScored: 0,
      homeConceded: 0,
      awayScored: 0,
      awayConceded: 0,
      homeMatches: 0,
      awayMatches: 0,
    };
  }
  return {
    leagueCode: `apisports_${apiSportsLeagueId}`,
    teams,
    homeAdvantage: l.gamma,
    avgHomeGoals: Math.round(l.mu * l.gamma * 1000) / 1000,
    avgAwayGoals: l.mu,
    rho: l.rho,
    sampleSize: l.n,
    fittedAt: generatedAt,
  };
}
