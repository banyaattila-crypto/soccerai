import type { AuditMarketSnapshot, Match, PredictionAuditRecord } from '../types/football';
import { marketSnapshotForPick } from './clvService';
import {
  PROTOCOL_PROB_V1,
  computePickGapPp,
  computeProtocolStats,
  evaluateProtocolInput,
  protocolStamp,
  type ProtocolConfig,
  type ProtocolEvaluation,
  type ProtocolStats,
} from './bettingProtocol';
import { AUDIT_BASE_STAKE, computeRecordHash, getMatchKickoffTimestamp, isMatchBeforeKickoff } from './predictionAuditService';
import { outcomeWon, type TrackerMarket } from './tracker/trackerCore';

/**
 * B protokoll: magas valószínűségű tippek (lásd PROTOCOL_PROB_V1 és docs/betting-protocol.md).
 *
 * Külön napló tartozik hozzá, mert a fő tipp (aiPick) a játszható "édes pont" szorzókat (1,55-2,40) keresi, a magas
 * valószínűségű jelöltek szorzója viszont jellemzően 1,25-1,70. Egy meccsről legfeljebb egy B-tipp készül: a
 * feltételeknek megfelelő kimenetelek közül a legnagyobb piaci valószínűségű. A napló write-once, a rekordok a
 * kezdés előtt keletkeznek, a lezárás csak a végeredményből történik.
 */

export const STORAGE_KEY_PROB_LOG = 'soccerai_prob_pick_log_v1';
const MAX_RECORDS = 600;

const PROB_MARKETS: TrackerMarket[] = ['1', '2', 'OVER_25', 'UNDER_25', 'X'];

export interface ProbCandidate {
  match: Match;
  market: TrackerMarket;
  marketLabel: string;
  /** Piaci (de-vigelt) valószínűség, % */
  probPct: number;
  /** A legjobb elérhető szorzó és az iroda */
  odds: number;
  bookmaker?: string;
  /** A fair szorzó (100 / valószínűség) */
  fairOdds: number;
  /** Ár-előny a fair árhoz képest, % (szorzó · fair − 1) */
  edgePct: number;
  gapPp: number | null;
  snapshot: AuditMarketSnapshot;
  evaluation: ProtocolEvaluation;
}

function labelFor(market: TrackerMarket, match: Pick<Match, 'homeTeam' | 'awayTeam'>): string {
  switch (market) {
    case '1':
      return `${match.homeTeam.name} győzelem (1)`;
    case '2':
      return `${match.awayTeam.name} győzelem (2)`;
    case 'X':
      return 'Döntetlen (X)';
    case 'OVER_25':
      return 'Over 2.5 gól';
    case 'UNDER_25':
      return 'Under 2.5 gól';
  }
}

/** A meccs B-protokollnak megfelelő legjobb jelöltje (legnagyobb piaci valószínűség); null, ha nincs. */
export function findProbCandidate(
  match: Match,
  nowMs: number = Date.now(),
  cfg: ProtocolConfig = PROTOCOL_PROB_V1
): ProbCandidate | null {
  if (match.status !== 'UPCOMING' || !match.realOdds) return null;
  const kickoff = getMatchKickoffTimestamp(match);
  if (!kickoff || isNaN(kickoff)) return null;

  let best: ProbCandidate | null = null;
  for (const market of PROB_MARKETS) {
    const snap = marketSnapshotForPick(match, market, nowMs);
    if (!snap || !snap.odds) continue;
    const gapPp = computePickGapPp(match, market);
    const evaluation = evaluateProtocolInput(
      { market, odds: snap.odds, isSimulatedOdds: false, fairProbPct: snap.fairProb, gapPp, leadMs: kickoff - nowMs },
      cfg
    );
    if (!evaluation.eligible) continue;
    const candidate: ProbCandidate = {
      match,
      market,
      marketLabel: labelFor(market, match),
      probPct: snap.fairProb,
      odds: snap.odds,
      bookmaker: snap.bookmaker,
      fairOdds: Math.round((10000 / snap.fairProb)) / 100,
      edgePct: evaluation.edgePct ?? 0,
      gapPp,
      snapshot: snap,
      evaluation,
    };
    if (!best || candidate.probPct > best.probPct || (candidate.probPct === best.probPct && candidate.edgePct > best.edgePct)) {
      best = candidate;
    }
  }
  return best;
}

/** A mostani B-jelöltek valószínűség szerint rendezve (a megjelenítéshez). */
export function listProbCandidates(matches: Match[], nowMs: number = Date.now(), cfg: ProtocolConfig = PROTOCOL_PROB_V1): ProbCandidate[] {
  return matches
    .map((m) => findProbCandidate(m, nowMs, cfg))
    .filter((c): c is ProbCandidate => c !== null)
    .sort((a, b) => b.probPct - a.probPct || b.edgePct - a.edgePct);
}

export function getProbLog(): PredictionAuditRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROB_LOG);
    const parsed = raw ? (JSON.parse(raw) as PredictionAuditRecord[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveProbLog(records: PredictionAuditRecord[]): void {
  try {
    const sorted = [...records].sort((a, b) => a.kickoffTimestamp - b.kickoffTimestamp).slice(-MAX_RECORDS);
    localStorage.setItem(STORAGE_KEY_PROB_LOG, JSON.stringify(sorted));
  } catch {
    // Helyhiány vagy tiltott tár: a mérés ezen az eszközön nem tartós, az app működését nem érinti
  }
}

/**
 * Naplózza a B-jelölteket kezdés előtt (write-once, meccsenként egy). A napi keretet (kezdési nap szerint) a már
 * naplózott rekordok és a valószínűség szerint rendezett új jelöltek együtt adják.
 */
export function recordProbPicks(
  matches: Match[],
  nowMs: number = Date.now(),
  cfg: ProtocolConfig = PROTOCOL_PROB_V1
): { added: number } {
  const log = getProbLog();
  const byMatch = new Set(log.map((r) => r.matchId));
  const perDay = new Map<string, number>();
  for (const r of log) {
    if (r.protocol?.version === cfg.version) perDay.set(r.kickoffDate, (perDay.get(r.kickoffDate) ?? 0) + 1);
  }

  const fresh = listProbCandidates(
    matches.filter((m) => !byMatch.has(m.id) && isMatchBeforeKickoff(m, nowMs)),
    nowMs,
    cfg
  );

  let added = 0;
  for (const c of fresh) {
    const day = c.match.kickoffDate;
    if ((perDay.get(day) ?? 0) >= cfg.maxPerDay) continue;
    const m = c.match;
    const kickoffTimestamp = getMatchKickoffTimestamp(m);
    const loggedAt = new Date(nowMs).toISOString();
    log.push({
      id: `prob-${m.id}-${kickoffTimestamp}`,
      matchId: m.id,
      loggedAt,
      kickoffDate: m.kickoffDate,
      kickoffTime: m.kickoffTime || '18:00',
      kickoffTimestamp,
      utcDate: m.utcDate,
      leagueId: m.leagueId,
      leagueName: m.leagueName,
      leagueCountry: m.leagueCountry,
      leagueFlag: m.leagueFlag,
      homeTeam: { name: m.homeTeam.name, logo: m.homeTeam.logo, shortName: m.homeTeam.shortName },
      awayTeam: { name: m.awayTeam.name, logo: m.awayTeam.logo, shortName: m.awayTeam.shortName },
      pick: {
        market: c.market,
        marketLabel: c.marketLabel,
        probability: c.probPct,
        odds: c.odds,
        expectedValue: Math.round(c.edgePct * 10) / 10,
        isSimulatedOdds: false,
        reasoning: `B protokoll: piaci valószínűség ${c.probPct.toFixed(1)}%, legjobb ár @${c.odds}${c.bookmaker ? ` (${c.bookmaker})` : ''}, fair @${c.fairOdds.toFixed(2)}.`,
      },
      marketAtLog: c.snapshot,
      protocol: protocolStamp(m, c.market, cfg),
      provenance: 'VERIFIED_PRE_MATCH',
      auditHash: computeRecordHash({
        matchId: m.id,
        kickoffTimestamp,
        loggedAt,
        market: c.market,
        probability: c.probPct,
        odds: c.odds,
      }),
      settled: false,
      status: 'PENDING',
      profit: 0,
      roi: 0,
    });
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
    added++;
  }
  if (added > 0) saveProbLog(log);
  return { added };
}

/** A lezáratlan B-tippek záró piaci pillanatképe (a legfrissebb érvényes), a CLV-hez. */
export function updateProbClosing(matches: Match[], nowMs: number = Date.now()): { updated: number } {
  const log = getProbLog();
  if (log.length === 0 || matches.length === 0) return { updated: 0 };
  const byId = new Map(matches.map((m) => [m.id, m]));
  let updated = 0;
  for (const rec of log) {
    if (rec.settled || nowMs >= rec.kickoffTimestamp) continue;
    const match = byId.get(rec.matchId);
    if (!match || !isMatchBeforeKickoff(match, nowMs)) continue;
    const snap = marketSnapshotForPick(match, rec.pick.market, nowMs);
    if (!snap) continue;
    rec.marketClose = snap;
    updated++;
  }
  if (updated > 0) saveProbLog(log);
  return { updated };
}

/** Lezárás a befejezett meccsek végeredményéből (90 perces eredmény; a nyert/vesztett a kimenetelből számolt). */
export function settleProbPicks(matches: Match[], baseStake: number = AUDIT_BASE_STAKE): { settled: number } {
  const log = getProbLog();
  if (log.length === 0) return { settled: 0 };
  const byId = new Map(matches.map((m) => [m.id, m]));
  let settled = 0;
  for (const rec of log) {
    if (rec.settled) continue;
    const m = byId.get(rec.matchId);
    if (!m || m.status !== 'FINISHED' || typeof m.homeScore !== 'number' || typeof m.awayScore !== 'number') continue;
    const market = rec.pick.market as TrackerMarket;
    if (!PROB_MARKETS.includes(market)) continue;
    const won = outcomeWon(market, { home: m.homeScore, away: m.awayScore });
    rec.settled = true;
    rec.settledAt = new Date().toISOString();
    rec.homeScore = m.homeScore;
    rec.awayScore = m.awayScore;
    rec.status = won ? 'WON' : 'LOST';
    rec.profit = won ? Math.round((rec.pick.odds - 1) * baseStake) : -baseStake;
    rec.roi = won ? Math.round((rec.pick.odds - 1) * 1000) / 10 : -100;
    settled++;
  }
  if (settled > 0) saveProbLog(log);
  return { settled };
}

export function getProbStats(cfg: ProtocolConfig = PROTOCOL_PROB_V1): ProtocolStats {
  return computeProtocolStats(getProbLog(), cfg);
}
