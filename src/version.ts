export const APP_VERSION = '1.31.0';
export const APP_RELEASE_NAME = 'Időben Lefutó Élő Meccsek';
export const APP_RELEASE_DATE = '2026-10-22';
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
    'A lefújt meccs nem marad "ÉLŐ": a kezdéstől számított 150 perc után a lista "Lefújva · frissül" jelölést kap, és nem számít élőnek (a státusz érintetlen, az elszámolás a forrás végeredményére vár)',
    'Gyorsabb frissítés élő meccsnél: 3 percenként (egyébként 10), a proxy élő adatnál 7 percig cache-el, az API-Sports kvóta védve marad',
    'A "Mérkőzés Rács" fül neve "Mérkőzés"',
    '292 / 292 zöld teszt (30 tesztfájl)',
  ],
};
