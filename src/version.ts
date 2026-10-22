export const APP_VERSION = '1.28.0';
export const APP_RELEASE_NAME = 'Piaci Valószínűség Valós Szorzónál';
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
    'Ahol van valós bukmékeri szorzó, az 1X2 és az Over/Under 2.5 esély a de-vigelt piaci ár (a backtest szerint ez a legpontosabb elérhető becslés: log-loss 0,9776 vs. modell 0,9982)',
    'A modell értékei megmaradnak mellette ("Modell: x%"), a listákon "Piaci ár" jelvény jelzi a forrást',
    'A meccs-részletező EV-oszlopa a piaci konszenzushoz mér (Pinnacle fair); a nyers modell-EV, amelynek hozama a backtesten −12,5% volt, kikerült. BTTS-re nincs EV',
    'Új odds betöltésekor a listák azonnal frissülnek (hálózati kérés nélkül)',
    'A predikciónapló a modell saját valószínűségét rögzíti, nem a piaci felülírást',
    '268 / 268 zöld teszt (27 tesztfájl)',
  ],
};
