import { describe, it, expect } from 'vitest';
import { evaluatePickWon, getMarketCategory } from '../betEvaluation';

describe('evaluatePickWon', () => {
  describe('1X2 Piacok és címkék (Hibajavítás ellenőrzése)', () => {
    it('helyesen értékeli a csapatnév + (1) formátumú címkét (pl. Arsenal (1))', () => {
      // Arsenal (1) hazai győzelem 2-1-nél: NYERT
      expect(evaluatePickWon(2, 1, undefined, 'Arsenal (1)')).toBe(true);
      // Arsenal (1) hazai győzelem 1-1-nél: VESZTETT
      expect(evaluatePickWon(1, 1, undefined, 'Arsenal (1)')).toBe(false);
      // Arsenal (1) hazai győzelem 0-2-nél: VESZTETT
      expect(evaluatePickWon(0, 2, undefined, 'Arsenal (1)')).toBe(false);
    });

    it('helyesen értékeli a csapatnév + Győzelem (1) formátumot', () => {
      expect(evaluatePickWon(3, 0, undefined, 'Real Madrid Győzelem (1)')).toBe(true);
      expect(evaluatePickWon(1, 2, undefined, 'Real Madrid Győzelem (1)')).toBe(false);
    });

    it('helyesen értékeli a vendég győzelmet (2) formátumban (pl. Chelsea (2))', () => {
      expect(evaluatePickWon(0, 1, undefined, 'Chelsea (2)')).toBe(true);
      expect(evaluatePickWon(1, 0, undefined, 'Chelsea (2)')).toBe(false);
      expect(evaluatePickWon(2, 2, undefined, 'Chelsea (2)')).toBe(false);
    });

    it('helyesen értékeli a Döntetlen (X) formátumot', () => {
      expect(evaluatePickWon(1, 1, undefined, 'Döntetlen (X)')).toBe(true);
      expect(evaluatePickWon(0, 0, undefined, 'Döntetlen (X)')).toBe(true);
      expect(evaluatePickWon(2, 1, undefined, 'Döntetlen (X)')).toBe(false);
    });

    it('helyesen kezeli a piackódokat (1, X, 2, HOME_WIN, DRAW, AWAY_WIN)', () => {
      expect(evaluatePickWon(2, 0, '1')).toBe(true);
      expect(evaluatePickWon(0, 2, '1')).toBe(false);
      expect(evaluatePickWon(1, 1, 'X')).toBe(true);
      expect(evaluatePickWon(2, 1, 'X')).toBe(false);
      expect(evaluatePickWon(0, 1, '2')).toBe(true);
      expect(evaluatePickWon(1, 0, '2')).toBe(false);

      expect(evaluatePickWon(3, 1, 'HOME_WIN')).toBe(true);
      expect(evaluatePickWon(2, 2, 'DRAW')).toBe(true);
      expect(evaluatePickWon(1, 3, 'AWAY_WIN')).toBe(true);
    });
  });

  describe('Félidős piac: FH_OVER_05 (1. félidő 0.5 gól felett)', () => {
    it('ha van félidős adat és volt gól az 1. félidőben: NYERT', () => {
      // 1-0 a félidőben, 1-2 a végeredmény -> 1. félidőben volt gól
      expect(evaluatePickWon(1, 2, 'FH_OVER_05', undefined, 1, 0)).toBe(true);
      expect(evaluatePickWon(2, 2, undefined, '1. félidő 0.5 gól felett', 0, 1)).toBe(true);
    });

    it('ha van félidős adat és 0-0 volt a félidőben: VESZTETT (még ha a 2. félidőben sok gól is esett!)', () => {
      // Félidő 0-0, végeredmény 4-3 -> az 1. félidőben nem volt gól!
      expect(evaluatePickWon(4, 3, 'FH_OVER_05', undefined, 0, 0)).toBe(false);
    });

    it('ha nincs félidős adat, de a teljes meccs 0-0 lett: biztosan VESZTETT', () => {
      expect(evaluatePickWon(0, 0, 'FH_OVER_05')).toBe(false);
    });

    it('ha nincs félidős adat, de a teljes meccsen esett gól: NULL (nem eldönthető, nem feltételezhető 1. félidős gól)', () => {
      expect(evaluatePickWon(2, 1, 'FH_OVER_05')).toBeNull();
    });
  });

  describe('Gólszám piacok (Over / Under)', () => {
    it('Over 2.5 gól kiértékelése', () => {
      expect(evaluatePickWon(2, 1, 'OVER_25')).toBe(true); // 3 gól > 2.5
      expect(evaluatePickWon(1, 1, 'OVER_25')).toBe(false); // 2 gól <= 2.5
      expect(evaluatePickWon(3, 0, undefined, '2.5 gól felett')).toBe(true);
      expect(evaluatePickWon(1, 0, undefined, '2.5 gól felett')).toBe(false);
    });

    it('Under 2.5 gól kiértékelése', () => {
      expect(evaluatePickWon(1, 1, 'UNDER_25')).toBe(true); // 2 gól < 2.5
      expect(evaluatePickWon(2, 1, 'UNDER_25')).toBe(false); // 3 gól >= 2.5
      expect(evaluatePickWon(0, 0, undefined, '2.5 gól alatt')).toBe(true);
    });

    it('Over 1.5 és Over 3.5 gól kiértékelése', () => {
      expect(evaluatePickWon(1, 1, 'OVER_15')).toBe(true);
      expect(evaluatePickWon(1, 0, 'OVER_15')).toBe(false);

      expect(evaluatePickWon(3, 1, 'OVER_35')).toBe(true); // 4 gól > 3.5
      expect(evaluatePickWon(2, 1, 'OVER_35')).toBe(false); // 3 gól <= 3.5
    });
  });

  describe('Mindkét csapat szerez gólt (BTTS)', () => {
    it('BTTS Igen helyesen működik', () => {
      expect(evaluatePickWon(1, 1, 'BTTS_YES')).toBe(true);
      expect(evaluatePickWon(2, 3, 'BTTS')).toBe(true);
      expect(evaluatePickWon(2, 0, 'BTTS_YES')).toBe(false);
      expect(evaluatePickWon(0, 1, 'BTTS_YES')).toBe(false);
      expect(evaluatePickWon(1, 1, undefined, 'Mindkét csapat szerez gólt (BTTS)')).toBe(true);
    });

    it('BTTS Nem helyesen működik', () => {
      expect(evaluatePickWon(2, 0, 'BTTS_NO')).toBe(true);
      expect(evaluatePickWon(0, 0, 'BTTS_NO')).toBe(true);
      expect(evaluatePickWon(1, 1, 'BTTS_NO')).toBe(false);
    });
  });

  describe('Kombinált piac (BTTS & Over 2.5)', () => {
    it('helyesen értékeli a BTTS & Over 2.5 piacot', () => {
      expect(evaluatePickWon(2, 1, 'BTTS_AND_OVER25')).toBe(true); // mindkettő lőtt és 3 > 2.5
      expect(evaluatePickWon(1, 1, 'BTTS_AND_OVER25')).toBe(false); // mindkettő lőtt, de 2 <= 2.5
      expect(evaluatePickWon(3, 0, 'BTTS_AND_OVER25')).toBe(false); // 3 > 2.5, de nem lőtt mindkettő
      expect(evaluatePickWon(2, 2, undefined, 'BTTS és 2.5 gól felett')).toBe(true);
    });
  });

  describe('Hibaág és ismeretlen piac kezelése (Nem eshet totalGoals > 2.5-re!)', () => {
    it('ismeretlen piac vagy címke esetén NULL-t ad vissza, NEM a totalGoals > 2.5-öt', () => {
      // Korábbi bug: ismeretlen címke esetén totalGoals > 2.5 lefutott, így 3-0-nál nyertesnek jelölte!
      expect(evaluatePickWon(3, 0, 'UNKNOWN_MARKET', 'Ismeretlen speciális tipp')).toBeNull();
      expect(evaluatePickWon(0, 0, 'UNKNOWN_MARKET', 'Ismeretlen speciális tipp')).toBeNull();
    });

    it('hiányzó vagy érvénytelen gólok esetén NULL-t ad vissza', () => {
      expect(evaluatePickWon(undefined, 2, '1')).toBeNull();
      expect(evaluatePickWon(1, undefined, '1')).toBeNull();
      expect(evaluatePickWon(NaN, 1, '1')).toBeNull();
      expect(evaluatePickWon(-1, 0, '1')).toBeNull();
    });
  });
});

describe('getMarketCategory', () => {
  it('helyesen kategorizálja az 1X2 piacokat még csapatnévvel is', () => {
    expect(getMarketCategory(undefined, 'Arsenal (1)')).toBe('1X2');
    expect(getMarketCategory(undefined, 'Chelsea (2)')).toBe('1X2');
    expect(getMarketCategory(undefined, 'Döntetlen (X)')).toBe('1X2');
    expect(getMarketCategory('1')).toBe('1X2');
    expect(getMarketCategory('HOME_WIN')).toBe('1X2');
  });

  it('helyesen kategorizálja a gólszám és BTTS piacokat', () => {
    expect(getMarketCategory('OVER_25')).toBe('OVER_25');
    expect(getMarketCategory(undefined, '2.5 gól felett')).toBe('OVER_25');
    expect(getMarketCategory('UNDER_25')).toBe('UNDER_25');
    expect(getMarketCategory('BTTS_YES')).toBe('BTTS');
    expect(getMarketCategory('BTTS_AND_OVER25')).toBe('COMBINED');
    expect(getMarketCategory('UNKNOWN')).toBe('ALL');
  });
});
