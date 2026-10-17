export const APP_VERSION = '1.1.0';
export const APP_RELEASE_NAME = 'Kompakt 4 Füles Dashboard & Módszertan Kiadás';
export const APP_RELEASE_DATE = '2026-10-17';
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
    'Kompakt 4 füles Dashboard felépítés: Napi Top Tippek (alapértelmezett), Mérkőzés Rács, Eredmények, Módszertan',
    'Keskeny, 1 soros KPI Állapotsáv & Hőtérkép Jelmagyarázat (70%-kal rövidebb kezdőoldal)',
    'Alapértelmezett Premier League szűrő a Mérkőzés Rácsban + harmonika-szerűen összecsukható (accordion) ligák',
    'Dedikált Módszertan & Hőtérkép Segédlet fül (Dixon–Coles, Shin de-vigging, λ-rács, Negyed-Kelly)',
    'Élő Football-Data.org API integráció, 3D vektoros logó & 10 perces automata háttérfrissítés',
  ],
};
