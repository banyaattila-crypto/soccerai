import type { League } from '../types/football';

/** Belső liga-lista (a nézetekhez és szűrőkhöz); külön fájlban, hogy a mintaadat ne kerüljön a fő csomagba. */
export const LEAGUES: League[] = [
  { id: 'pl', name: 'Premier League', country: 'Anglia', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', priority: 1 },
  { id: 'laliga', name: 'La Liga', country: 'Spanyolország', flag: '🇪🇸', priority: 2 },
  { id: 'seriea', name: 'Serie A', country: 'Olaszország', flag: '🇮🇹', priority: 3 },
  { id: 'bundesliga', name: 'Bundesliga', country: 'Németország', flag: '🇩🇪', priority: 4 },
  { id: 'ucl', name: 'Bajnokok Ligája', country: 'Európa', flag: '⭐', priority: 5 },
  { id: 'uel', name: 'Európa Liga', country: 'Európa', flag: '🏆', priority: 6 },
  { id: 'uecl', name: 'Konferencia Liga', country: 'Európa', flag: '🟢', priority: 7 },
  { id: 'primeira_liga', name: 'Primeira Liga', country: 'Portugália', flag: '🇵🇹', priority: 8 },
  { id: 'nbi', name: 'NB I (OTP Bank Liga)', country: 'Magyarország', flag: '🇭🇺', priority: 9 },
  { id: 'eredivisie', name: 'Eredivisie', country: 'Hollandia', flag: '🇳🇱', priority: 10 },
  { id: 'ligue1', name: 'Ligue 1', country: 'Franciaország', flag: '🇫🇷', priority: 11 },
  { id: 'jupiler', name: 'Jupiler Pro League', country: 'Belgium', flag: '🇧🇪', priority: 13 },
  { id: 'superlig', name: 'Süper Lig', country: 'Törökország', flag: '🇹🇷', priority: 14 },
  { id: 'austria_bundesliga', name: 'Tipico Bundesliga', country: 'Ausztria', flag: '🇦🇹', priority: 15 },
  { id: 'swiss_superleague', name: 'Super League', country: 'Svájc', flag: '🇨🇭', priority: 16 },
  { id: 'scot_prem', name: 'Scottish Premiership', country: 'Skócia', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', priority: 17 },
  { id: 'ekstraklasa', name: 'Ekstraklasa', country: 'Lengyelország', flag: '🇵🇱', priority: 18 },
  { id: 'mls', name: 'Major League Soccer', country: 'USA', flag: '🇺🇸', priority: 20 },
];
