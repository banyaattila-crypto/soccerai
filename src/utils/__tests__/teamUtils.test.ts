import { describe, it, expect } from 'vitest';
import { normalizeTeamName } from '../teamUtils';
import type { Match } from '../../types/football';

describe('normalizeTeamName & Deduplication collision integrity', () => {
  describe('normalizeTeamName behavior', () => {
    it('handles undefined, null and empty strings gracefully', () => {
      expect(normalizeTeamName('')).toBe('');
      expect(normalizeTeamName(undefined)).toBe('');
      expect(normalizeTeamName(null)).toBe('');
    });

    it('strips diacritics and special characters correctly', () => {
      expect(normalizeTeamName('Atlético Madrid')).toBe('atleticomadrid');
      expect(normalizeTeamName('Bayern München')).toBe('bayernmunchen');
      expect(normalizeTeamName('Deportivo Alavés')).toBe('deportivoalaves');
      expect(normalizeTeamName('Saint-Étienne')).toBe('saintetienne');
    });

    it('removes common club prefixes and suffixes without losing team identity', () => {
      expect(normalizeTeamName('FC Barcelona')).toBe('barcelona');
      expect(normalizeTeamName('Real Madrid CF')).toBe('realmadrid');
      expect(normalizeTeamName('AFC Bournemouth')).toBe('bournemouth');
      expect(normalizeTeamName('1. FC Köln')).toBe('koln');
      expect(normalizeTeamName('AC Milan')).toBe('milan');
      expect(normalizeTeamName('AS Roma')).toBe('roma');
      expect(normalizeTeamName('SS Lazio')).toBe('lazio');
      expect(normalizeTeamName('VfB Stuttgart')).toBe('stuttgart');
      expect(normalizeTeamName('VfL Wolfsburg')).toBe('wolfsburg');
      expect(normalizeTeamName('RB Leipzig')).toBe('leipzig');
      expect(normalizeTeamName('BVB Dortmund')).toBe('dortmund');
      expect(normalizeTeamName('UD Almería')).toBe('almeria');
      expect(normalizeTeamName('OGC Nice')).toBe('nice');
      expect(normalizeTeamName('RC Lens')).toBe('lens');
    });

    it('strictly separates teams that share identical 5-character prefixes (no slice(0, 5) collision)', () => {
      // Manchester City ("manch...") vs. Manchester United ("manch...")
      const mc = normalizeTeamName('Manchester City');
      const mu = normalizeTeamName('Manchester United');
      expect(mc).toBe('manchestercity');
      expect(mu).toBe('manchesterunited');
      expect(mc).not.toBe(mu);

      // Real Madrid vs. Real Betis vs. Real Balompédica
      const rm = normalizeTeamName('Real Madrid');
      const rb = normalizeTeamName('Real Betis');
      const rbal = normalizeTeamName('Real Balompédica');
      expect(rm).toBe('realmadrid');
      expect(rb).toBe('realbetis');
      expect(rbal).toBe('realbalompedica');
      expect(rm).not.toBe(rb);
      expect(rb).not.toBe(rbal);

      // Sheffield United vs. Sheffield Wednesday
      const su = normalizeTeamName('Sheffield United');
      const sw = normalizeTeamName('Sheffield Wednesday');
      expect(su).toBe('sheffieldunited');
      expect(sw).toBe('sheffieldwednesday');
      expect(su).not.toBe(sw);

      // Bristol City vs. Bristol Rovers
      const bc = normalizeTeamName('Bristol City');
      const br = normalizeTeamName('Bristol Rovers');
      expect(bc).toBe('bristolcity');
      expect(br).toBe('bristolrovers');
      expect(bc).not.toBe(br);
    });
  });

  describe('Deduplication logic simulation', () => {
    it('does NOT drop distinct matches playing on the same date when home teams share first 5 chars', () => {
      const match1 = {
        id: 'fd-1',
        homeTeam: { id: '1', name: 'Manchester City', shortName: 'Man City', logo: '' },
        awayTeam: { id: '2', name: 'Arsenal FC', shortName: 'Arsenal', logo: '' },
        leagueId: 'PL',
        leagueName: 'Premier League',
        leagueCountry: 'England',
        leagueFlag: '',
        kickoffDate: '2026-10-21',
        kickoffTime: '15:00',
        kickoffTimestamp: Date.now(),
        status: 'UPCOMING' as const,
        probabilities: { homeWin: 55, draw: 25, awayWin: 20 },
        odds: { home: 1.8, draw: 3.6, away: 4.5 },
      };

      const match2 = {
        id: 'apisports-2',
        homeTeam: { id: '3', name: 'Manchester United', shortName: 'Man Utd', logo: '' },
        awayTeam: { id: '4', name: 'Chelsea FC', shortName: 'Chelsea', logo: '' },
        leagueId: 'PL',
        leagueName: 'Premier League',
        leagueCountry: 'England',
        leagueFlag: '',
        kickoffDate: '2026-10-21',
        kickoffTime: '17:30',
        kickoffTimestamp: Date.now() + 7200000,
        status: 'UPCOMING' as const,
        probabilities: { homeWin: 45, draw: 28, awayWin: 27 },
        odds: { home: 2.1, draw: 3.4, away: 3.2 },
      };

      const raw = [match1, match2] as unknown as Match[];
      const seen = new Set<string>();
      const combined = raw.filter((m) => {
        const normHome = normalizeTeamName(m.homeTeam.name);
        const normAway = normalizeTeamName(m.awayTeam.name);
        const key = `${m.kickoffDate}_${normHome}_${normAway}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Mindkét meccsnek meg kell maradnia, a régi slice(0, 5) eldobta volna az egyiket!
      expect(combined.length).toBe(2);
      expect(combined[0].homeTeam.name).toBe('Manchester City');
      expect(combined[1].homeTeam.name).toBe('Manchester United');
    });

    it('correctly deduplicates the exact same match reported with slightly different FC/CF variants', () => {
      const matchFromFootballData = {
        id: 'fd-10',
        homeTeam: { id: '1', name: 'FC Barcelona', shortName: 'Barça', logo: '' },
        awayTeam: { id: '2', name: 'Real Madrid CF', shortName: 'Real Madrid', logo: '' },
        leagueId: 'PD',
        leagueName: 'La Liga',
        leagueCountry: 'Spain',
        leagueFlag: '',
        kickoffDate: '2026-10-21',
        kickoffTime: '21:00',
        kickoffTimestamp: Date.now(),
        status: 'UPCOMING' as const,
        probabilities: { homeWin: 40, draw: 30, awayWin: 30 },
        odds: { home: 2.3, draw: 3.3, away: 2.9 },
      };

      const matchFromApiSports = {
        id: 'apisports-100',
        homeTeam: { id: '529', name: 'Barcelona', shortName: 'Barcelona', logo: '' },
        awayTeam: { id: '541', name: 'Real Madrid', shortName: 'Real Madrid', logo: '' },
        leagueId: 'PD',
        leagueName: 'La Liga',
        leagueCountry: 'Spain',
        leagueFlag: '',
        kickoffDate: '2026-10-21',
        kickoffTime: '21:00',
        kickoffTimestamp: Date.now(),
        status: 'UPCOMING' as const,
        probabilities: { homeWin: 40, draw: 30, awayWin: 30 },
        odds: { home: 2.3, draw: 3.3, away: 2.9 },
      };

      const raw = [matchFromFootballData, matchFromApiSports] as unknown as Match[];
      const seen = new Set<string>();
      const combined = raw.filter((m) => {
        const normHome = normalizeTeamName(m.homeTeam.name);
        const normAway = normalizeTeamName(m.awayTeam.name);
        const key = `${m.kickoffDate}_${normHome}_${normAway}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Valódi duplikáció esetén csak 1 meccs marad meg
      expect(combined.length).toBe(1);
      expect(combined[0].id).toBe('fd-10');
    });
  });
});
