import type { Match } from '../types/football';

/**
 * Rövid kezdési időpont a kártyákra: "10. 22. 21:00". Ha a dátum hiányzik vagy nem YYYY-MM-DD alakú, csak az időt adja,
 * ha az idő hiányzik, csak a dátumot.
 */
export function formatKickoffShort(m: Pick<Match, 'kickoffDate' | 'kickoffTime'>): string {
  const parts = /^\d{4}-(\d{2})-(\d{2})/.exec(m.kickoffDate ?? '');
  const date = parts ? `${parts[1]}. ${parts[2]}.` : '';
  return [date, m.kickoffTime ?? ''].filter(Boolean).join(' ');
}
