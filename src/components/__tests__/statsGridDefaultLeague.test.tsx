import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StatsGrid } from '../StatsGrid';
import { getRelativeDateStr } from '../../utils/dateUtils';
import type { Match } from '../../types/football';

const base = (id: string, leagueId: string, leagueName: string, home: string, away: string): Match =>
  ({
    id,
    leagueId,
    leagueName,
    leagueCountry: 'Teszt',
    leagueFlag: 'T',
    homeTeam: { id: `${id}-h`, name: home, shortName: home.slice(0, 3).toUpperCase(), logo: '', form: [], xgAvg: 1.4 },
    awayTeam: { id: `${id}-a`, name: away, shortName: away.slice(0, 3).toUpperCase(), logo: '', form: [], xgAvg: 1.2 },
    status: 'UPCOMING',
    kickoffTime: '21:00',
    kickoffDate: getRelativeDateStr(0),
    probabilities: { homeWin: 50, draw: 25, awayWin: 25, bttsYes: 52, over15: 78, over25: 54, over35: 30, fhOver05: 66 },
    odds: { home: 2.0, draw: 3.4, away: 3.6, bttsYes: 1.8, over25: 1.85, under25: 2.0 },
  }) as unknown as Match;

describe('Mérkőzés fül alapértelmezett szűrése', () => {
  it('alapból minden bajnokság meccse látszik névvel, nem csak a Premier League-é', () => {
    const matches = [
      base('m1', 'pl', 'Premier League', 'Ipswich Town', 'Nottingham'),
      base('m2', 'laliga', 'La Liga', 'Alavés', 'Málaga'),
      base('m3', 'seriea', 'Serie A', 'Torino', 'Monza'),
    ];
    const html = renderToString(
      <StatsGrid
        matches={matches}
        dayFilter="today"
        setDayFilter={() => {}}
        onSelectMatch={() => {}}
        onAddToBetSlip={() => {}}
        betSlipItems={[]}
      />
    );
    for (const name of ['Ipswich Town', 'Nottingham', 'Alavés', 'Málaga', 'Torino', 'Monza']) {
      expect(html).toContain(name);
    }
    for (const league of ['Premier League', 'La Liga', 'Serie A']) {
      expect(html).toContain(league);
    }
    // nincs aktív liga-szűrő chip
    expect(html).not.toContain('Aktív szűrők');
  });
});
