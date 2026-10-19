export const APP_VERSION = '1.15.0';
export const APP_RELEASE_NAME = 'Pulzáló Élő Meccs Kapszula (Header) & Gyorsszűrő (StatsGrid)';
export const APP_RELEASE_DATE = '2026-10-19';
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
    'Pulzáló Élő Meccs Kapszula a Fejlécben (Header.tsx): Piros, animált pulzáló élő számláló kapszula, amely jelzi a folyamatban lévő meccsek számát és azonnal az élő mérkőzésekhez ugrik',
    'Élő Mérkőzések Gyorsszűrő (StatsGrid.tsx): „Csak Élő” kapcsoló gomb a vezérlősávban, globális eseményvezérléssel és intelligens üres állapot kezeléssel',
    'Valós Idejű Élő Perc & Eredmény Kijelzés: A mérkőzés sorokon, kártyákon és táblázatban azonnal látható az aktuális játékperc és állás',
    '48 darabos Automatikus Vitest Tesztkészlet, szigorú típusbiztonság és 0 Oxlint hiba/figyelmeztetés',
  ],
};
