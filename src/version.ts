export const APP_VERSION = '1.22.3';
export const APP_RELEASE_NAME = 'Audit JSON Import Elszámolási Integritás & Manipuláció-Védelem';
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
    'Audit JSON Import Elszámolás-Integritás (predictionAuditService): Importáláskor minden lezárt rekord státusza és profitja kötelezően újraszámolódik a mérkőzés valós góljai (homeScore, awayScore) és a hitelesített odds alapján',
    'Elszámolási Csalások Teljes Kizárása: Manipulált JSON-ben átírt státuszok (pl. 0-0 meccs Over 2.5 tippjénél status: WON és fiktív profit) automatikusan felülbírálásra és semlegesítésre kerülnek a valós kimenetel szerint',
    'Hiányos Eredmények Védelme: Gólok nélküli lezártnak hazudott rekordok automatikusan visszaminősülnek PENDING állapotba',
    'Cellaszintű Kelly & 3D Nyomógombok: Elszigetelt, pontos Kelly-méretezés a rácsban és letisztult aranykeretes 3D vezérlők',
    '153 / 153 Zöld Egységteszt: Új regressziós tesztekkel megerősített kriptográfiai és elszámolási védelem, oxlint 0 hiba',
  ],
};
