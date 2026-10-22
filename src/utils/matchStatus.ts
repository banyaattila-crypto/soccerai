import type { Match } from '../types/football';

/**
 * Egy mérkőzés legfeljebb ennyi percig lehet "élő" a kezdéstől számítva: 90 perc + félidő + hosszabbítás a
 * rendes játékidőben (~110–120 perc), kupa-hosszabbítással és tizenegyesekkel is ~150 perc alatt véget ér.
 * Ennél régebbi "élő" státusz elavult adat (a forrás még nem jelentette a lefújást), nem zajló mérkőzés.
 */
export const MAX_LIVE_MINUTES = 150;

type KickoffSource = Pick<Match, 'utcDate' | 'kickoffDate' | 'kickoffTime'>;

export function getKickoffMs(m: KickoffSource): number {
  if (m.utcDate) {
    const t = new Date(m.utcDate).getTime();
    if (!isNaN(t)) return t;
  }
  if (m.kickoffDate) {
    const t = new Date(`${m.kickoffDate}T${m.kickoffTime || '00:00'}:00`).getTime();
    if (!isNaN(t)) return t;
  }
  return NaN;
}

/** A forrás szerint élő, de a kezdés óta eltelt idő alapján már biztosan véget ért mérkőzés. */
export function isLiveStale(m: Pick<Match, 'status'> & KickoffSource, nowMs: number = Date.now()): boolean {
  if (m.status !== 'LIVE') return false;
  const kickoff = getKickoffMs(m);
  if (isNaN(kickoff)) return false;
  return nowMs - kickoff > MAX_LIVE_MINUTES * 60 * 1000;
}

/**
 * Valóban zajló mérkőzés: a forrás szerint élő, és nem elavult a státusz. A státuszt (`status`) nem módosítjuk,
 * mert az elszámolás (szelvény, audit) csak a forrás tényleges FINISHED jelentésére és végeredményére támaszkodhat.
 */
export function isMatchLive(m: Pick<Match, 'status' | 'liveStale'>): boolean {
  return m.status === 'LIVE' && !m.liveStale;
}

/**
 * Beállítja a `liveStale` jelzőt. Ha semmi nem változik, ugyanazt a tömböt adja vissza (nincs felesleges újrarenderelés).
 */
export function markStaleLive(matches: Match[], nowMs: number = Date.now()): Match[] {
  let changed = false;
  const out = matches.map((m) => {
    const stale = isLiveStale(m, nowMs);
    if (Boolean(m.liveStale) === stale) return m;
    changed = true;
    return { ...m, liveStale: stale };
  });
  return changed ? out : matches;
}
