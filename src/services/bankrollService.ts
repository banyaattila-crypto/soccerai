import { BetSlipItem, Match, TrackedBet, TrackedBetStatus, BankrollSummary } from '../types/football';
import { evaluatePickWon } from '../components/ResultsView';

export const STORAGE_KEY_BANKROLL = 'soccerai_bankroll_config';
export const STORAGE_KEY_BETS = 'soccerai_tracked_bets';
export const DEFAULT_INITIAL_BANKROLL = 50000; // 50 000 Ft kezdőtőke

// Alapértelmezett minta szelvények bemutató célra (új felhasználóknak)
export const SAMPLE_TRACKED_BETS: TrackedBet[] = [
  {
    id: 'bet-sample-1',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000 * 2).toISOString(),
    stake: 3000,
    totalOdds: 2.76,
    potentialWin: 8280,
    status: 'WON',
    settledAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    netProfit: 5280,
    notes: 'Premier League gólzápor duplázó',
    items: [
      {
        matchId: 'sample-m1',
        matchTitle: 'Liverpool vs Chelsea',
        marketLabel: 'Mindkét csapat szerez gólt (BTTS)',
        odds: 1.62,
        probability: 68,
        homeScore: 2,
        awayScore: 1,
        isWon: true,
      },
      {
        matchId: 'sample-m2',
        matchTitle: 'Arsenal vs Aston Villa',
        marketLabel: '2.5 gól felett',
        odds: 1.70,
        probability: 64,
        homeScore: 2,
        awayScore: 2,
        isWon: true,
      },
    ],
  },
  {
    id: 'bet-sample-2',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    stake: 4000,
    totalOdds: 1.85,
    potentialWin: 7400,
    status: 'WON',
    settledAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    netProfit: 3400,
    notes: 'Kiemelt La Liga szingli',
    items: [
      {
        matchId: 'sample-m3',
        matchTitle: 'Real Madrid vs Sevilla',
        marketLabel: 'Hazai győzelem (1)',
        odds: 1.85,
        probability: 67,
        homeScore: 3,
        awayScore: 1,
        isWon: true,
      },
    ],
  },
  {
    id: 'bet-sample-3',
    createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    stake: 2500,
    totalOdds: 2.10,
    potentialWin: 5250,
    status: 'LOST',
    settledAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    netProfit: -2500,
    notes: 'Serie B kockázatosabb szelvény',
    items: [
      {
        matchId: 'sample-m4',
        matchTitle: 'Palermo vs Parma',
        marketLabel: '2.5 gól felett',
        odds: 2.10,
        probability: 52,
        homeScore: 1,
        awayScore: 0,
        isWon: false,
      },
    ],
  },
  {
    id: 'bet-sample-4',
    createdAt: new Date().toISOString(),
    stake: 3500,
    totalOdds: 2.45,
    potentialWin: 8575,
    status: 'PENDING',
    notes: 'A mai nap legmagasabb +EV kombinációja',
    items: [
      {
        matchId: 'sample-m5',
        matchTitle: 'Bayern München vs Dortmund',
        marketLabel: '2.5 gól felett & BTTS',
        odds: 1.75,
        probability: 72,
      },
      {
        matchId: 'sample-m6',
        matchTitle: 'PSG vs Marseille',
        marketLabel: 'Hazai győzelem (1)',
        odds: 1.40,
        probability: 74,
      },
    ],
  },
];

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
 * Visszaállítás a kezdeti bemutató szelvényekre
 */
export function resetToSampleBets(): TrackedBet[] {
  saveTrackedBets(SAMPLE_TRACKED_BETS);
  return SAMPLE_TRACKED_BETS;
}

/**
 * Automatikus szelvény-kiértékelés a meccsadatbázisban található befejezett mérkőzések alapján
 */
export function autoEvaluateBetsWithMatches(
  matches: Match[]
): { updatedCount: number; bets: TrackedBet[] } {
  const bets = getTrackedBets();
  let updatedCount = 0;

  // Létrehozunk egy gyorstárat a meccsekből id szerint
  const matchMap = new Map<string, Match>();
  matches.forEach((m) => matchMap.set(m.id, m));

  const updatedBets = bets.map((bet) => {
    // Csak a függőben lévő szelvényeket értékeljük ki automatikusan
    if (bet.status !== 'PENDING') return bet;

    let allItemsFinished = true;

    const updatedItems = bet.items.map((item) => {
      const match = matchMap.get(item.matchId);

      // Ha meccs létezik és befejeződött (FINISHED), és vannak gólok
      if (
        match &&
        match.status === 'FINISHED' &&
        match.homeScore !== undefined &&
        match.awayScore !== undefined
      ) {
        const isWon = evaluatePickWon(
          match.homeScore,
          match.awayScore,
          undefined,
          item.marketLabel
        );

        return {
          ...item,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          isWon: isWon === null ? undefined : isWon,
        };
      }

      // Ha még nincs lezárva vagy nem található a meccs
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

    // Ha még nem zárult le minden meccs, de frissültek részeredmények
    return {
      ...bet,
      items: updatedItems,
    };
  });

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
 * Tétnapló importálása JSON szövegből
 */
export function importBetsFromJson(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed && Array.isArray(parsed.bets)) {
      saveTrackedBets(parsed.bets);
      if (typeof parsed.initialBankroll === 'number' && parsed.initialBankroll > 0) {
        setInitialBankroll(parsed.initialBankroll);
      }
      return true;
    }
    return false;
  } catch (e) {
    console.error('Érvénytelen JSON import:', e);
    return false;
  }
}
