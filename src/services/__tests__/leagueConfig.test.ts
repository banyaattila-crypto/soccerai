import { describe, it, expect } from 'vitest';
import { SUPPORTED_SECONDARY_LEAGUES, getSecondaryLeaguePriority } from '../apiSportsClient';

describe('API-Sports liga-konfiguráció', () => {
  const leagues = Object.entries(SUPPORTED_SECONDARY_LEAGUES);

  it('a kulcs egyezik a liga azonosítójával, a belső azonosítók és a prioritások egyediek', () => {
    leagues.forEach(([key, l]) => expect(Number(key)).toBe(l.id));
    expect(new Set(leagues.map(([, l]) => l.internalId)).size).toBe(leagues.length);
    expect(new Set(leagues.map(([, l]) => l.priority)).size).toBe(leagues.length);
  });

  it('a gólátlagok életszerűek, és hazai >= vendég', () => {
    for (const [, l] of leagues) {
      expect(l.avgHomeGoals).toBeGreaterThan(1.0);
      expect(l.avgHomeGoals).toBeLessThan(2.2);
      expect(l.avgAwayGoals).toBeGreaterThan(0.8);
      expect(l.avgHomeGoals).toBeGreaterThanOrEqual(l.avgAwayGoals);
    }
  });

  it('tartalmazza a backteszttel jól prediktálható ligákat', () => {
    const keys = leagues.map(([, l]) => l.internalId);
    for (const k of ['eliteserien', 'allsvenskan', 'superliga_dk', 'veikkausliiga', 'ireland_premier', 'j1', 'liga_mx', 'liga1_romania']) {
      expect(keys).toContain(k);
    }
    // a backteszten gyenge ligák (lengyel, osztrák) nem újak: a már meglévőket nem bővítjük velük
    expect(SUPPORTED_SECONDARY_LEAGUES[113].name).toBe('Allsvenskan');
    expect(SUPPORTED_SECONDARY_LEAGUES[283].country).toBe('Románia');
  });

  it('a rendezési prioritás lekérdezhető belső azonosító alapján', () => {
    expect(getSecondaryLeaguePriority('allsvenskan')).toBe(SUPPORTED_SECONDARY_LEAGUES[113].priority);
    expect(getSecondaryLeaguePriority('nincs_ilyen')).toBeUndefined();
  });
});
