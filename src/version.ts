export const APP_VERSION = '1.16.0';
export const APP_RELEASE_NAME = 'Nemzetközi Kupák (UCL, UEL, UECL) Támogatása & Kupa Modellezés';
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
    'Nemzetközi Kupák Teljes Lefedettsége: Bajnokok Ligája (UCL, ⭐), Európa Liga (UEL, 🏆) és Konferencia Liga (UECL, 🟢) támogatás az API-Sports és Football-Data forrásokban',
    'Kvantitatív Kupa Gólátlagok & Dixon-Coles Modellezés: Egyéni európai kupa gólparaméterek (UCL 1.74/1.34, UEL 1.66/1.30, UECL 1.62/1.26) a Poisson előrejelzésekhez',
    'Dinamikus Kupaszűrés & Prioritás-Rendezés (StatsGrid.tsx): Automatikus liga- és kupa-alias feloldás (ucl/cl, uel/el, uecl/ec), kiemelt hely a ligasávban',
    'Automatizált Egységtesztek, 100% Szigorú TypeScript és 0 Oxlint Figyelmeztetés',
  ],
};
