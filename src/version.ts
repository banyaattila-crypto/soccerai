export const APP_VERSION = '1.35.1';
export const APP_RELEASE_NAME = 'Mérhető Él';
export const APP_RELEASE_DATE = '2026-10-23';
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
    'CLV-mérés: a valós szorzón naplózott tippekhez a rendszer rögzíti a naplózáskori és a kezdés előtti (záró) de-vigelt piaci árat, és kiszámolja a CLV-t 95%-os konfidencia-intervallummal; kevés mintánál (n < 50) nem mond ítéletet, élt csak n >= 100 és pozitív intervallum mellett jelez',
    'Valós szorzók előzetes és záró lekérése a legerősebb tippekhez (napi 40 kérés keret, tartalék a menetrendnek), hogy a tippek piaci áron készüljenek és mérhetők legyenek',
    'Új "Modell ≠ piac" jelző: a backtest (3504 meccs) szerint 5 pp eltérésnél a piac 0,016, 12 pp felett 0,103 log-loss-szal pontosabb; az eltérés a modell hibájának jele, nem rejtett értéké',
    'A szimulált szorzón számolt ROI és profit visszafogott megjelenésű és "szimulált" jelölésű; a "xG" felirat "várható gól"-ra változott (a modell becslése, nem lövésalapú adat)',
    '341 / 341 zöld teszt (39 tesztfájl)',
  ],
};
