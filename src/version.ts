export const APP_VERSION = '1.16.3';
export const APP_RELEASE_NAME = '3D Animált FIFA 2026 Hivatalos Meccslabda (adidas Trionda)';
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
    '3D Animált FIFA 2026 Hivatalos Meccslabda: A bal felső sarokban lévő logó egy élethű, folyamatosan és lágyan forgó 3D adidas Trionda gömbbé alakult át',
    'Hiteles 2026-os VB Dizájn: 4-paneles aerodinamikai mélyvarrások, USA kobaltkék, Mexikó smaragdzöld és Kanada rubinpiros hullámokkal és arany FIFA trófea szegéllyel',
    'Valósághű 3D Sugárkövetés & Fények: Rögzített bal felső megvilágítás, Phong spekuláris csillogás és peremfény a forgó bőr felületén',
    'Energiatakarékos 60 FPS Renderelés: Precomputed LUT projekció, akkumulátorkímélő háttérleállítás és interaktív szuperspin kattintásra',
  ],
};
