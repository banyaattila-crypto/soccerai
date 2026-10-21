export const APP_VERSION = '1.22.6';
export const APP_RELEASE_NAME = '3D Logó Bilineáris Textúra-Interpoláció & Simítás';
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
    '3D Logó Bilineáris Interpoláció Javítás (src/components/Logo.tsx): A bal alsó texel (c01) a hibás row0 helyett helyesen a row1 sorból kerül kiolvasásra (activeTex[row1 + u0]), megszüntetve a vertikális lépcsőzöttséget és textúra-aliasingot',
    'Tökéletesen Sima Raycaster Textúraszűrés: A 4-pontos bilineáris minta mind a négy sarka (c00, c10, c01, c11) matematikailag precízen vesz részt a labda felületi leképezésében',
    'Egységesített Csapatnév-Normalizálás: Közös, robusztus normalizeTeamName segédfüggvény (teamUtils.ts) a teljes kódbázisban .slice(0, 5) ütközések nélkül',
    'Vercel Edge CDN Cache-Control Védelem: Átmeneti 429 és 5xx upstream hibák esetén szigorúan no-store fejléc',
    '170 / 170 Zöld Egységteszt: Új matematikai és forráskód-integritási regressziós tesztek a bilineáris mintavételezésre, oxlint 0 hiba',
  ],
};
