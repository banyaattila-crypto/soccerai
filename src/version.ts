export const APP_VERSION = '1.24.9';
export const APP_RELEASE_NAME = 'Meccs Szakértői Elemzés és Részletes Magyarázat';
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
    'Szakértői Elemzés & Meccs Magyarázat (MatchExplanationCard.tsx): Bármely mérkőzés megnyitásakor részletes, természetes magyar nyelvű taktikai elemzés',
    'Átfogó meccsnarratíva: Erőviszonyok, favorit státusz, tabella-helyezések és formaelemzés',
    'Góldinamika & Tempó: Dixon–Coles Poisson és xG eloszlás alapján kalkulált gólvárás és taktikai meccsritmus',
    'Tipp Részletes Indoklása: Miért pont azt a piacot választotta az algoritmus (1X2, BTTS, Over/Under 2.5, kombinált piacok)',
    'Négy Strukturált Kulcstényező & Kockázatelemzés: Erőviszony, gólprofil, fogadási fókusz, taktikai megjegyzés és kockázati szint',
    'Lenyitható matematikai diagnosztika: Kvantitatív adatok és λ-rács stabilitás egyetlen kattintással elérhető haladó felhasználóknak',
    '210 / 210 Zöld Teszt: Teljes körű unit és regressziós tesztfedettség',
  ],
};
