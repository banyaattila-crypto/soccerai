export const APP_VERSION = '1.25.0';
export const APP_RELEASE_NAME = 'Őszinte Felület: Bizonytalanság, Szimulált Ár Jelölés, Kalibrációs Diagram és Tőkegörbe';
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
    'Érzékenységi sáv a tipp-kártyákon: a modell-esély mellett látszik, hogyan mozog a valószínűség, ha a várható gólok (λ) a mintából becsült hibával eltérnek',
    'Őszinte adatminőség-felirat: Szezon-illesztés / Részleges / Vékony minta / Ligaátlag + prior, a mögötte álló meccsszámmal',
    'Szimulált és lejárt ár egyértelmű jelölése: csíkozott sáv, szaggatott keretek, külön jelvény (színvakon is megkülönböztethető)',
    'Döntés-központú állapotsor és üres állapot: ha nincs valós ár, a lista kifejezetten nem fogadási ajánlás; ha nincs jelölt, nincs kényszerített tipp',
    'Megbízhatósági (reliability) diagram a Módszertanban, illusztratív mintaadat jelöléssel',
    'Tőkegörbe és maximális drawdown a Tétnaplóban',
    'Akadálymentesség: AA kontrasztú szürke szövegek, prefers-reduced-motion támogatás (CSS és labda-animáció), diagramok szöveges alternatívával',
    '219 / 219 zöld teszt (23 tesztfájl)',
  ],
};
