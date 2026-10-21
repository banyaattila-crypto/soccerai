export const APP_VERSION = '1.22.8';
export const APP_RELEASE_NAME = 'Kalibráció ModelSnapshot Valószínűségi Integráció';
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
    'ModelSnapshot Integráció a Kalibrációban (convertAuditRecordsToChronologicalMatches): Közvetlenül a pre-match auditáláskor elmentett modelSnapshot.probabilities struktúrából olvassa ki a homeWin, draw, awayWin, over25 és bttsYes valószínűségeket durva felezés helyett',
    'Precíziós Brier-pontszám & ECE Mérés: A kalibrációs statisztika a Dixon-Coles modell által ténylegesen kiszámolt valószínűségeket értékeli ki a valós audit meccseken',
    'Bemeneti Match Objektumok Immutabilitása: Szigorú másolatképzés az odds, aiPick és quantAnalysis mezőkről, Object.freeze védelemmel',
    'StatsGrid Időrendi Rendezés Optimalizálás: Memoizált sortedFilteredMatches és csoporton belüli tiszta rendezés',
    '175 / 175 Zöld Egységteszt: Új regressziós tesztekkel megerősített modelSnapshot kalibrációs konverzió és időrendi rendezés, oxlint 0 hiba',
  ],
};
