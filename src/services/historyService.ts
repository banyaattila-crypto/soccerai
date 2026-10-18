import { Match } from '../types/football';

const HISTORY_STORAGE_KEY = 'soccerai_match_history_archive_v1';

/**
 * Megőrzi és összefésüli a lezárt mérkőzéseket a böngésző tartós tárolójában (localStorage).
 * Így a korábbi napok, hetek befejezett meccsei sosem törlődnek.
 */
export function persistFinishedMatchesToHistory(newMatches: Match[]): Match[] {
  if (typeof window === 'undefined' || !newMatches || newMatches.length === 0) {
    return getArchivedFinishedMatches();
  }

  const finishedIncoming = newMatches.filter(
    (m) => m.status === 'FINISHED' && m.homeScore !== undefined && m.awayScore !== undefined
  );

  if (finishedIncoming.length === 0) {
    return getArchivedFinishedMatches();
  }

  const existing = getArchivedFinishedMatches();
  const matchMap = new Map<string, Match>();

  // Korábbi mentett meccsek feltöltése
  existing.forEach((m) => matchMap.set(m.id, m));

  // Új meccsek összefésülése (ha frissebb adat van, felülírja)
  finishedIncoming.forEach((m) => {
    matchMap.set(m.id, m);
  });

  const merged = Array.from(matchMap.values()).sort((a, b) => {
    const dateA = `${a.kickoffDate}T${a.kickoffTime || '00:00'}`;
    const dateB = `${b.kickoffDate}T${b.kickoffTime || '00:00'}`;
    return dateB.localeCompare(dateA); // legfrissebb elöl
  });

  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(merged));
  } catch (err) {
    console.warn('Nem sikerült elmenteni az archív meccseket a localStorage-ba:', err);
  }

  return merged;
}

/**
 * Betölti a korábbi mérkőzések archívumát a helyi tárhelyről.
 */
export function getArchivedFinishedMatches(): Match[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Match[]) : [];
  } catch {
    return [];
  }
}

/**
 * Törli az archivált meccselőzményeket (ha a felhasználó kézzel tisztítani szeretné).
 */
export function clearArchivedFinishedMatches(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // ignore
  }
}
