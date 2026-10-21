export const APP_VERSION = '1.22.4';
export const APP_RELEASE_NAME = 'Vercel Edge CDN Cache-Control Hibavédelem';
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
    'Vercel Edge CDN Cache-Control Védelem (api/matches.ts, api/apisports.ts): Átmeneti 429 Too Many Requests és 5xx upstream hibák esetén szigorúan Cache-Control: no-store fejléc kerül beállításra',
    'Hibás Válaszok Gyorsítótárazásának Kizárása: Kizárólag sikeres (2xx) API válaszoknál kerül beállításra publikus s-maxage CDN gyorsítótár, megelőzve a kiesések beragadását',
    'Audit JSON Import Elszámolás-Integritás: Minden lezárt rekord státusza és profitja kötelezően újraszámolódik a mérkőzés valós góljai (homeScore, awayScore) alapján',
    'Cellaszintű Kelly & 3D Nyomógombok: Elszigetelt, pontos Kelly-méretezés a rácsban és letisztult aranykeretes 3D vezérlők',
    '162 / 162 Zöld Egységteszt: Új regressziós tesztekkel megerősített API proxy gyorsítótárazási és hibavédelmi vizsgálat, oxlint 0 hiba',
  ],
};
