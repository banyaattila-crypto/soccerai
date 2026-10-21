export const APP_VERSION = '1.22.5';
export const APP_RELEASE_NAME = 'Csapatnév Deduplikáció & Egységesített Normalizálás';
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
    'Egységesített Csapatnév-Normalizálás (src/utils/teamUtils.ts): Közös, robusztus normalizeTeamName segédfüggvény a teljes kódbázisban (App.tsx, apiSportsClient.ts, dixonColesFitting.ts)',
    'Deduplikációs Ütközések (.slice(0, 5)) Megszüntetése: Az 5-karakteres csonkolás elhagyásával az azonos előtagú csapatok (Man City / Man Utd, Real Madrid / Betis / Balompédica, Sheffield Utd / Wed, Bristol City / Rovers) mérkőzései soha nem esnek egybe vagy vesznek el',
    'Vercel Edge CDN Cache-Control Védelem: Átmeneti 429 és 5xx upstream hibák esetén szigorúan no-store fejléc, kizárva a hibás válaszok gyorsítótárazását',
    'Audit JSON Import Elszámolás-Integritás: Minden lezárt rekord státusza és profitja kötelezően újraszámolódik a mérkőzés valós góljai (homeScore, awayScore) alapján',
    '168 / 168 Zöld Egységteszt: Új regressziós tesztekkel megerősített csapatnév-normalizálás és deduplikációs ellenőrzés, oxlint 0 hiba',
  ],
};
