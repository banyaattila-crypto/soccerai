import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MatchExplanationCard } from '../MatchExplanationCard';
import { MatchDetailModal } from '../MatchDetailModal';
import { Match } from '../../types/football';

describe('MatchExplanationCard & MatchDetailModal Regression Tests', () => {
  const dummyMatch: Match = {
    id: 'test-match-explanation',
    leagueId: 'premier_league',
    leagueName: 'Premier League',
    leagueCountry: 'Anglia',
    leagueFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    homeTeam: {
      id: 'liverpool',
      name: 'Liverpool',
      shortName: 'LIV',
      logo: 'https://example.com/liv.png',
      rank: 1,
      form: ['W', 'W', 'W', 'D', 'W'],
      xgAvg: 2.4,
    },
    awayTeam: {
      id: 'everton',
      name: 'Everton',
      shortName: 'EVE',
      logo: 'https://example.com/eve.png',
      rank: 16,
      form: ['L', 'D', 'L', 'W', 'L'],
      xgAvg: 1.0,
    },
    status: 'UPCOMING',
    kickoffTime: '16:00',
    kickoffDate: '2026-10-25',
    probabilities: {
      homeWin: 72,
      draw: 18,
      awayWin: 10,
      bttsYes: 48,
      over15: 85,
      over25: 65,
      over35: 40,
      fhOver05: 75,
    },
    odds: {
      home: 1.35,
      draw: 5.5,
      away: 9.0,
      bttsYes: 1.9,
      over25: 1.6,
    },
    aiPick: {
      market: '1',
      marketLabel: 'Liverpool Győzelem (1)',
      probability: 72,
      odds: 1.35,
      confidence: 9,
      expectedValue: 12.0,
      reasoning: 'Piacfüggő teszt: ROBUSZTUS stabilitás.',
    },
    quantAnalysis: {
      dataQuality: 'A',
      robustnessVerdict: 'ROBUSZTUS',
      minEdge: 4.0,
      medianEdge: 7.5,
      posPct: 98,
      quarterKellyPct: 4.5,
      shinMargin: 4.2,
      keyFactors: [],
      riskLevel: 'Alacsony',
    },
  };

  it('renders MatchExplanationCard with all analytical components in Hungarian', () => {
    const html = renderToString(
      <MatchExplanationCard match={dummyMatch} realOddsActive={false} />
    );

    // Fejléc és címke
    expect(html).toContain('Szakértői Elemzés &amp; Meccs Magyarázat');
    expect(html).toContain('Bizalom:');
    expect(html).toContain('9');
    expect(html).toContain('/10');
    expect(html).toContain('Alacsony kockázat');

    // Csapatnevek és narratíva
    expect(html).toContain('Liverpool');
    expect(html).toContain('Everton');
    expect(html).toContain('Csapatdinamika, Helyezés &amp; Múltbéli Mérleg');
    expect(html).toContain('Gólvárás &amp; Taktikai Játékstílus');
    expect(html).toContain('Miért ezt a tippet választotta az algoritmus?');

    // Kiemelt ajánlás és piac
    expect(html).toContain('Liverpool Győzelem (1)');
    expect(html).toContain('1.35');

    // Kvantitatív lenyitható gomb
    expect(html).toContain('Matematikai λ-rács és diagnosztikai napló');
  });

  it('renders MatchDetailModal integrating MatchExplanationCard seamlessly', () => {
    const html = renderToString(
      <MatchDetailModal
        match={dummyMatch}
        onClose={() => {}}
        onAddToBetSlip={() => {}}
        betSlipItems={[]}
      />
    );

    // Modal tartalomban azonnal megjelenik a meccs magyarázat
    expect(html).toContain('Szakértői Elemzés &amp; Meccs Magyarázat');
    expect(html).toContain('Liverpool Győzelem (1)');
    expect(html).toContain('Áttekintés &amp; Oddsok');
    expect(html).toContain('Poisson Mátrix');
  });
});
