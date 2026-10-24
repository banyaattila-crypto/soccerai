import type { PickMarket, TrackedBet } from '../types/football';
import { getTrackedBets, saveTrackedBets } from './bankrollService';

/**
 * A ténylegesen megkötött fogadások és a protokoll-tippek összekötése. A protokoll papíron méri a tippeket a
 * naplózáskori (legjobb) áron; a valós fogadás ára, irodája és eredménye eltérhet (késés, tétkorlát, árváltozás).
 * Ez a modul rögzíti a kapcsolatot, és méri az eltérést: a ténylegesen kapott ár a naplózotthoz képest, irodánként.
 */

export type ProtocolKind = 'edge' | 'prob';

export interface ProtocolBetInput {
  protocol: ProtocolKind;
  matchId: string;
  matchTitle: string;
  marketLabel: string;
  market: PickMarket;
  /** A naplózáskori (protokoll) szorzó, iroda és piaci valószínűség */
  loggedOdds: number;
  loggedBookmaker?: string;
  probabilityPct: number;
  recordId?: string;
  /** A ténylegesen kapott szorzó és iroda, tét Ft-ban */
  takenOdds: number;
  bookmaker: string;
  stake: number;
}

/** Alapértelmezett tét: az aktuális bankroll 1%-a, 100 Ft-ra kerekítve, legalább 500 Ft. */
export function defaultStake(currentBankroll: number): number {
  const raw = Math.round((currentBankroll * 0.01) / 100) * 100;
  return Math.max(500, raw);
}

export function findProtocolBet(bets: TrackedBet[], protocol: ProtocolKind, matchId: string): TrackedBet | undefined {
  return bets.find((b) => b.protocolRef?.protocol === protocol && b.protocolRef.matchId === matchId);
}

/** Rögzít egy protokoll-tippre kötött, egyesemenyes fogadást. Ugyanarra a tippre kétszer nem fogad el. */
export function createProtocolBet(input: ProtocolBetInput): TrackedBet | null {
  if (!(input.takenOdds > 1) || !(input.stake > 0) || !input.bookmaker.trim()) return null;
  const existing = getTrackedBets();
  if (findProtocolBet(existing, input.protocol, input.matchId)) return null;

  const totalOdds = Number(input.takenOdds.toFixed(2));
  const bet: TrackedBet = {
    id: `bet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    stake: input.stake,
    totalOdds,
    potentialWin: Math.round(input.stake * totalOdds),
    status: 'PENDING',
    bookmaker: input.bookmaker.trim(),
    protocolRef: {
      protocol: input.protocol,
      matchId: input.matchId,
      recordId: input.recordId,
      loggedOdds: input.loggedOdds,
      loggedBookmaker: input.loggedBookmaker,
    },
    items: [
      {
        matchId: input.matchId,
        matchTitle: input.matchTitle,
        marketLabel: input.marketLabel,
        market: input.market,
        odds: totalOdds,
        probability: Math.round(input.probabilityPct),
      },
    ],
  };
  saveTrackedBets([bet, ...existing]);
  return bet;
}

export interface BookmakerRow {
  bookmaker: string;
  n: number;
  settled: number;
  /** A kapott és a naplózott szorzó átlagos eltérése, % (pozitív: jobb ár a naplózottnál) */
  slippagePct: number;
  /** Valós hozam az iroda fogadásain, a tét arányában, % */
  roiPct: number;
}

export interface ProtocolBetStats {
  n: number;
  pending: number;
  settled: number;
  /** Átlagos eltérés a kapott és a naplózott szorzó között, % (negatív: rosszabb ár, mint a protokoll feltételezte) */
  avgSlippagePct: number;
  /** Hányszor kaptunk a naplózottnál rosszabb árat */
  worseCount: number;
  /** Valós hozam a lezárt fogadásokon (tét arányában), % */
  realRoiPct: number;
  /** Ugyanezen tippek papír hozama a naplózott áron, fix 1 egység, % */
  paperRoiPct: number;
  realProfit: number;
  byBookmaker: BookmakerRow[];
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function computeProtocolBetStats(bets: TrackedBet[], protocol?: ProtocolKind): ProtocolBetStats {
  const rows = bets.filter((b) => b.protocolRef && (!protocol || b.protocolRef.protocol === protocol));
  const settled = rows.filter((b) => b.status === 'WON' || b.status === 'LOST');
  const slip = (b: TrackedBet) => (b.totalOdds / (b.protocolRef as { loggedOdds: number }).loggedOdds - 1) * 100;

  const realStake = settled.reduce((a, b) => a + b.stake, 0);
  const realProfit = settled.reduce((a, b) => a + (b.netProfit ?? (b.status === 'WON' ? b.potentialWin - b.stake : -b.stake)), 0);
  const paper = settled.map((b) =>
    b.status === 'WON' ? ((b.protocolRef as { loggedOdds: number }).loggedOdds - 1) * 100 : -100
  );

  const names = [...new Set(rows.map((b) => b.bookmaker ?? 'ismeretlen'))].sort();
  const byBookmaker = names.map((name) => {
    const mine = rows.filter((b) => (b.bookmaker ?? 'ismeretlen') === name);
    const ms = mine.filter((b) => b.status === 'WON' || b.status === 'LOST');
    const st = ms.reduce((a, b) => a + b.stake, 0);
    const pr = ms.reduce((a, b) => a + (b.netProfit ?? (b.status === 'WON' ? b.potentialWin - b.stake : -b.stake)), 0);
    return {
      bookmaker: name,
      n: mine.length,
      settled: ms.length,
      slippagePct: mean(mine.map(slip)),
      roiPct: st > 0 ? (pr / st) * 100 : 0,
    };
  });

  return {
    n: rows.length,
    pending: rows.filter((b) => b.status === 'PENDING').length,
    settled: settled.length,
    avgSlippagePct: mean(rows.map(slip)),
    worseCount: rows.filter((b) => slip(b) < -0.05).length,
    realRoiPct: realStake > 0 ? (realProfit / realStake) * 100 : 0,
    paperRoiPct: mean(paper),
    realProfit,
    byBookmaker,
  };
}
