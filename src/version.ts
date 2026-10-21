export const APP_VERSION = '1.22.10';
export const APP_RELEASE_NAME = 'Dixon-Coles Hazai Előny, Időbeli Súlyozás & Félidő Kalibráció';
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
    'Hazai Pálya Előny (γ) Egyszeres Arányos Skálázása: A computeDixonColesExpectedGoals kizárja a kettős gamma-szorzást, a hazai és vendég várható gólok aránya (lh / la) matematikailag szigorúan egybeesik a homeAdvantage faktorral',
    'Időbeli Súlyozott (ξ) MLE Koordináta-Konzisztencia: A fitDixonColesModel Gamma (γ) frissítési lépése és a rho profil-likelihood illesztése ugyanazt az exponenciális m.weight időbeli súlyt alkalmazza, mint az Alpha és Beta iterációk',
    '100%-ban Azonos Várható Gól Képlet: A Dixon-Coles illesztő rho profil-likelihood rácskeresése közvetlenül a központi computeDixonColesExpectedGoals függvényt hívja meg (megszüntetve az ad-hoc osztókat)',
    '1. Félidei Gólmodell Dixon-Coles Kalibráció (htRatio = 0.42, ρ_HT = -0.08): A sportstatisztikai félidős gólmegoszlással és a 0-0 szelvényes korrekcióval optimalizált 1. félidő 0.5 felett piac',
    '180 / 180 Zöld Egységteszt: Kibővített matematikai és numerikus invariáns regressziós tesztek, oxlint 0 hiba és 0 figyelmeztetés',
  ],
};
