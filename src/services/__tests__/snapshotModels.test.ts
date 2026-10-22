import { describe, it, expect } from 'vitest';
import { getSnapshotLeagueModel, getSnapshotAgeDays, SNAPSHOT_MAX_AGE_DAYS } from '../snapshotModels';
import { computeExpectedGoalsFromModel, findFuzzyTeamKey } from '../dixonColesFitting';
import { normalizeTeamName } from '../../utils/teamUtils';

describe('normalizeTeamName: speciális betűk', () => {
  it('átírja a ł, ø, æ, ß betűket', () => {
    expect(normalizeTeamName('Widzew Łódź')).toBe('widzewlodz');
    expect(normalizeTeamName('Bodø/Glimt')).toBe('bodoglimt');
    expect(normalizeTeamName('Brøndby IF')).toBe('brondbyif');
    expect(normalizeTeamName('FC Nordsjælland')).toBe('nordsjaelland');
  });
});

describe('findFuzzyTeamKey', () => {
  it('több találatnál a leghosszabb kulcsot választja, kétértelműnél nem választ', () => {
    expect(findFuzzyTeamKey(['tokyo', 'verdy', 'tokyoverdy'], 'tokyoverdy')).toBe('tokyoverdy');
    expect(findFuzzyTeamKey(['tokyo', 'kyoto'], 'tokyoverdy')).toBe('tokyo');
    expect(findFuzzyTeamKey(['tokyo', 'verdy'], 'tokyoverdy')).toBeUndefined(); // egyenlő hosszú: kétértelmű
    expect(findFuzzyTeamKey(['elfsborg', 'malmoff'], 'ifelfsborg')).toBe('elfsborg');
  });

  it('ha a név a kulcs része, a legrövidebb tartalmazó kulcsot veszi; rövid név nem egyeztet', () => {
    expect(findFuzzyTeamKey(['brommapojkarna', 'brommafc'], 'bromma')).toBe('brommafc');
    expect(findFuzzyTeamKey(['abc'], 'ab')).toBeUndefined();
    expect(findFuzzyTeamKey(['abc'], '')).toBeUndefined();
  });
});

describe('előre számolt (pillanatkép) ligamodellek', () => {
  it('a tervezett ligákhoz létezik modell, értelmes paraméterekkel', () => {
    for (const id of [103, 113, 119, 244, 357, 98, 262, 283, 207, 106, 218, 253]) {
      const m = getSnapshotLeagueModel(id);
      expect(m, `liga ${id}`).not.toBeNull();
      expect(Object.keys(m!.teams).length).toBeGreaterThanOrEqual(8);
      expect(m!.sampleSize).toBeGreaterThan(400);
      expect(m!.avgAwayGoals).toBeGreaterThan(0.9);
      expect(m!.avgAwayGoals).toBeLessThan(1.8);
      expect(m!.homeAdvantage).toBeGreaterThanOrEqual(1.05);
      expect(m!.avgHomeGoals).toBeCloseTo(m!.avgAwayGoals * m!.homeAdvantage, 2);
    }
  });

  it('ismeretlen ligára és elavult pillanatképre null', () => {
    expect(getSnapshotLeagueModel(999999)).toBeNull();
    const farFuture = Date.now() + (SNAPSHOT_MAX_AGE_DAYS + 5) * 24 * 3600 * 1000;
    expect(getSnapshotLeagueModel(113, farFuture)).toBeNull();
    expect(getSnapshotAgeDays()).toBeGreaterThanOrEqual(0);
  });

  it('az élő API-Sports csapatnevek megtalálják a modellbeli csapatot (speciális betűk, alias)', () => {
    const find = (id: number, home: string, away: string) => {
      const r = computeExpectedGoalsFromModel(getSnapshotLeagueModel(id)!, home, away, 1.4, 1.1, false);
      return { h: r.homeRating, a: r.awayRating, r };
    };
    expect(find(106, 'Widzew Łódź', 'Gornik Zabrze').h?.matchesPlayed).toBeGreaterThan(0);
    expect(find(103, 'Bodø/Glimt', 'Molde').h?.matchesPlayed).toBeGreaterThan(0);
    expect(find(283, 'Universitatea Cluj', 'FC Botosani').h?.matchesPlayed).toBeGreaterThan(0);
    expect(find(113, 'IF Elfsborg', 'Malmo FF').h?.matchesPlayed).toBeGreaterThan(0);
    // Tokyo Verdy és FC Tokyo két különböző csapat
    const tv = find(98, 'Tokyo Verdy', 'Kashima Antlers').h;
    const ft = find(98, 'FC Tokyo', 'Kashima Antlers').h;
    expect(tv).toBeDefined();
    expect(ft).toBeDefined();
    expect(tv).not.toBe(ft);
  });

  it('a becslés csapatonként eltér (nem egységes ligaátlag)', () => {
    const m = getSnapshotLeagueModel(262)!;
    const a = computeExpectedGoalsFromModel(m, 'Club America', 'Atlas', 1.6, 1.2, false);
    const b = computeExpectedGoalsFromModel(m, 'Puebla', 'Monterrey', 1.6, 1.2, false);
    expect(a.isFitted).toBe(true);
    expect([a.homeXg, a.awayXg]).not.toEqual([b.homeXg, b.awayXg]);
  });
});
