import { STORAGE_KEY_AUDIT_LOG } from './predictionAuditService';

const ARCHIVE_KEY = 'soccerai_match_history_archive_v1';
const BETSLIP_KEY = 'soccerai_betslip_draft';
const DATASOURCE_KEY = 'focitipp_datasource';
const PURGE_FLAG = 'soccerai_mock_purged_v1';

/** A korábbi mintaadat (szimulációs mód) mérkőzés-azonosítói: m-today-1, m-yest-3, m-tom-2, m-today-ucl-1 stb. */
const MOCK_ID = /^m-(today|yest|tom)-/;

function filterJsonArray(key: string, isMock: (item: unknown) => boolean): void {
  const raw = localStorage.getItem(key);
  if (!raw) return;
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return;
  const kept = parsed.filter((item) => !isMock(item));
  if (kept.length !== parsed.length) localStorage.setItem(key, JSON.stringify(kept));
}

const idOf = (field: string) => (item: unknown): boolean => {
  const v = (item as Record<string, unknown> | null)?.[field];
  return typeof v === 'string' && MOCK_ID.test(v);
};

/**
 * Egyszeri takarítás: a korábbi verziók a szimulációs mód mintameccseit az archívumba és az audit-naplóba is
 * beírhatták, és a szimulációs módot a böngésző megjegyezhette. Ezeket töröljük (a valós rekordok érintetlenek).
 */
export function purgeLegacyMockData(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    if (localStorage.getItem(PURGE_FLAG)) return;
    filterJsonArray(ARCHIVE_KEY, idOf('id'));
    filterJsonArray(STORAGE_KEY_AUDIT_LOG, idOf('matchId'));
    filterJsonArray(BETSLIP_KEY, idOf('matchId'));
    if (localStorage.getItem(DATASOURCE_KEY) === 'builtin') localStorage.setItem(DATASOURCE_KEY, 'api');
    localStorage.setItem(PURGE_FLAG, '1');
  } catch {
    // Sérült tárolt adat vagy nem írható tár: a takarítás kimarad, a következő indításkor újra próbáljuk
  }
}
