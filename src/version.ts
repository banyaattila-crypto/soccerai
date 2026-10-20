export const APP_VERSION = '1.16.4';
export const APP_RELEASE_NAME = 'Fotorealisztikus 8K adidas TRIONDA PRO FIFA 2026 3D Meccslabda';
export const APP_RELEASE_DATE = '2026-10-20';
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
    'Fotorealisztikus 8K adidas TRIONDA PRO: 4-nézetes ortogonális stúdiófotó-szintézis (0°, 90°, 180°, 270°), valódi poliuretán bőrfelülettel és mikro-textúrával',
    'Hivatalos FIFA 2026 & adidas Elemek: Eredeti FIFA World Cup 2026 arany trófeás embléma, adidas 3-bar logo és FIFA Connected Ball Technology pecsét',
    '3 Rendező Ország Hiteles Hullámai: USA kobaltkék (csillagokkal), Mexikó smaragdzöld (azték motívummal), Kanada rubinpiros (juharlevéllel) és elegáns arany szegélyek',
    'Kétszeres Bilineáris Textúra-szűrés: 100% sima, borotvaéles, aliasing- és vibrálásmentes renderelés 60 FPS-sel',
    'Ultralassú, Nyugodt 3D Rotáció: Méltóságteljes ~60 másodperces fordulat, arcade díszgyűrűk nélkül, tiszta prémium megjelenéssel',
  ],
};
