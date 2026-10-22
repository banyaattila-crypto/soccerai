export const APP_VERSION = '1.32.0';
export const APP_RELEASE_NAME = 'Keményített Proxy és Dátumos Kártyák';
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
    'Minden mérkőzéskártyán dátum és időpont látszik (pl. "10. 22. 21:00"), élő és lefújt meccsnél is',
    'Proxy: a böngészőből nem igazolható (Origin, Sec-Fetch-Site vagy Referer nélküli) kérés nem éri el a szerveroldali API-kulcsot',
    'Audit ellenőrző összeg: SHA-256 (a régi 53 bites helyett); a régi rekordok érvényesek maradnak. A felirat pontosítva: sérülést jelez, nem hamisítás-biztos',
    'PIN: a felirat képernyőzárként pontosítva; CSP és biztonsági fejlécek (vercel.json); a mintaadat lusta betöltésű (a fő csomag ~20 kB-tal kisebb)',
    '303 / 303 zöld teszt (33 tesztfájl)',
  ],
};
