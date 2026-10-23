import { describe, it, expect } from 'vitest';
import {
  TRACKER_CONFIG,
  applySnapshot,
  bestOdds,
  closeWindowIndex,
  consumeBudget,
  budgetUsed,
  emptyState,
  fairProbPct,
  finalizeFixtures,
  findCandidate,
  fixtureClv,
  mapStatus,
  mergeFixtures,
  needsCloseSnapshot,
  needsEarlySnapshot,
  outcomeWon,
  planCloseSnapshots,
  planEarlySnapshots,
  planFixtureRefreshes,
  renderSummaryMarkdown,
  summarize,
  utcDateStr,
  type OddsRow,
  type Snapshot,
  type TrackedFixture,
} from '../trackerCore';

const NOW = Date.parse('2026-10-23T10:00:00Z');
const MIN = 60 * 1000;
const HOUR = 60 * MIN;

// Pinnacle: 1X2 = 2.00 / 3.60 / 4.00 (árrés kb. 2,8%), O/U 2.5 = 1.95 / 1.95
const PIN: OddsRow = [2.0, 3.6, 4.0, 1.95, 1.95];
const soft = (h: number): OddsRow => [h, 3.5, 3.9, 1.9, 1.9];

const books = (extra: Record<string, OddsRow> = {}): Record<string, OddsRow> => ({
  Pinnacle: PIN,
  Bet365: [1.97, 3.5, 3.9, 1.9, 1.95],
  Unibet: [1.95, 3.5, 3.8, 1.9, 1.9],
  '1xBet': [1.98, 3.55, 3.95, 1.92, 1.92],
  ...extra,
});

const snap = (ts: number, kind: 'early' | 'close', b = books()): Snapshot => ({ ts, kind, books: b });

const fixture = (id: number, kickInMs: number, over: Partial<TrackedFixture> = {}): TrackedFixture => ({
  id,
  leagueId: 39,
  league: 'Premier League',
  home: 'Hazai',
  away: 'Vendég',
  kickoffTs: NOW + kickInMs,
  status: 'scheduled',
  snapshots: [],
  ...over,
});

describe('fair ár és legjobb szorzó', () => {
  it('Pinnacle jelenlétében a Pinnacle de-vigelt ára a fair, a három kimenetel összege 100%', () => {
    const b = books();
    const sum = (['1', 'X', '2'] as const).reduce((a, m) => a + fairProbPct(b, m)!, 0);
    expect(sum).toBeCloseTo(100, 4);
    const home = fairProbPct(b, '1')!;
    expect(home).toBeGreaterThan(47);
    expect(home).toBeLessThan(51);
  });

  it('Pinnacle nélkül legalább 4 bukméker kell az átlagoláshoz', () => {
    const three = { A: soft(2.0), B: soft(2.0), C: soft(2.0) };
    expect(fairProbPct(three, '1')).toBeNull();
    const four = { ...three, D: soft(2.0) };
    expect(fairProbPct(four, '1')).not.toBeNull();
  });

  it('az Over/Under fair ára és a legjobb szorzó bukméker-névvel', () => {
    const b = books({ Soft: [2.2, 3.5, 3.9, 2.05, 1.9] });
    expect(fairProbPct(b, 'OVER_25')! + fairProbPct(b, 'UNDER_25')!).toBeCloseTo(100, 4);
    expect(bestOdds(b, '1')).toEqual({ odds: 2.2, bookmaker: 'Soft' });
    expect(bestOdds(b, 'OVER_25')).toEqual({ odds: 2.05, bookmaker: 'Soft' });
  });
});

describe('findCandidate', () => {
  it('nincs jelölt, ha minden szorzó a konszenzus alatt vagy körül van', () => {
    expect(findCandidate(snap(NOW, 'early'))).toBeNull();
  });

  it('a legnagyobb ár-előnyű kimenetelt jelöli, a bukméker nevével és a fair árral', () => {
    const c = findCandidate(snap(NOW, 'early', books({ Soft: [2.3, 3.5, 3.9, 1.9, 1.9] })))!;
    expect(c.market).toBe('1');
    expect(c.bookmaker).toBe('Soft');
    expect(c.odds).toBe(2.3);
    expect(c.edgePct).toBeGreaterThan(10);
    expect(c.fairProb).toBeGreaterThan(47);
    expect(c.takenAt).toBe(NOW);
  });

  it('a gyanúsan nagy (> 20%) előnyt elveti, és a Pinnacle saját árát sosem jelöli', () => {
    expect(findCandidate(snap(NOW, 'early', books({ Wrong: [3.5, 3.5, 3.9, 1.9, 1.9] })))).toBeNull();
    const onlyPin = findCandidate(snap(NOW, 'early', books({ Pinnacle: [2.3, 3.6, 4.0, 1.95, 1.95] })));
    expect(onlyPin?.bookmaker).not.toBe('Pinnacle');
  });

  it('küszöb alatti (< 2%) előny nem jelölt', () => {
    expect(findCandidate(snap(NOW, 'early', books({ Soft: [2.04, 3.5, 3.9, 1.9, 1.9] })))).toBeNull();
  });
});

describe('ütemezés', () => {
  it('záró ablakok: [−100, −50] és [−35, −8] perc, azon kívül nincs', () => {
    const k = NOW + 200 * MIN;
    expect(closeWindowIndex(k, k - 120 * MIN)).toBe(-1);
    expect(closeWindowIndex(k, k - 100 * MIN)).toBe(0);
    expect(closeWindowIndex(k, k - 60 * MIN)).toBe(0);
    expect(closeWindowIndex(k, k - 45 * MIN)).toBe(-1);
    expect(closeWindowIndex(k, k - 30 * MIN)).toBe(1);
    expect(closeWindowIndex(k, k - 5 * MIN)).toBe(-1);
  });

  it('záró pillanatkép csak a jelöltnek, ablakonként egyszer', () => {
    const f = fixture(1, 70 * MIN, { candidate: findCandidate(snap(NOW - 5 * HOUR, 'early', books({ S: soft(2.3) })))! });
    expect(needsCloseSnapshot(f, NOW)).toBe(true);
    f.snapshots.push(snap(NOW, 'close'));
    expect(needsCloseSnapshot(f, NOW + 5 * MIN)).toBe(false); // ugyanaz az ablak
    expect(needsCloseSnapshot(f, NOW + 40 * MIN)).toBe(true); // a második ablak (kezdés − 30)
    expect(needsCloseSnapshot(fixture(2, 70 * MIN), NOW)).toBe(false); // nincs jelölt
  });

  it('korai pillanatkép: 45 perc és 30 óra közötti kezdés, még nincs pillanatkép', () => {
    expect(needsEarlySnapshot(fixture(1, 5 * HOUR), NOW)).toBe(true);
    expect(needsEarlySnapshot(fixture(1, 20 * MIN), NOW)).toBe(false);
    expect(needsEarlySnapshot(fixture(1, 40 * HOUR), NOW)).toBe(false);
    expect(needsEarlySnapshot(fixture(1, 5 * HOUR, { snapshots: [snap(NOW, 'early')] }), NOW)).toBe(false);
    expect(needsEarlySnapshot(fixture(1, 5 * HOUR, { oddsMissing: 2 }), NOW)).toBe(false);
    expect(needsEarlySnapshot(fixture(1, 5 * HOUR, { status: 'live' }), NOW)).toBe(false);
  });

  it('a tervek a kezdés szerint rendezettek és korlátozottak', () => {
    const s = emptyState(NOW);
    for (let i = 0; i < 12; i++) s.fixtures[String(i)] = fixture(i, (3 + i) * HOUR);
    const early = planEarlySnapshots(s, NOW);
    expect(early).toHaveLength(TRACKER_CONFIG.EARLY_PER_RUN);
    expect(early[0]).toBe(0);
    expect(planCloseSnapshots(s, NOW)).toEqual([]);
  });

  it('meccslista-frissítés: mai és holnapi nap, kor szerint; elszámolásra váró napok is', () => {
    const s = emptyState(NOW);
    expect(planFixtureRefreshes(s, NOW)).toEqual(['2026-10-23', '2026-10-24']);
    s.fixtureRefresh['2026-10-23'] = NOW - HOUR; // friss
    s.fixtureRefresh['2026-10-24'] = NOW - 9 * HOUR; // régi
    expect(planFixtureRefreshes(s, NOW)).toEqual(['2026-10-24']);
    // tegnapi jelölt, eredmény nélkül
    s.fixtures['9'] = fixture(9, -30 * HOUR, {
      candidate: { market: '1', odds: 2.2, bookmaker: 'S', fairProb: 47, edgePct: 3, takenAt: NOW - 40 * HOUR },
    });
    expect(planFixtureRefreshes(s, NOW)).toContain('2026-10-22');
    s.fixtureRefresh['2026-10-22'] = NOW - 30 * MIN;
    expect(planFixtureRefreshes(s, NOW)).not.toContain('2026-10-22');
  });

  it('a napi keret új UTC napon nullázódik', () => {
    const s = emptyState(NOW);
    consumeBudget(s, NOW, 3);
    expect(budgetUsed(s, NOW)).toBe(3);
    expect(budgetUsed(s, NOW + 24 * HOUR)).toBe(0);
    consumeBudget(s, NOW + 24 * HOUR);
    expect(s.budget).toEqual({ date: utcDateStr(NOW + 24 * HOUR), used: 1 });
  });
});

describe('állapotkezelés', () => {
  it('mergeFixtures: csak a követett ligák, a halasztás és az eredmény frissül', () => {
    const s = emptyState(NOW);
    const leagues = new Set([39]);
    const base = { home: 'A', away: 'B', league: 'PL', kickoffTs: NOW + 5 * HOUR, statusShort: 'NS' };
    const r1 = mergeFixtures(s, [{ id: 1, leagueId: 39, ...base }, { id: 2, leagueId: 999, ...base }], leagues);
    expect(r1.added).toBe(1);
    expect(Object.keys(s.fixtures)).toEqual(['1']);
    mergeFixtures(s, [{ id: 1, leagueId: 39, ...base, kickoffTs: NOW + 8 * HOUR }], leagues);
    expect(s.fixtures['1'].kickoffTs).toBe(NOW + 8 * HOUR);
    mergeFixtures(s, [{ id: 1, leagueId: 39, ...base, statusShort: 'FT', score: { home: 2, away: 1 } }], leagues);
    expect(s.fixtures['1'].status).toBe('finished');
    expect(s.fixtures['1'].result).toEqual({ home: 2, away: 1 });
  });

  it('mapStatus', () => {
    expect(mapStatus('NS')).toBe('scheduled');
    expect(mapStatus('2H')).toBe('live');
    expect(mapStatus('AET')).toBe('finished');
    expect(mapStatus('PST')).toBe('void');
  });

  it('applySnapshot: a jelölt write-once, és csak elég korai pillanatképből készül', () => {
    const f = fixture(1, 5 * HOUR);
    applySnapshot(f, snap(NOW, 'early', books({ S: soft(2.3) })));
    expect(f.candidate?.odds).toBe(2.3);
    const first = f.candidate;
    applySnapshot(f, snap(NOW + HOUR, 'early', books({ S: soft(2.5) })));
    expect(f.candidate).toBe(first);

    const late = fixture(2, 30 * MIN); // a kezdés előtt 30 perccel már nincs értelme jelölni
    applySnapshot(late, snap(NOW, 'early', books({ S: soft(2.3) })));
    expect(late.candidate).toBeUndefined();
  });

  it('outcomeWon minden piacra (az Over 2.5 legalább 3 gól)', () => {
    expect(outcomeWon('1', { home: 2, away: 1 })).toBe(true);
    expect(outcomeWon('X', { home: 1, away: 1 })).toBe(true);
    expect(outcomeWon('2', { home: 1, away: 1 })).toBe(false);
    expect(outcomeWon('OVER_25', { home: 2, away: 1 })).toBe(true);
    expect(outcomeWon('OVER_25', { home: 1, away: 1 })).toBe(false);
    expect(outcomeWon('UNDER_25', { home: 1, away: 1 })).toBe(true);
  });
});

describe('CLV és lezárás', () => {
  const candidateFixture = () => {
    const f = fixture(1, 5 * HOUR);
    applySnapshot(f, snap(NOW, 'early', books({ S: soft(2.3) })));
    return f;
  };

  it('a CLV az utolsó érvényes záró pillanatképből számolódik; a korai (15 percen belüli) nem érvényes', () => {
    const f = candidateFixture();
    const c = f.candidate!;
    // a záró ár ugyanaz mint a jelöléskor -> CLV = ár-előny, mozgás 0
    f.snapshots.push(snap(f.kickoffTs - 30 * MIN, 'close', books({ S: soft(2.3) })));
    const clv = fixtureClv(f)!;
    expect(clv.driftPct).toBeCloseTo(0, 1); // a fair ár tárolt értéke két tizedesre kerekített
    expect(clv.clvPct).toBeCloseTo(c.edgePct, 1);
    // túl közeli a jelöléshez
    const g = fixture(2, 5 * HOUR);
    applySnapshot(g, snap(g.kickoffTs - 50 * MIN, 'early', books({ S: soft(2.3) })));
    g.snapshots.push(snap(g.kickoffTs - 40 * MIN, 'close', books()));
    expect(fixtureClv(g)).toBeNull();
  });

  it('ha a piac a jelölt irányába mozdul (a Pinnacle ára rövidül), a CLV nő', () => {
    const f = candidateFixture();
    const closeBooks = books({ S: soft(2.3), Pinnacle: [1.85, 3.8, 4.4, 1.95, 1.95] });
    f.snapshots.push(snap(f.kickoffTs - 30 * MIN, 'close', closeBooks));
    const clv = fixtureClv(f)!;
    expect(clv.driftPct).toBeGreaterThan(3);
    expect(clv.clvPct).toBeGreaterThan(f.candidate!.edgePct);
  });

  it('finalizeFixtures: a lezárt jelölt rekordba kerül (nyert/vesztett, egységtét), a jelölt nélküli törlődik', () => {
    const s = emptyState(NOW);
    const won = candidateFixture();
    won.status = 'finished';
    won.result = { home: 2, away: 0 };
    won.snapshots.push(snap(won.kickoffTs - 30 * MIN, 'close', books({ S: soft(2.3) })));
    const lost = candidateFixture();
    lost.id = 2;
    lost.status = 'finished';
    lost.result = { home: 0, away: 1 };
    const none = fixture(3, 5 * HOUR, { status: 'finished', result: { home: 1, away: 1 } });
    const open = fixture(4, 5 * HOUR);
    s.fixtures = { '1': won, '2': lost, '3': none, '4': open };
    const settled = finalizeFixtures(s, NOW + 8 * HOUR);
    expect(settled.map((x) => x.id).sort()).toEqual([1, 2]);
    expect(settled.find((x) => x.id === 1)!.profitUnits).toBeCloseTo(1.3, 6);
    expect(settled.find((x) => x.id === 1)!.clv).not.toBeNull();
    expect(settled.find((x) => x.id === 2)!.profitUnits).toBe(-1);
    expect(Object.keys(s.fixtures)).toEqual(['4']);
  });

  it('halasztott (void) jelölt érvénytelen: nincs nyert/vesztett és egységtét', () => {
    const s = emptyState(NOW);
    const f = candidateFixture();
    f.status = 'void';
    s.fixtures = { '1': f };
    const [rec] = finalizeFixtures(s, NOW + HOUR);
    expect(rec.won).toBeNull();
    expect(rec.profitUnits).toBeNull();
  });
});

describe('összegzés', () => {
  it('üres állapotban no_data, a markdown ezt mondja', () => {
    const s = emptyState(NOW);
    const sum = summarize(s, [], NOW);
    expect(sum.clv.verdict).toBe('no_data');
    expect(sum.roi.n).toBe(0);
    expect(renderSummaryMarkdown(sum)).toContain('Még nincs mérhető jelölt');
  });

  it('a lezárt és az aktív, záró pillanatképes jelöltek CLV-je együtt számít, a bukmékerenkénti megoszlás is', () => {
    const s = emptyState(NOW);
    const f = fixture(1, 5 * HOUR);
    applySnapshot(f, snap(NOW, 'early', books({ Soft: soft(2.3) })));
    f.snapshots.push(snap(f.kickoffTs - 30 * MIN, 'close', books({ Soft: soft(2.3) })));
    s.fixtures = { '1': f };
    const sum = summarize(s, [], NOW);
    expect(sum.activeCandidates).toBe(1);
    expect(sum.clv.n).toBe(1);
    expect(sum.byBookmaker).toEqual([{ bookmaker: 'Soft', n: 1 }]);
    const md = renderSummaryMarkdown(sum);
    expect(md).toContain('Kevés minta');
    expect(md).toContain('Soft: 1');
  });
});
