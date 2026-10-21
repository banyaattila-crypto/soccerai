export const APP_VERSION = '1.22.7';
export const APP_RELEASE_NAME = 'React Immutabilitás & In-Place Mutációk Felszámolása';
export const APP_RELEASE_DATE = '2026-10-21';
export const APP_GITHUB_REPO = 'https://github.com/banyaattila-crypto/soccerai';
export const APP_GITHUB_RELEASES = 'https://github.com/banyaattila-crypto/soccerai/releases';

export interface VersionInfo {
  version: string;
  releaseDate: string;
  tag: string;
  highlights: string[];
}

export const CURRENT_RELEASE_INFO: VersionInfo = {
  version: APP_VERSION,
  releaseDate: APP_RELEASE_DATE,
  tag: `v${APP_VERSION}`,
  highlights: [
    'Bemeneti Match Objektumok Immutabilitása (attachCachedRealOddsToMatches): Szigorú másolatképzés az odds, aiPick és quantAnalysis mezőkről, megvédve a mock adatokat és a React állapotot a helyben történő mutációtól és TypeError-tól',
    'StatsGrid Időrendi Rendezés Optimalizálás: Memoizált sortedFilteredMatches és csoporton belüli rendezés, kizárva a felületi mutációt és a felesleges újrarendezéseket',
    '3D Logó Bilineáris Interpoláció Javítás: row1 sorból történő mintavételezés a textúra-aliasing teljes megszüntetésére',
    'Egységesített Csapatnév-Normalizálás: Közös normalizeTeamName segédfüggvény (teamUtils.ts) .slice(0, 5) ütközések nélkül',
    '172 / 172 Zöld Egységteszt: Új regressziós tesztekkel megerősített Object.freeze immutabilitási és fagyasztás-védelmi ellenőrzés, oxlint 0 hiba',
  ],
};
