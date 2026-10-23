import type { BookmakerOddsItem } from '../../types/football';
import { marketFairFromBookmakers } from '../marketBlend';
import {
  clvStatsFromSamples,
  CLOSE_WINDOW_MS,
  MIN_CLOSE_GAP_MS,
  type ClvStats,
  type RecordClv,
} from '../clvService';

/**
 * Szerveroldali szorzó-követő magja (tiszta logika, a hálózat és a fájlkezelés a trackerRunner / scripts/tracker).
 *
 * Mit mér: modell nélkül, tisztán árakból. Minden követett meccsnél korai szorzó-pillanatképet veszünk; ha a
 * legjobb bukméker szorzója a konszenzus (Pinnacle, ennek híján az átlag) de-vigelt fair árához képest legalább
 * MIN_EDGE_PCT előnyt ad, "jelöltet" rögzítünk (write-once). A jelölthöz a kezdés előtt záró pillanatképeket veszünk,
 * és a CLV-t (szorzó · záró fair − 1), majd a meccs végén az eredményt rögzítjük. Így kiderül, van-e a
 * "legjobb ár a konszenzushoz képest" stratégiának tartós, a záró árhoz mért előnye.
 */

export type TrackerMarket = '1' | 'X' | '2' | 'OVER_25' | 'UNDER_25';
export const TRACKER_MARKETS: TrackerMarket[] = ['1', 'X', '2', 'OVER_25', 'UNDER_25'];

/** home, draw, away, over25, under25 (0 = hiányzik) */
export type OddsRow = [number, number, number, number, number];

export type SnapshotKind = 'early' | 'close';

export interface Snapshot {
  ts: number;
  kind: SnapshotKind;
  books: Record<string, OddsRow>;
}

export interface Candidate {
  market: TrackerMarket;
  /** A legjobb szorzó a pillanatképben */
  odds: number;
  bookmaker: string;
  /** A kimenetel de-vigelt piaci (fair) valószínűsége a pillanatképben, % */
  fairProb: number;
  /** odds · fair − 1, % */
  edgePct: number;
  takenAt: number;
}

export type FixtureStatus = 'scheduled' | 'live' | 'finished' | 'void';

export interface TrackedFixture {
  id: number;
  leagueId: number;
  league: string;
  home: string;
  away: string;
  kickoffTs: number;
  status: FixtureStatus;
  snapshots: Snapshot[];
  candidate?: Candidate;
  result?: { home: number; away: number };
  /** Hányszor jött üres szorzó-válasz (a felesleges ismétlés elkerülésére) */
  oddsMissing?: number;
}

export interface TrackerState {
  version: 1;
  updatedAt: string;
  budget: { date: string; used: number };
  /** Fiókhiba miatti szünet vége (epoch ms); addig a követő nem hív API-t */
  haltedUntil?: number;
  /** dátum (YYYY-MM-DD, UTC) -> a meccslista utolsó lekérésének ideje (epoch ms) */
  fixtureRefresh: Record<string, number>;
  fixtures: Record<string, TrackedFixture>;
}

export const TRACKER_CONFIG = {
  /** Jelölt: legalább ekkora ár-előny a konszenzus fair árához képest, % */
  MIN_EDGE_PCT: 2,
  /** Ennél nagyobb "előny" valószínűleg elavult vagy hibás ár: nem jelölt */
  MAX_EDGE_PCT: 20,
  /** Legalább ennyi bukméker kell az átlagolt (Pinnacle nélküli) fair árhoz */
  MIN_BOOKS: 4,
  /** Korai pillanatkép: legfeljebb ennyivel a kezdés előtt */
  EARLY_HORIZON_MS: 30 * 60 * 60 * 1000,
  /** ... és legalább ennyivel a kezdés előtt (hogy legyen még záró pillanatkép) */
  EARLY_MIN_LEAD_MS: 45 * 60 * 1000,
  /** Záró pillanatkép-ablakok a kezdés előtt (perc): [kezdés − 100, kezdés − 50] és [kezdés − 35, kezdés − 8] */
  CLOSE_WINDOWS_MIN: [
    [100, 50],
    [35, 8],
  ] as [number, number][],
  /** Alap napi kérés-keret és tartalék (a keret a közös API-kulcs napi 100 kérésén belül marad) */
  DAILY_BUDGET: 50,
  RESERVE: 12,
  /** A mai és a holnapi meccslista legfeljebb ennyi időnként frissül */
  FIXTURE_REFRESH_MAX_AGE_MS: 8 * 60 * 60 * 1000,
  /** Elszámolásra váró meccsek listájának frissítése ennyi időnként */
  SETTLE_REFRESH_MAX_AGE_MS: 2 * 60 * 60 * 1000,
  /** Kezdés után ennyivel számítunk végeredményre */
  SETTLE_AFTER_MS: 135 * 60 * 1000,
  EARLY_PER_RUN: 8,
  CLOSE_PER_RUN: 8,
  /** A le nem zárható (eredmény nélküli) jelöltet ennyi idő után érvénytelenítjük */
  STALE_AFTER_MS: 4 * 24 * 60 * 60 * 1000,
} as const;

// ---------------------------------------------------------------------------
// Szorzók és fair ár
// ---------------------------------------------------------------------------

export function toBookmakerItems(books: Record<string, OddsRow>): BookmakerOddsItem[] {
  return Object.entries(books).map(([name, r]) => ({
    name,
    home: r[0] || undefined,
    draw: r[1] || undefined,
    away: r[2] || undefined,
    over25: r[3] || undefined,
    under25: r[4] || undefined,
  }));
}

const MARKET_INDEX: Record<TrackerMarket, number> = { '1': 0, X: 1, '2': 2, OVER_25: 3, UNDER_25: 4 };

/**
 * A kimenetel de-vigelt piaci valószínűsége (%) a pillanatképből: Pinnacle, ennek híján legalább MIN_BOOKS
 * bukméker átlaga. Hiányzó referenciánál null.
 */
export function fairProbPct(books: Record<string, OddsRow>, market: TrackerMarket): number | null {
  const idx = MARKET_INDEX[market];
  const quoting = Object.entries(books).filter(([, r]) =>
    market === '1' || market === 'X' || market === '2' ? r[0] && r[1] && r[2] : r[3] && r[4]
  );
  const hasPinnacle = quoting.some(([n]) => /pinnacle/i.test(n));
  if (!hasPinnacle && quoting.length < TRACKER_CONFIG.MIN_BOOKS) return null;
  const fair = marketFairFromBookmakers(toBookmakerItems(books));
  if (idx <= 2) {
    const p = fair.p1x2?.[idx];
    return p === undefined ? null : p * 100;
  }
  if (fair.pOver25 === undefined) return null;
  return (idx === 3 ? fair.pOver25 : 1 - fair.pOver25) * 100;
}

/** A legjobb szorzó és bukméker a piacra. */
export function bestOdds(books: Record<string, OddsRow>, market: TrackerMarket): { odds: number; bookmaker: string } | null {
  const idx = MARKET_INDEX[market];
  let best: { odds: number; bookmaker: string } | null = null;
  for (const [name, r] of Object.entries(books)) {
    const o = r[idx];
    if (o > 1 && (!best || o > best.odds)) best = { odds: o, bookmaker: name };
  }
  return best;
}

/** A legnagyobb ár-előnyű kimenetel a pillanatképben, ha eléri a küszöböt (és nem gyanúsan nagy). */
export function findCandidate(snapshot: Snapshot): Candidate | null {
  let top: Candidate | null = null;
  for (const market of TRACKER_MARKETS) {
    const fair = fairProbPct(snapshot.books, market);
    const best = bestOdds(snapshot.books, market);
    if (fair === null || !best || !(fair >= 5)) continue;
    if (/pinnacle/i.test(best.bookmaker)) continue; // a konszenzus saját ára nem "előny"
    const edge = (best.odds * (fair / 100) - 1) * 100;
    if (edge < TRACKER_CONFIG.MIN_EDGE_PCT || edge > TRACKER_CONFIG.MAX_EDGE_PCT) continue;
    if (!top || edge > top.edgePct) {
      top = {
        market,
        odds: best.odds,
        bookmaker: best.bookmaker,
        fairProb: Math.round(fair * 100) / 100,
        edgePct: Math.round(edge * 100) / 100,
        takenAt: snapshot.ts,
      };
    }
  }
  return top;
}

// ---------------------------------------------------------------------------
// Ütemezés
// ---------------------------------------------------------------------------

const MIN = 60 * 1000;

export function utcDateStr(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** A mai nap kerete: ha új UTC nap kezdődött, a számláló nullázódik. */
export function budgetUsed(state: TrackerState, nowMs: number): number {
  return state.budget.date === utcDateStr(nowMs) ? state.budget.used : 0;
}

export function consumeBudget(state: TrackerState, nowMs: number, n = 1): void {
  const today = utcDateStr(nowMs);
  if (state.budget.date !== today) state.budget = { date: today, used: 0 };
  state.budget.used += n;
}

export function emptyState(nowMs: number): TrackerState {
  return {
    version: 1,
    updatedAt: new Date(nowMs).toISOString(),
    budget: { date: utcDateStr(nowMs), used: 0 },
    fixtureRefresh: {},
    fixtures: {},
  };
}

/** Melyik záró ablakban vagyunk (0 vagy 1), vagy -1, ha egyikben sem. */
export function closeWindowIndex(kickoffTs: number, nowMs: number): number {
  const toKick = kickoffTs - nowMs;
  for (let i = 0; i < TRACKER_CONFIG.CLOSE_WINDOWS_MIN.length; i++) {
    const [hi, lo] = TRACKER_CONFIG.CLOSE_WINDOWS_MIN[i];
    if (toKick <= hi * MIN && toKick >= lo * MIN) return i;
  }
  return -1;
}

/** Záró pillanatképre vár-e a meccs: jelölt, még nem kezdődött, ablakban van, és abban az ablakban még nincs. */
export function needsCloseSnapshot(f: TrackedFixture, nowMs: number): boolean {
  if (!f.candidate || f.status !== 'scheduled' || (f.oddsMissing ?? 0) >= 3) return false;
  const w = closeWindowIndex(f.kickoffTs, nowMs);
  if (w < 0) return false;
  const [hi, lo] = TRACKER_CONFIG.CLOSE_WINDOWS_MIN[w];
  return !f.snapshots.some(
    (s) => s.kind === 'close' && f.kickoffTs - s.ts <= hi * MIN && f.kickoffTs - s.ts >= lo * MIN
  );
}

/** Korai pillanatképre vár-e: még nincs pillanatképe, és a kezdés a megadott sávban van. */
export function needsEarlySnapshot(f: TrackedFixture, nowMs: number): boolean {
  if (f.status !== 'scheduled' || f.snapshots.length > 0 || (f.oddsMissing ?? 0) >= 2) return false;
  const lead = f.kickoffTs - nowMs;
  return lead > TRACKER_CONFIG.EARLY_MIN_LEAD_MS && lead <= TRACKER_CONFIG.EARLY_HORIZON_MS;
}

export function planCloseSnapshots(state: TrackerState, nowMs: number, max = TRACKER_CONFIG.CLOSE_PER_RUN): number[] {
  return Object.values(state.fixtures)
    .filter((f) => needsCloseSnapshot(f, nowMs))
    .sort((a, b) => a.kickoffTs - b.kickoffTs)
    .slice(0, max)
    .map((f) => f.id);
}

export function planEarlySnapshots(state: TrackerState, nowMs: number, max = TRACKER_CONFIG.EARLY_PER_RUN): number[] {
  return Object.values(state.fixtures)
    .filter((f) => needsEarlySnapshot(f, nowMs))
    .sort((a, b) => a.kickoffTs - b.kickoffTs)
    .slice(0, max)
    .map((f) => f.id);
}

/**
 * Mely dátumok meccslistája kell: a mai és a holnapi (felfedezés), valamint azok a napok, ahol elszámolásra váró
 * jelölt van. Dátumonként egy kérés, a korábbi lekérés korától függően.
 */
export function planFixtureRefreshes(state: TrackerState, nowMs: number): string[] {
  const dates: { date: string; maxAge: number }[] = [
    { date: utcDateStr(nowMs), maxAge: TRACKER_CONFIG.FIXTURE_REFRESH_MAX_AGE_MS },
    { date: utcDateStr(nowMs + 24 * 60 * MIN), maxAge: TRACKER_CONFIG.FIXTURE_REFRESH_MAX_AGE_MS },
  ];
  for (const f of Object.values(state.fixtures)) {
    if (f.candidate && !f.result && f.status !== 'void' && nowMs >= f.kickoffTs + TRACKER_CONFIG.SETTLE_AFTER_MS) {
      dates.push({ date: utcDateStr(f.kickoffTs), maxAge: TRACKER_CONFIG.SETTLE_REFRESH_MAX_AGE_MS });
    }
  }
  const out: string[] = [];
  for (const { date, maxAge } of dates) {
    const last = state.fixtureRefresh[date];
    const age = last === undefined ? Infinity : nowMs - last;
    if (age >= maxAge && !out.includes(date)) out.push(date);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Állapotkezelés
// ---------------------------------------------------------------------------

export interface ApiFixtureLite {
  id: number;
  leagueId: number;
  league: string;
  home: string;
  away: string;
  kickoffTs: number;
  /** API-Sports státusz (NS, 1H, FT, PST, CANC ...) */
  statusShort: string;
  /** 90 perces végeredmény, ha ismert */
  score?: { home: number; away: number };
}

export function mapStatus(short: string): FixtureStatus {
  if (['FT', 'AET', 'PEN'].includes(short)) return 'finished';
  if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'].includes(short)) return 'live';
  if (['PST', 'CANC', 'ABD', 'AWD', 'WO', 'SUSP'].includes(short)) return 'void';
  return 'scheduled';
}

/** A lekért meccslista beolvasztása az állapotba (csak a követett ligák). */
export function mergeFixtures(
  state: TrackerState,
  list: ApiFixtureLite[],
  leagueIds: Set<number>
): { added: number; updated: number } {
  let added = 0;
  let updated = 0;
  for (const a of list) {
    if (!leagueIds.has(a.leagueId)) continue;
    const key = String(a.id);
    const status = mapStatus(a.statusShort);
    const existing = state.fixtures[key];
    if (!existing) {
      state.fixtures[key] = {
        id: a.id,
        leagueId: a.leagueId,
        league: a.league,
        home: a.home,
        away: a.away,
        kickoffTs: a.kickoffTs,
        status,
        snapshots: [],
        result: status === 'finished' && a.score ? a.score : undefined,
      };
      added++;
      continue;
    }
    existing.kickoffTs = a.kickoffTs; // halasztás esetén frissül
    existing.status = status;
    if (status === 'finished' && a.score) existing.result = a.score;
    updated++;
  }
  return { added, updated };
}

/** Egy pillanatkép rögzítése; korai pillanatképből write-once jelölt (ha még nincs és van előny). */
export function applySnapshot(f: TrackedFixture, snapshot: Snapshot): void {
  f.snapshots.push(snapshot);
  if (snapshot.kind === 'early' && !f.candidate && f.kickoffTs - snapshot.ts >= TRACKER_CONFIG.EARLY_MIN_LEAD_MS) {
    const c = findCandidate(snapshot);
    if (c) f.candidate = c;
  }
}

export function outcomeWon(market: TrackerMarket, result: { home: number; away: number }): boolean {
  const total = result.home + result.away;
  switch (market) {
    case '1':
      return result.home > result.away;
    case 'X':
      return result.home === result.away;
    case '2':
      return result.home < result.away;
    case 'OVER_25':
      return total >= 3;
    case 'UNDER_25':
      return total <= 2;
  }
}

/** A jelölt CLV-je az utolsó érvényes záró pillanatképből; null, ha nincs érvényes zárás. */
export function fixtureClv(f: TrackedFixture): RecordClv | null {
  const c = f.candidate;
  if (!c) return null;
  const closes = f.snapshots
    .filter(
      (s) =>
        s.kind === 'close' &&
        s.ts <= f.kickoffTs &&
        s.ts >= f.kickoffTs - CLOSE_WINDOW_MS &&
        s.ts - c.takenAt >= MIN_CLOSE_GAP_MS
    )
    .sort((a, b) => b.ts - a.ts);
  for (const s of closes) {
    const fair = fairProbPct(s.books, c.market);
    if (fair === null || !(fair > 0)) continue;
    return {
      clvPct: (c.odds * (fair / 100) - 1) * 100,
      shopPct: (c.odds * (c.fairProb / 100) - 1) * 100,
      driftPct: (fair / c.fairProb - 1) * 100,
    };
  }
  return null;
}

export interface SettledRecord {
  id: number;
  league: string;
  home: string;
  away: string;
  kickoffTs: number;
  candidate: Candidate;
  clv: RecordClv | null;
  result: { home: number; away: number } | null;
  /** nyert / vesztett; null, ha érvénytelen (halasztott, törölt) */
  won: boolean | null;
  /** Egységtét eredménye (odds − 1 vagy −1); null, ha érvénytelen */
  profitUnits: number | null;
  settledAt: number;
}

/**
 * A lezárt meccsek kivétele az aktív állapotból. Jelölt nélküli lezárt vagy régi meccs egyszerűen törlődik;
 * jelölt SettledRecord-ként kerül a hosszú távú naplóba.
 */
export function finalizeFixtures(state: TrackerState, nowMs: number): SettledRecord[] {
  const out: SettledRecord[] = [];
  for (const [key, f] of Object.entries(state.fixtures)) {
    const done = f.status === 'finished' && f.result !== undefined;
    const voided = f.status === 'void';
    const stale = nowMs - f.kickoffTs > TRACKER_CONFIG.STALE_AFTER_MS;
    if (!done && !voided && !stale) continue;
    if (f.candidate) {
      const won = done ? outcomeWon(f.candidate.market, f.result!) : null;
      out.push({
        id: f.id,
        league: f.league,
        home: f.home,
        away: f.away,
        kickoffTs: f.kickoffTs,
        candidate: f.candidate,
        clv: fixtureClv(f),
        result: f.result ?? null,
        won,
        profitUnits: won === null ? null : won ? f.candidate.odds - 1 : -1,
        settledAt: nowMs,
      });
    }
    delete state.fixtures[key];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Összegzés
// ---------------------------------------------------------------------------

export interface TrackerSummary {
  generatedAt: string;
  /** Aktív (még nem lezárt) követett meccsek */
  activeFixtures: number;
  activeCandidates: number;
  /** Lezárt jelöltek */
  settledCandidates: number;
  clv: ClvStats;
  roi: { n: number; roiPct: number; seRoiPct: number; ci95LowPct: number; ci95HighPct: number; hitRatePct: number };
  byBookmaker: { bookmaker: string; n: number }[];
  byMarket: { market: string; n: number }[];
  byLeague: { league: string; n: number }[];
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

function tally<T extends string>(items: T[]): { key: T; n: number }[] {
  const m = new Map<T, number>();
  for (const i of items) m.set(i, (m.get(i) ?? 0) + 1);
  return [...m.entries()].map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n);
}

/** Összegzés a lezárt rekordokból és az aktív, már záró pillanatképpel rendelkező jelöltekből (a CLV-hez). */
export function summarize(state: TrackerState, settled: SettledRecord[], nowMs: number): TrackerSummary {
  const active = Object.values(state.fixtures).filter((f) => f.candidate);
  const clvSamples: RecordClv[] = [
    ...settled.map((s) => s.clv),
    ...active.map((f) => fixtureClv(f)),
  ].filter((x): x is RecordClv => x !== null);

  const played = settled.filter((s) => s.profitUnits !== null);
  const profits = played.map((s) => s.profitUnits as number);
  const n = profits.length;
  const m = n > 0 ? mean(profits) : 0;
  const variance = n > 1 ? profits.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1) : 0;
  const se = n > 0 ? Math.sqrt(variance / n) : 0;

  const allCandidates = [...settled.map((s) => s.candidate), ...active.map((f) => f.candidate!)];
  return {
    generatedAt: new Date(nowMs).toISOString(),
    activeFixtures: Object.keys(state.fixtures).length,
    activeCandidates: active.length,
    settledCandidates: settled.length,
    clv: clvStatsFromSamples(clvSamples),
    roi: {
      n,
      roiPct: m * 100,
      seRoiPct: se * 100,
      ci95LowPct: (m - 1.96 * se) * 100,
      ci95HighPct: (m + 1.96 * se) * 100,
      hitRatePct: n > 0 ? (played.filter((s) => s.won).length / n) * 100 : 0,
    },
    byBookmaker: tally(allCandidates.map((c) => c.bookmaker)).map((x) => ({ bookmaker: x.key, n: x.n })),
    byMarket: tally(allCandidates.map((c) => c.market)).map((x) => ({ market: x.key, n: x.n })),
    byLeague: tally([...settled.map((s) => s.league), ...active.map((f) => f.league)]).map((x) => ({
      league: x.key,
      n: x.n,
    })),
  };
}

const VERDICT_HU: Record<ClvStats['verdict'], string> = {
  no_data: 'Még nincs mérhető jelölt.',
  insufficient: 'Kevés minta (n < 50): nem értelmezhető.',
  unproven: 'Nincs bizonyított ár-előny: a konfidencia-intervallum tartalmazza a nullát.',
  edge_likely: 'Valószínű ár-előny a záró árhoz (n >= 100, az intervallum alsó széle > 0).',
  negative: 'Negatív: a jelöltek a záró árnál rosszabb áron készültek.',
};

const sgn = (x: number, d = 2) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}%`;

/** Ember által olvasható összegzés (a tracker-data ág README.md-je). */
export function renderSummaryMarkdown(s: TrackerSummary): string {
  const lines: string[] = [];
  lines.push('# Szorzó-követő összegzése');
  lines.push('');
  lines.push(`Frissítve: ${s.generatedAt} (UTC). Modell nélküli mérés: a legjobb bukméker ára a konszenzus (Pinnacle, ennek híján az átlag) de-vigelt fair árához képest, a záró árhoz mérve.`);
  lines.push('');
  lines.push(`- Aktív követett meccs: **${s.activeFixtures}**, ebből jelölt: **${s.activeCandidates}**`);
  lines.push(`- Lezárt jelölt: **${s.settledCandidates}**`);
  lines.push('');
  lines.push('## CLV a záró fair árhoz');
  lines.push('');
  if (s.clv.n === 0) {
    lines.push(VERDICT_HU[s.clv.verdict]);
  } else {
    lines.push(
      `- Átlagos CLV: **${sgn(s.clv.meanClvPct)}** (n = ${s.clv.n}, 95%: [${sgn(s.clv.ci95LowPct)}; ${sgn(s.clv.ci95HighPct)}])`
    );
    lines.push(`- Pozitív CLV aránya: ${(s.clv.positiveShare * 100).toFixed(0)}%`);
    lines.push(`- Ár-előny a jelölésnél: ${sgn(s.clv.meanShopPct)} · piac-mozgás a jelölt irányába: ${sgn(s.clv.meanDriftPct)}`);
    lines.push(`- Ítélet: **${VERDICT_HU[s.clv.verdict]}**`);
  }
  lines.push('');
  lines.push('## Egységtét eredménye (a jelölésnél elérhető legjobb szorzón)');
  lines.push('');
  if (s.roi.n === 0) {
    lines.push('Még nincs elszámolt jelölt.');
  } else {
    lines.push(
      `- ROI: **${sgn(s.roi.roiPct, 1)}** (n = ${s.roi.n}, 95%: [${sgn(s.roi.ci95LowPct, 1)}; ${sgn(s.roi.ci95HighPct, 1)}]), találati arány ${s.roi.hitRatePct.toFixed(0)}%`
    );
    lines.push('- Egy +3% ROI kimutatásához kb. 4000 fogadás kellene; a ROI rövid távon zaj, a CLV a mérvadó.');
  }
  lines.push('');
  const list = (title: string, rows: { name: string; n: number }[]) => {
    lines.push(`## ${title}`);
    lines.push('');
    if (rows.length === 0) lines.push('Nincs adat.');
    for (const r of rows.slice(0, 12)) lines.push(`- ${r.name}: ${r.n}`);
    lines.push('');
  };
  list('Melyik bukméker adta a legjobb árat', s.byBookmaker.map((x) => ({ name: x.bookmaker, n: x.n })));
  list('Piacok', s.byMarket.map((x) => ({ name: x.market, n: x.n })));
  list('Ligák', s.byLeague.map((x) => ({ name: x.league, n: x.n })));
  lines.push('Fontos: a legjobb ár csak akkor értékes, ha tényleg elérhető (számlakorlátok, szorzó-késés). A bukmékerenkénti megoszlás mutatja, kitől függ az előny.');
  lines.push('');
  return lines.join('\n');
}
