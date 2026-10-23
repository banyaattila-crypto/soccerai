export const APP_VERSION = '1.36.0';
export const APP_RELEASE_NAME = 'Szerveroldali Követő';
export const APP_RELEASE_DATE = '2026-10-23';
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
    'Szerveroldali szorzó-követő (GitHub Actions, 20 percenként): a böngészőtől függetlenül rögzíti a legjobb bukméker-ár előnyét a konszenzushoz képest, a záró szorzókat és az eredményeket; a CLV így akkor is gyűlik, ha az app nincs nyitva',
    'Modell nélküli mérés: jelölt = a legjobb ár legalább +2%-kal jobb a Pinnacle (vagy az átlag) de-vigelt fair áránál; CLV 95%-os intervallummal, ROI, bukméker- és ligamegoszlás; az adatok a külön tracker-data ágra kerülnek',
    'Az app szorzó-előlekérésének napi kerete 40-ről 15-re csökkent (a követő 50-et használ, a napi 100 API-kérésen belül)',
    '375 / 375 zöld teszt (41 tesztfájl)',
  ],
};
