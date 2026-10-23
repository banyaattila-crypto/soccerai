import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ResultsView } from '../ResultsView';
import { STORAGE_KEY_AUDIT_LOG } from '../../services/predictionAuditService';
import type { Match } from '../../types/football';

const store: Record<string, string> = {};
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
  },
  configurable: true,
  writable: true,
});

const record = (id: string, home: string, away: string, over: Record<string, unknown>) => ({
  id: `audit-${id}`,
  matchId: id,
  loggedAt: '2026-10-20T10:00:00.000Z',
  kickoffDate: '2026-10-20',
  kickoffTime: '20:00',
  kickoffTimestamp: Date.parse('2026-10-20T20:00:00'),
  leagueId: 'pl',
  leagueName: 'Premier League',
  homeTeam: { name: home },
  awayTeam: { name: away },
  pick: { market: '1', marketLabel: `${home} győzelem (1)`, probability: 55, odds: 1.9, expectedValue: 0, isSimulatedOdds: true },
  provenance: 'VERIFIED_PRE_MATCH',
  auditHash: 'audit-0000',
  settled: false,
  status: 'PENDING',
  profit: 0,
  roi: 0,
  ...over,
});

const finishedMatch = (id: string, home: string, away: string, scores: Partial<Match>): Match =>
  ({
    id,
    leagueId: 'pl',
    leagueName: 'Premier League',
    leagueCountry: 'Anglia',
    leagueFlag: 'x',
    homeTeam: { id: `${id}h`, name: home, shortName: 'H', logo: '', form: [], xgAvg: 1.4 },
    awayTeam: { id: `${id}a`, name: away, shortName: 'A', logo: '', form: [], xgAvg: 1.2 },
    status: 'FINISHED',
    kickoffDate: '2026-10-19',
    kickoffTime: '18:00',
    probabilities: { homeWin: 50, draw: 25, awayWin: 25, bttsYes: 50, over15: 75, over25: 52, over35: 30, fhOver05: 66 },
    odds: { home: 2, draw: 3.4, away: 3.6, bttsYes: 1.8, over25: 1.85, under25: 2 },
    ...scores,
  }) as unknown as Match;

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
});

describe('Eredmények: csak lejátszott, eredménnyel rendelkező mérkőzés', () => {
  it('a kezdésre váró (lezáratlan) auditált tipp és az eredmény nélküli "lefújt" meccs nem jelenik meg', () => {
    store[STORAGE_KEY_AUDIT_LOG] = JSON.stringify([
      record('p1', 'Lejátszott FC', 'Eredményes SE', { settled: true, status: 'WON', homeScore: 2, awayScore: 1, profit: 9000, roi: 90 }),
      record('p2', 'Jövőbeli FC', 'Függő SE', { settled: false }),
      record('p3', 'Pontszám Nélküli FC', 'Hiányos SE', { settled: true, status: 'LOST' }),
    ]);
    const html = renderToString(
      <ResultsView
        matches={[
          finishedMatch('f1', 'Archív Város', 'Kész Utd', { homeScore: 0, awayScore: 0 }),
          finishedMatch('f2', 'Eredmény Nélküli', 'Meccs Town', {}),
        ]}
        onSelectMatch={() => {}}
      />
    );
    expect(html).toContain('Lejátszott FC');
    expect(html).toContain('Archív Város');
    expect(html).not.toContain('Jövőbeli FC');
    expect(html).not.toContain('Pontszám Nélküli FC');
    expect(html).not.toContain('Eredmény Nélküli');
    // nincs "kezdésre vár" állapot sem szűrő, sem kártya
    expect(html).not.toContain('Kezdésre vár');
    expect(html).not.toContain('FÜGGŐBEN');
  });
});
