export const APP_VERSION = '1.22.9';
export const APP_RELEASE_NAME = 'Gólmátrix UI Tipográfia & Natív Unicode Jelölés';
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
    'Gólmátrix UI Natív Tipográfia (ScoreLabPoissonMatrix.tsx): Nyers LaTeX karakterek ($\\lambda_H$, $\\lambda_A$, $\\rho$, $1/p$) lecserélése tiszta, professzionális natív Unicode (λ_H, λ_A, ρ, 1/p) szimbólumokra',
    'Egységes Módszertani Megjelenítés: A Gólmátrix Poisson nézete mostantól tökéletesen harmonizál a MethodologyView.tsx és MatchDetailModal.tsx matematikai jelölésrendszerével',
    'ModelSnapshot Integráció a Kalibrációban: Közvetlenül a pre-match auditáláskor elmentett modelSnapshot.probabilities struktúrából olvasott precíziós valószínűségek',
    'Bemeneti Match Objektumok Immutabilitása: Szigorú másolatképzés az odds, aiPick és quantAnalysis mezőkről, Object.freeze védelemmel',
    '177 / 177 Zöld Egységteszt: Új regressziós tesztekkel megerősített UI karakter-integritási és tipográfiai vizsgálat, oxlint 0 hiba',
  ],
};
