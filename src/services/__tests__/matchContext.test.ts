import { describe, it, expect } from 'vitest';
import type { Match } from '../../types/football';
import {
  parseInjuries,
  parseLineups,
  countConfirmedAbsent,
  selectContextTargets,
  INJURIES_TTL_MS,
  type MatchContext,
} from '../matchContext';

const injuries = {
  response: [
    { player: { name: 'A. Játékos', type: 'Missing Fixture', reason: 'Knee Injury' }, team: { name: 'Arsenal' } },
    { player: { name: 'B. Játékos', type: 'Questionable', reason: 'Doubtful' }, team: { name: 'Arsenal' } },
    { player: { name: 'B. Játékos', type: 'Questionable' }, team: { name: 'Arsenal' } },
    { player: { name: 'C. Játékos', type: 'Missing Fixture' }, team: { name: 'Everton' } },
    { player: { name: 'D. Idegen', type: 'Missing Fixture' }, team: { name: 'Fulham' } },
    { player: { type: 'Missing Fixture' }, team: { name: 'Arsenal' } },
  ],
};

describe('meccs-kontextus feldolgozás', () => {
  it('a hiányzókat hazai és vendég szerint osztja szét, a duplikátumot és az idegen csapatot eldobja', () => {
    const r = parseInjuries(injuries, 'Arsenal FC', 'Everton FC');
    expect(r.home.map((p) => p.name)).toEqual(['A. Játékos', 'B. Játékos']);
    expect(r.away.map((p) => p.name)).toEqual(['C. Játékos']);
    expect(countConfirmedAbsent(r.home)).toBe(1);
  });

  it('hibás vagy üres válaszra üres eredményt ad', () => {
    expect(parseInjuries(null, 'A', 'B')).toEqual({ home: [], away: [] });
    expect(parseInjuries({ response: 'x' }, 'A', 'B')).toEqual({ home: [], away: [] });
    expect(parseLineups({}, 'A', 'B')).toEqual({});
  });

  it('csak a teljes (11 fős) kezdőcsapat számít megerősített felállásnak', () => {
    const xi = (n: number) => Array.from({ length: n }, (_, i) => ({ player: { id: i } }));
    const json = {
      response: [
        { team: { name: 'Arsenal' }, formation: '4-3-3', startXI: xi(11) },
        { team: { name: 'Everton' }, formation: '4-4-2', startXI: xi(7) },
      ],
    };
    expect(parseLineups(json, 'Arsenal FC', 'Everton FC')).toEqual({ home: '4-3-3' });
  });
});

describe('meccs-kontextus ütemezés', () => {
  const NOW = Date.parse('2026-10-24T10:00:00Z');
  const m = (id: string, kickoffIso: string): Match =>
    ({ id, status: 'UPCOMING', aiPick: { market: '1' }, utcDate: kickoffIso, kickoffDate: kickoffIso.slice(0, 10), kickoffTime: '00:00' }) as unknown as Match;
  const deps = (cached: Record<number, MatchContext>) => ({
    fixtureId: (x: Match) => Number(x.id),
    cached: (id: number) => cached[id] ?? null,
    isProtocol: () => true,
  });

  it('a hiányzókat 24 órával, a felállást 75 perccel a kezdés előtt kéri', () => {
    const t = selectContextTargets(
      [m('1', '2026-10-24T20:00:00Z'), m('2', '2026-10-24T11:00:00Z'), m('3', '2026-10-26T20:00:00Z')],
      NOW,
      deps({})
    );
    expect(t.map((x) => x.fixtureId)).toEqual([2, 1]);
    expect(t.find((x) => x.fixtureId === 2)?.needLineups).toBe(true);
    expect(t.find((x) => x.fixtureId === 1)?.needLineups).toBe(false);
  });

  it('friss gyorsítótár esetén nem kér újat, lejárt esetén igen', () => {
    const fresh: MatchContext = { fetchedAt: NOW, injuriesAt: NOW - 1000, homeAbsent: [], awayAbsent: [] };
    expect(selectContextTargets([m('1', '2026-10-24T20:00:00Z')], NOW, deps({ 1: fresh }))).toHaveLength(0);
    const stale: MatchContext = { ...fresh, injuriesAt: NOW - INJURIES_TTL_MS - 1 };
    expect(selectContextTargets([m('1', '2026-10-24T20:00:00Z')], NOW, deps({ 1: stale }))).toHaveLength(1);
  });

  it('nem protokoll-tipphez nem kér', () => {
    const t = selectContextTargets([m('1', '2026-10-24T20:00:00Z')], NOW, { ...deps({}), isProtocol: () => false });
    expect(t).toHaveLength(0);
  });
});
