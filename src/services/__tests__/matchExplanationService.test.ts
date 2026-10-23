import { describe, it, expect } from 'vitest';
import { generateMatchExplanation } from '../matchExplanationService';
import { Match } from '../../types/football';

describe('matchExplanationService', () => {
  const createBaseMatch = (overrides?: Partial<Match>): Match => ({
    id: 'test-match-1',
    leagueId: 'PL',
    leagueName: 'Premier League',
    leagueCountry: 'Anglia',
    leagueFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    kickoffDate: '2026-10-25',
    kickoffTime: '17:30',
    status: 'UPCOMING',
    homeTeam: {
      id: 'arsenal',
      name: 'Arsenal',
      shortName: 'ARS',
      logo: 'https://example.com/ars.png',
      rank: 2,
      form: ['W', 'W', 'D', 'W', 'W'],
      xgAvg: 2.1,
    },
    awayTeam: {
      id: 'chelsea',
      name: 'Chelsea',
      shortName: 'CHE',
      logo: 'https://example.com/che.png',
      rank: 5,
      form: ['W', 'L', 'D', 'W', 'L'],
      xgAvg: 1.3,
    },
    probabilities: {
      homeWin: 58,
      draw: 24,
      awayWin: 18,
      bttsYes: 55,
      over15: 82,
      over25: 61,
      over35: 35,
      fhOver05: 72,
    },
    odds: {
      home: 1.65,
      draw: 3.8,
      away: 5.2,
      bttsYes: 1.75,
      over25: 1.8,
    },
    aiPick: {
      market: '1',
      marketLabel: 'Arsenal Győzelem (1)',
      probability: 58,
      odds: 1.65,
      confidence: 8,
      expectedValue: 8.5,
      reasoning: 'Teszt indoklás',
    },
    quantAnalysis: {
      dataQuality: 'A',
      robustnessVerdict: 'ROBUSZTUS',
      minEdge: 3.5,
      medianEdge: 6.2,
      posPct: 95,
      quarterKellyPct: 3.2,
      shinMargin: 4.8,
      keyFactors: [],
      riskLevel: 'Alacsony',
    },
    ...overrides,
  });

  it('generates a complete explanation for a home favorite match', () => {
    const match = createBaseMatch();
    const explanation = generateMatchExplanation(match);

    expect(explanation).toBeDefined();
    expect(explanation.headline).toContain('Arsenal');
    expect(explanation.summary).toContain('Arsenal');
    expect(explanation.summary).toContain('58%');
    expect(explanation.teamDynamics).toContain('Arsenal');
    expect(explanation.teamDynamics).toContain('Chelsea');
    expect(explanation.goalExpectation).toContain('várható gól');
    expect(explanation.pickRationale).toContain('hazai győzelmet');
    expect(explanation.pickRationale).toContain('1.65');
    expect(explanation.riskAssessment.level).toBe('Alacsony');
    expect(explanation.keyFactors).toHaveLength(4);
  });

  it('handles away favorite correctly with market 2', () => {
    const match = createBaseMatch({
      probabilities: {
        homeWin: 20,
        draw: 22,
        awayWin: 58,
        bttsYes: 52,
        over15: 80,
        over25: 58,
        over35: 30,
        fhOver05: 70,
      },
      aiPick: {
        market: '2',
        marketLabel: 'Chelsea Győzelem (2)',
        probability: 58,
        odds: 1.72,
        confidence: 8,
        expectedValue: 7.2,
        reasoning: 'Away pick reasoning',
      },
    });

    const explanation = generateMatchExplanation(match);
    expect(explanation.headline).toContain('Chelsea');
    expect(explanation.summary).toContain('Chelsea');
    expect(explanation.pickRationale).toContain('vendéggyőzelem');
    expect(explanation.pickRationale).toContain('Chelsea');
  });

  it('handles balanced derby with market X', () => {
    const match = createBaseMatch({
      probabilities: {
        homeWin: 34,
        draw: 36,
        awayWin: 30,
        bttsYes: 48,
        over15: 70,
        over25: 44,
        over35: 22,
        fhOver05: 60,
      },
      aiPick: {
        market: 'X',
        marketLabel: 'Döntetlen (X)',
        probability: 36,
        odds: 3.3,
        confidence: 6,
        expectedValue: 5.5,
        reasoning: 'Draw reasoning',
      },
      quantAnalysis: {
        dataQuality: 'B',
        robustnessVerdict: 'valószínű',
        minEdge: 1.5,
        medianEdge: 3.2,
        posPct: 80,
        quarterKellyPct: 1.5,
        shinMargin: 5.2,
        keyFactors: [],
        riskLevel: 'Közepes',
      },
    });

    const explanation = generateMatchExplanation(match);
    expect(explanation.headline).toContain('rangadó');
    expect(explanation.summary).toContain('szoros');
    expect(explanation.pickRationale).toContain('döntetlen');
    expect(explanation.riskAssessment.level).toBe('Közepes');
  });

  it('handles goal markets: BTTS, OVER_25, UNDER_25, BTTS_AND_OVER25', () => {
    // BTTS
    const bttsMatch = createBaseMatch({
      aiPick: {
        market: 'BTTS',
        marketLabel: 'Mindkét Csapat Lő (BTTS)',
        probability: 64,
        odds: 1.7,
        confidence: 8,
        expectedValue: 6.0,
        reasoning: 'BTTS reasoning',
      },
    });
    const expBtts = generateMatchExplanation(bttsMatch);
    expect(expBtts.pickRationale).toContain('Mindkét csapat szerez gólt');

    // OVER_25
    const overMatch = createBaseMatch({
      aiPick: {
        market: 'OVER_25',
        marketLabel: '2.5 Gól Felett',
        probability: 62,
        odds: 1.85,
        confidence: 7,
        expectedValue: 5.8,
        reasoning: 'Over reasoning',
      },
    });
    const expOver = generateMatchExplanation(overMatch);
    expect(expOver.pickRationale).toContain('2.5 gól feletti');

    // UNDER_25
    const underMatch = createBaseMatch({
      homeTeam: {
        id: '1',
        name: 'Everton',
        shortName: 'EVE',
        logo: '',
        xgAvg: 0.9,
      },
      awayTeam: {
        id: '2',
        name: 'Wolves',
        shortName: 'WOL',
        logo: '',
        xgAvg: 0.8,
      },
      probabilities: {
        homeWin: 38,
        draw: 34,
        awayWin: 28,
        bttsYes: 40,
        over15: 60,
        over25: 38,
        over35: 18,
        fhOver05: 58,
      },
      aiPick: {
        market: 'UNDER_25',
        marketLabel: '2.5 Gól Alatt',
        probability: 62,
        odds: 1.8,
        confidence: 7,
        expectedValue: 6.1,
        reasoning: 'Under reasoning',
      },
    });
    const expUnder = generateMatchExplanation(underMatch);
    expect(expUnder.pickRationale).toContain('2.5 gól alatti');
    expect(expUnder.goalExpectation).toContain('visszafogott');

    // BTTS_AND_OVER25
    const bttsAndOverMatch = createBaseMatch({
      aiPick: {
        market: 'BTTS_AND_OVER25',
        marketLabel: 'BTTS & 2.5 Felett',
        probability: 52,
        odds: 2.1,
        confidence: 7,
        expectedValue: 8.0,
        reasoning: 'Combo reasoning',
      },
    });
    const expCombo = generateMatchExplanation(bttsAndOverMatch);
    expect(expCombo.pickRationale).toContain('Mindkét csapat szerez gólt és 2.5 gól felett');
  });

  it('gracefully handles missing data like empty form, missing rank, missing odds', () => {
    const minimalMatch: Match = {
      id: 'min-1',
      leagueId: 'FL1',
      leagueName: 'Ligue 1',
      leagueCountry: 'Franciaország',
      leagueFlag: '🇫🇷',
      kickoffDate: '2026-10-25',
      kickoffTime: '20:00',
      status: 'UPCOMING',
      homeTeam: {
        id: 'psg',
        name: 'PSG',
        shortName: 'PSG',
        logo: '',
      },
      awayTeam: {
        id: 'om',
        name: 'Marseille',
        shortName: 'OM',
        logo: '',
      },
      probabilities: {
        homeWin: 52,
        draw: 26,
        awayWin: 22,
        bttsYes: 54,
        over15: 78,
        over25: 56,
        over35: 32,
        fhOver05: 68,
      },
      odds: {
        home: 1.8,
        draw: 3.5,
        away: 4.2,
        bttsYes: 1.75,
        over25: 1.85,
      },
    };

    const exp = generateMatchExplanation(minimalMatch);
    expect(exp).toBeDefined();
    expect(exp.headline.length).toBeGreaterThan(0);
    expect(exp.summary.length).toBeGreaterThan(0);
    expect(exp.teamDynamics.length).toBeGreaterThan(0);
    expect(exp.goalExpectation.length).toBeGreaterThan(0);
    expect(exp.pickRationale.length).toBeGreaterThan(0);
    expect(exp.keyFactors).toHaveLength(4);
  });
  describe('piaci valószínűség (valós szorzó)', () => {
    const marketMatch = (): Match =>
      createBaseMatch({
        probabilities: { homeWin: 20, draw: 25, awayWin: 55, bttsYes: 55, over15: 82, over25: 61, over35: 35, fhOver05: 72 },
        modelProbabilities: { homeWin: 58, draw: 24, awayWin: 18, bttsYes: 55, over15: 82, over25: 61, over35: 35, fhOver05: 72 },
        probabilitySource: 'market',
      });

    it('az összefoglaló jelzi a piaci forrást és a modell eltérő becslését', () => {
      const ex = generateMatchExplanation(marketMatch());
      expect(ex.summary).toContain('piaci ár');
      expect(ex.summary).toContain('58% / 24% / 18%');
    });

    it('a tipp indoklása nem állít megalapozatlan pozitív várható értéket', () => {
      const ex = generateMatchExplanation(createBaseMatch());
      expect(ex.pickRationale).not.toMatch(/pozitív várható érték|kiemelkedő értéket|legstabilabb matematikai él/);
    });
  });
});
