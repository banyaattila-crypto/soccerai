export const APP_VERSION = '1.16.1';
export const APP_RELEASE_NAME = 'Scanner Napszűrés & Fogadható Meccsek Alapértelmezése';
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
    'Scanner Időszak & Státusz Választó: Dedikált kapcsolósáv a Scannerben (Mai Értéktippek, Holnapi Meccsek, Összes Nyitott, Lezárt/Archív EV)',
    'Fogadható Meccsek Alapértelmezése: A Scanner alapértelmezetten a mai, nyitott és fogadható mérkőzéseket rangsorolja, kizárva a tegnapi lezárt meccseket',
    'Időzóna-biztos Dátumkezelés: getRelativeDateStr integráció az éjféli UTC elcsúszások kiküszöbölésére',
    'Nemzetközi Kupák Teljes Lefedettsége: Bajnokok Ligája (UCL, ⭐), Európa Liga (UEL, 🏆) és Konferencia Liga (UECL, 🟢)',
  ],
};
