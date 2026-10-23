/**
 * Az alapértelmezetten követett ligák (API-Sports azonosítók). Szándékosan szűk lista: a napi kérés-keret
 * (TRACKER_CONFIG.DAILY_BUDGET) nem elég az összes liga összes meccsére. Felülírható a TRACKER_LEAGUES
 * környezeti változóval (vesszővel elválasztott azonosítók).
 */
export const DEFAULT_TRACKER_LEAGUES: Record<number, string> = {
  39: 'Premier League',
  140: 'La Liga',
  135: 'Serie A',
  78: 'Bundesliga',
  61: 'Ligue 1',
  2: 'Bajnokok Ligája',
  3: 'Európa Liga',
  848: 'Konferencia Liga',
  88: 'Eredivisie',
  94: 'Primeira Liga',
  40: 'Championship',
  144: 'Jupiler Pro League',
  203: 'Süper Lig',
  179: 'Scottish Premiership',
};

export function parseLeagueIds(env: string | undefined): Set<number> {
  if (env && env.trim()) {
    const ids = env
      .split(',')
      .map((x) => Number(x.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);
    if (ids.length > 0) return new Set(ids);
  }
  return new Set(Object.keys(DEFAULT_TRACKER_LEAGUES).map(Number));
}
