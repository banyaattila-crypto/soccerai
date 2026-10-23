import { BetSlipItem, Match, TrackedBet, TrackedBetStatus, BankrollSummary } from '../types/football';
import { evaluatePickWon } from './betEvaluation';

export const STORAGE_KEY_BANKROLL = 'soccerai_bankroll_config';
export const STORAGE_KEY_BETS = 'soccerai_tracked_bets';
export const DEFAULT_INITIAL_BANKROLL = 50000; // 50 000 Ft kezdőtőke

/**
 * Kezdőtőke lekérése localStorage-ből
 */
export function getInitialBankroll(): number {
  if (typeof window === 'undefined') return DEFAULT_INITIAL_BANKROLL;
  const saved = localStorage.getItem(STORAGE_KEY_BANKROLL);
  if (!saved) return DEFAULT_INITIAL_BANKROLL;
  try {
    const parsed = JSON.parse(saved);
    return typeof parsed.initialBankroll === 'number' && parsed.initialBankroll > 0
      ? parsed.initialBankroll
      : DEFAULT_INITIAL_BANKROLL;
  } catch {
    return DEFAULT_INITIAL_BANKROLL;
  }
}

/**
 * Kezdőtőke mentése localStorage-be
 */
export function setInitialBankroll(amount: number): void {
  if (typeof window === 'undefined') return;
  const config = {
    initialBankroll: Math.max(1000, Math.round(amount)),
    currency: 'Ft',
  };
  localStorage.setItem(STORAGE_KEY_BANKROLL, JSON.stringify(config));
}

/**
 * Tétnaplóban tárolt szelvények betöltése
 */
export function getTrackedBets(): TrackedBet[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(STORAGE_KEY_BETS);
  if (!saved) {
    // Első indításkor tiszta lap: nincs automatikusan generált hamis múltbeli nyereség
    return [];
  }
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Hiba a szelvények betöltésekor:', e);
    return [];
  }
}

/**
 * Szelvények mentése localStorage-be
 */
export function saveTrackedBets(bets: TrackedBet[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_BETS, JSON.stringify(bets));
}

/**
 * Új szelvény rögzítése a Szelvényépítőből
 */
export function createTrackedBet(
  items: BetSlipItem[],
  stake: number,
  notes?: string
): TrackedBet {
  const totalOdds = Number(
    items.reduce((acc, curr) => acc * curr.odds, 1).toFixed(2)
  );
  const potentialWin = Math.round(stake * totalOdds);

  const newBet: TrackedBet = {
    id: `bet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    stake,
    totalOdds,
    potentialWin,
    status: 'PENDING',
    notes: notes?.trim() || undefined,
    items: items.map((i) => ({
      matchId: i.matchId,
      matchTitle: i.matchTitle,
      marketLabel: i.marketLabel,
      odds: i.odds,
      probability: i.probability,
      quarterKellyPct: i.quarterKellyPct,
    })),
  };

  const existing = getTrackedBets();
  const updated = [newBet, ...existing];
  saveTrackedBets(updated);
  return newBet;
}

/**
 * Szelvény státuszának kézi frissítése
 */
export function updateTrackedBetStatus(
  betId: string,
  newStatus: TrackedBetStatus
): TrackedBet[] {
  const bets = getTrackedBets();
  const updated = bets.map((bet) => {
    if (bet.id !== betId) return bet;

    let netProfit: number | undefined;
    if (newStatus === 'WON') {
      netProfit = bet.potentialWin - bet.stake;
    } else if (newStatus === 'LOST') {
      netProfit = -bet.stake;
    } else if (newStatus === 'VOID') {
      netProfit = 0;
    } else {
      netProfit = undefined;
    }

    return {
      ...bet,
      status: newStatus,
      netProfit,
      settledAt: newStatus === 'PENDING' ? undefined : new Date().toISOString(),
    };
  });

  saveTrackedBets(updated);
  return updated;
}

/**
 * Egyetlen szelvény törlése
 */
export function deleteTrackedBet(betId: string): TrackedBet[] {
  const bets = getTrackedBets();
  const filtered = bets.filter((b) => b.id !== betId);
  saveTrackedBets(filtered);
  return filtered;
}

/**
 * Teljes tétnapló ürítése
 */
export function clearAllTrackedBets(): void {
  saveTrackedBets([]);
}

/**
 * Automatikus szelvény-kiértékelés a meccsadatbázisban található befejezett mérkőzések alapján
/**
 * Tiszta kiértékelő függvény: adott szelvény-listát értékel ki mérkőzések alapján (mellékhatásmentes).
 */
export function autoEvaluateBetsList(
  bets: TrackedBet[],
  matches: Match[]
): { updatedCount: number; updatedBets: TrackedBet[] } {
  let updatedCount = 0;
  const matchMap = new Map<string, Match>();
  matches.forEach((m) => matchMap.set(m.id, m));

  const updatedBets = bets.map((bet) => {
    if (bet.status !== 'PENDING') return bet;

    let allItemsFinished = true;

    const updatedItems = bet.items.map((item) => {
      const match = matchMap.get(item.matchId);

      if (
        match &&
        match.status === 'FINISHED' &&
        match.homeScore !== undefined &&
        match.awayScore !== undefined
      ) {
        const isWon = evaluatePickWon(
          match.homeScore,
          match.awayScore,
          item.market,
          item.marketLabel,
          match.homeHalfTimeScore,
          match.awayHalfTimeScore
        );

        if (isWon === null) {
          allItemsFinished = false;
        }

        return {
          ...item,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          homeHalfTimeScore: match.homeHalfTimeScore,
          awayHalfTimeScore: match.awayHalfTimeScore,
          isWon: isWon === null ? undefined : isWon,
        };
      }

      allItemsFinished = false;
      return item;
    });

    const anyItemLost = updatedItems.some((it) => it.isWon === false);
    const allWon =
      allItemsFinished &&
      updatedItems.length > 0 &&
      updatedItems.every((it) => it.isWon === true);

    if (allWon) {
      updatedCount++;
      return {
        ...bet,
        items: updatedItems,
        status: 'WON' as TrackedBetStatus,
        netProfit: bet.potentialWin - bet.stake,
        settledAt: new Date().toISOString(),
      };
    } else if (anyItemLost) {
      updatedCount++;
      return {
        ...bet,
        items: updatedItems,
        status: 'LOST' as TrackedBetStatus,
        netProfit: -bet.stake,
        settledAt: new Date().toISOString(),
      };
    }

    return {
      ...bet,
      items: updatedItems,
    };
  });

  return { updatedCount, updatedBets };
}

export { autoEvaluateBetsList as autoEvaluateTrackedBets };

/**
 * Automatikusan kiértékeli a függőben lévő szelvényeket a frissen betöltött mérkőzések eredményei alapján,
 * és frissíti a helyi adatbázist (localStorage).
 */
export function autoEvaluateBetsWithMatches(
  matches: Match[]
): { updatedCount: number; bets: TrackedBet[] } {
  const bets = getTrackedBets();
  const { updatedCount, updatedBets } = autoEvaluateBetsList(bets, matches);

  if (updatedCount > 0) {
    saveTrackedBets(updatedBets);
  }

  return { updatedCount, bets: updatedBets };
}

/**
 * Bankroll és Tétnapló összesített statisztikai mérőszámai
 */
export function calculateBankrollSummary(
  bets: TrackedBet[],
  initialBankroll: number
): BankrollSummary {
  const settledBets = bets.filter((b) => b.status === 'WON' || b.status === 'LOST');
  const wonBets = bets.filter((b) => b.status === 'WON');
  const lostBets = bets.filter((b) => b.status === 'LOST');
  const pendingBets = bets.filter((b) => b.status === 'PENDING');
  const voidBets = bets.filter((b) => b.status === 'VOID');

  // Lekötött összeg jelenleg függőben
  const pendingStakes = pendingBets.reduce((acc, curr) => acc + curr.stake, 0);

  // Lezárt tétek összege
  const totalSettledStaked = settledBets.reduce((acc, curr) => acc + curr.stake, 0);

  // Teljes tét (minden szelvényre)
  const totalStaked = bets.reduce((acc, curr) => acc + curr.stake, 0);

  // Nettó realizált profit a lezártakból
  const netProfit = settledBets.reduce((acc, curr) => acc + (curr.netProfit || 0), 0);

  // Aktuális egyenleg = kezdőtőke + realizált profit - éppen függőben lévő tétek
  const currentBankroll = initialBankroll + netProfit - pendingStakes;

  // Realizált ROI %
  const roiPct =
    totalSettledStaked > 0
      ? Number(((netProfit / totalSettledStaked) * 100).toFixed(1))
      : 0;

  // Találati arány (Strike Rate %)
  const winRate =
    settledBets.length > 0
      ? Number(((wonBets.length / settledBets.length) * 100).toFixed(1))
      : 0;

  // Átlagos szorzó
  const avgOdds =
    bets.length > 0
      ? Number((bets.reduce((acc, curr) => acc + curr.totalOdds, 0) / bets.length).toFixed(2))
      : 0;

  // Átlagos tét
  const avgStake =
    bets.length > 0 ? Math.round(totalStaked / bets.length) : 0;

  return {
    initialBankroll,
    currentBankroll,
    totalStaked,
    netProfit,
    roiPct,
    totalBets: bets.length,
    wonBets: wonBets.length,
    lostBets: lostBets.length,
    pendingBets: pendingBets.length,
    voidBets: voidBets.length,
    winRate,
    avgOdds,
    avgStake,
  };
}

/**
 * Tétnapló exportálása JSON szöveggé
 */
export function exportBetsToJson(): string {
  const bets = getTrackedBets();
  const bankroll = getInitialBankroll();
  const data = {
    exportedAt: new Date().toISOString(),
    version: '1.6.0',
    initialBankroll: bankroll,
    bets,
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Tétnapló importálása JSON szövegből (szigorú séma-ellenőrzéssel és formátumtámogatással)
 */
export function importBetsFromJson(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed) return false;

    // Támogatjuk mind a becsomagolt objektumot { bets: [...], initialBankroll?: number }, mind a közvetlen tömböt [...]
    let rawBets: any[] = [];
    let initialBankroll: number | undefined;

    if (Array.isArray(parsed)) {
      rawBets = parsed;
    } else if (typeof parsed === 'object') {
      if (Array.isArray(parsed.bets)) {
        rawBets = parsed.bets;
      }
      if (typeof parsed.initialBankroll === 'number' && parsed.initialBankroll > 0) {
        initialBankroll = parsed.initialBankroll;
      }
    }

    if (!Array.isArray(rawBets) || rawBets.length === 0) {
      return false;
    }

    // Szigorú séma validáció minden szelvényre
    const validStatuses: TrackedBetStatus[] = ['PENDING', 'WON', 'LOST', 'VOID'];
    const validatedBets: TrackedBet[] = [];

    for (const b of rawBets) {
      if (!b || typeof b !== 'object') continue;
      if (typeof b.id !== 'string' || !b.id.trim()) continue;
      if (typeof b.createdAt !== 'string' || !b.createdAt.trim()) continue;
      if (!validStatuses.includes(b.status)) continue;
      if (typeof b.stake !== 'number' || isNaN(b.stake) || b.stake <= 0) continue;
      if (typeof b.totalOdds !== 'number' || isNaN(b.totalOdds) || b.totalOdds < 1.0) continue;
      if (typeof b.potentialWin !== 'number' || isNaN(b.potentialWin) || b.potentialWin < 0) continue;
      if (!Array.isArray(b.items) || b.items.length === 0) continue;

      let itemsValid = true;
      const validItems: any[] = [];
      for (const it of b.items) {
        if (!it || typeof it !== 'object') {
          itemsValid = false;
          break;
        }
        if (typeof it.matchId !== 'string' || !it.matchId) {
          itemsValid = false;
          break;
        }
        if (typeof it.marketLabel !== 'string' || !it.marketLabel) {
          itemsValid = false;
          break;
        }
        if (typeof it.odds !== 'number' || isNaN(it.odds) || it.odds < 1.0) {
          itemsValid = false;
          break;
        }
        validItems.push({
          matchId: it.matchId,
          matchTitle: typeof it.matchTitle === 'string' ? it.matchTitle : 'Mérkőzés',
          market: it.market,
          marketLabel: it.marketLabel,
          odds: it.odds,
          probability: typeof it.probability === 'number' ? it.probability : 50,
          quarterKellyPct: typeof it.quarterKellyPct === 'number' ? it.quarterKellyPct : undefined,
          isWon: typeof it.isWon === 'boolean' ? it.isWon : undefined,
          homeScore: typeof it.homeScore === 'number' ? it.homeScore : undefined,
          awayScore: typeof it.awayScore === 'number' ? it.awayScore : undefined,
        });
      }

      if (!itemsValid || validItems.length === 0) continue;

      validatedBets.push({
        id: b.id,
        createdAt: b.createdAt,
        stake: b.stake,
        totalOdds: b.totalOdds,
        potentialWin: b.potentialWin,
        status: b.status,
        notes: typeof b.notes === 'string' ? b.notes : undefined,
        items: validItems,
        netProfit: typeof b.netProfit === 'number' ? b.netProfit : undefined,
        settledAt: typeof b.settledAt === 'string' ? b.settledAt : undefined,
      });
    }

    if (validatedBets.length === 0) {
      return false;
    }

    saveTrackedBets(validatedBets);
    if (initialBankroll && initialBankroll > 0) {
      setInitialBankroll(initialBankroll);
    }
    return true;
  } catch (e) {
    console.error('Érvénytelen JSON import:', e);
    return false;
  }
}
