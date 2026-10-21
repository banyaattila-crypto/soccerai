export const APP_VERSION = '1.24.2';
export const APP_RELEASE_NAME = '3D Taktilis Százalékos Gombok a Kompakt Listákban';
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
    '3D Taktilis Százalékos Pill Gombok (MatchCompactList.tsx, .btn-pill-3d): Mindkét dinamikus százalékos mutató (Mutató 1 & Mutató 2) fotorealisztikus 3D hengeres üvegfénnyel (pill-3d-gloss), felső élfény-tükröződéssel, alsó 3D peremárnyékkal és fizikai benyomódási visszajelzéssel készült el',
    'Gravírozott Tipográfia & Magas Kontraszt: A százalékértékek és szorzók 3D mélységű árnyékot kaptak, megkönnyítve az azonnali leolvasást és a szelvényépítőbe helyezést',
    'Mini 1X2 Gombok 3D Harmóniája: A kompakt sorok 1-X-2 szorzó cellái is megkapták a 3D fizikai gombstílust',
    '196 / 196 Zöld Egységteszt: 17 tesztcsomag, 0 hiba és 0 figyelmeztetés az oxlint és TypeScript strict ellenőrzéseken',
  ],
};
