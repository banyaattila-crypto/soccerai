/**
 * Közös dátum- és időzóna-kezelő segédfüggvények
 * Minden dátumot a felhasználó helyi időzónájában (pl. Europe/Budapest) formázunk,
 * elkerülve a .toISOString() UTC-eltolódásából adódó éjféli dátumhibákat.
 */

export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatLocalTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function getRelativeDateStr(offsetDays: number = 0, baseDate: Date = new Date()): string {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  d.setDate(d.getDate() + offsetDays);
  return formatLocalDate(d);
}

export function parseIsoToLocalDateAndTime(isoString: string): {
  kickoffDate: string;
  kickoffTime: string;
} {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) {
    const fallback = new Date();
    return {
      kickoffDate: formatLocalDate(fallback),
      kickoffTime: '18:00',
    };
  }
  return {
    kickoffDate: formatLocalDate(d),
    kickoffTime: formatLocalTime(d),
  };
}
