import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MatchCompactList } from '../grid/MatchCompactList';
import { GRID_METRICS } from '../grid/types';
import { Match } from '../../types/football';

describe('MatchCompactList Layout & No-Overlap Invariant Regression Tests', () => {
  const dummyMatch: Match = {
    id: 'test-match-1',
    leagueId: 'premier_league',
    leagueName: 'Premier League',
    leagueCountry: 'Anglia',
    leagueFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    homeTeam: {
      id: 'arsenal',
      name: 'Arsenal FC',
      shortName: 'ARS',
      logo: 'https://media.api-sports.io/football/teams/42.png',
      form: ['W', 'W', 'D', 'W', 'L'],
      xgAvg: 2.15,
    },
    awayTeam: {
      id: 'chelsea',
      name: 'Chelsea FC',
      shortName: 'CHE',
      logo: 'https://media.api-sports.io/football/teams/49.png',
      form: ['D', 'W', 'W', 'L', 'W'],
      xgAvg: 1.65,
    },
    status: 'UPCOMING',
    kickoffTime: '21:00',
    kickoffDate: '2026-10-21',
    homeScore: undefined,
    awayScore: undefined,
    probabilities: {
      homeWin: 52,
      draw: 24,
      awayWin: 24,
      bttsYes: 58,
      over15: 78,
      over25: 54,
      over35: 32,
      fhOver05: 68,
    },
    odds: {
      home: 2.1,
      draw: 3.4,
      away: 3.2,
      bttsYes: 1.8,
      over25: 1.85,
      under25: 2.0,
    },
  };

  it('renders both Home and Away teams in separate stacked lines ensuring the percentage diagram cannot overlap the away team', () => {
    const html = renderToString(
      <MatchCompactList
        matches={[dummyMatch]}
        onSelectMatch={() => {}}
        onCellBet={() => {}}
        betSlipItems={[]}
        metric1={GRID_METRICS[0]}
        metric2={GRID_METRICS[4]}
      />
    );

    // Both team names are present in the output
    expect(html).toContain('Arsenal FC');
    expect(html).toContain('Chelsea FC');

    // Telefonon az idő/állapot sora fölül, a csapatnevek alatta, teljes szélességben (nem préselődnek 1-2 betűre)
    expect(html).toContain('flex flex-col items-start sm:flex-row sm:items-center');
    expect(html).toContain('min-w-0 w-full sm:w-auto sm:flex-1');

    // 3D percentage pills are rendered
    expect(html).toContain('btn-pill-3d');
    expect(html).toContain('from-brand-600');
    expect(html).toContain('from-amber-600');

    // The away team is rendered after the home team in independent row containers
    const homeIndex = html.indexOf('Arsenal FC');
    const awayIndex = html.indexOf('Chelsea FC');
    const pillIndex = html.indexOf('btn-pill-3d');

    expect(homeIndex).toBeGreaterThan(-1);
    expect(awayIndex).toBeGreaterThan(homeIndex);
    expect(pillIndex).toBeGreaterThan(awayIndex);
  });

  it('renders FT badge and actual scores for finished matches without breaking layout', () => {
    const finishedMatch: Match = {
      ...dummyMatch,
      id: 'test-finished-1',
      status: 'FINISHED',
      homeScore: 3,
      awayScore: 1,
    };

    const html = renderToString(
      <MatchCompactList
        matches={[finishedMatch]}
        onSelectMatch={() => {}}
        onCellBet={() => {}}
        betSlipItems={[]}
        metric1={GRID_METRICS[0]}
        metric2={GRID_METRICS[4]}
      />
    );

    expect(html).toContain('FT');
    expect(html).toContain('>3<');
    expect(html).toContain('>1<');
  });

  it('renders live badge and minute for live matches', () => {
    const liveMatch: Match = {
      ...dummyMatch,
      id: 'test-live-1',
      status: 'LIVE',
      minute: 68,
      homeScore: 2,
      awayScore: 2,
    };

    const html = renderToString(
      <MatchCompactList
        matches={[liveMatch]}
        onSelectMatch={() => {}}
        onCellBet={() => {}}
        betSlipItems={[]}
        metric1={GRID_METRICS[0]}
        metric2={GRID_METRICS[4]}
      />
    );

    expect(html).toContain("68&#x27;");
  });

  it('renders ÉLŐ badge when match is live and minute is not specified', () => {
    const liveMatch: Match = {
      ...dummyMatch,
      id: 'test-live-2',
      status: 'LIVE',
      minute: undefined,
      homeScore: 0,
      awayScore: 0,
    };

    const html = renderToString(
      <MatchCompactList
        matches={[liveMatch]}
        onSelectMatch={() => {}}
        onCellBet={() => {}}
        betSlipItems={[]}
        metric1={GRID_METRICS[0]}
        metric2={GRID_METRICS[4]}
      />
    );

    expect(html).toContain('ÉLŐ');
  });
});
