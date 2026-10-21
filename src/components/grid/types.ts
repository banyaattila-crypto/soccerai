import React from 'react';
import { Match, PickMarket } from '../../types/football';

export type DisplayMode = 'compact' | 'cards' | 'table';

export type GridMetricId =
  | 'OVER_15'
  | 'OVER_25'
  | 'UNDER_25'
  | 'OVER_35'
  | 'BTTS'
  | 'HOME_WIN'
  | 'DRAW'
  | 'AWAY_WIN'
  | 'FH_OVER_05'
  | 'BTTS_AND_OVER25';

export interface GridMetricOption {
  id: GridMetricId;
  label: string;
  shortLabel: string;
  marketName: (match: Match) => string;
  market: PickMarket;
  getValue: (p: Match['probabilities']) => number;
  getOdds: (match: Match) => number;
}

export type CellBetHandler = (
  e: React.MouseEvent,
  match: Match,
  marketLabel: string,
  prob: number,
  odds: number,
  market?: PickMarket
) => void;

export const GRID_METRICS: GridMetricOption[] = [
  {
    id: 'OVER_15',
    label: 'Over 1.5 %',
    shortLabel: 'Goal >1.5',
    marketName: () => '1.5 gól felett',
    market: 'OVER_15',
    getValue: (p) => p.over15,
    getOdds: (m) =>
      Number(Math.max(1.05, +(100 / Math.max(10, m.probabilities.over15 * 0.94)).toFixed(2))),
  },
  {
    id: 'OVER_25',
    label: 'Over 2.5 %',
    shortLabel: 'Goal >2.5',
    marketName: () => '2.5 gól felett',
    market: 'OVER_25',
    getValue: (p) => p.over25,
    getOdds: (m) => m.odds.over25,
  },
  {
    id: 'UNDER_25',
    label: 'Under 2.5 %',
    shortLabel: 'Goal <2.5',
    marketName: () => '2.5 gól alatt',
    market: 'UNDER_25',
    getValue: (p) => Math.max(1, 100 - p.over25),
    getOdds: (m) =>
      Number(
        Math.max(1.1, +(100 / Math.max(10, (100 - m.probabilities.over25) * 0.94)).toFixed(2))
      ),
  },
  {
    id: 'OVER_35',
    label: 'Over 3.5 %',
    shortLabel: 'Goal >3.5',
    marketName: () => '3.5 gól felett',
    market: 'OVER_35',
    getValue: (p) => p.over35,
    getOdds: (m) =>
      Number(Math.max(1.2, +(100 / Math.max(10, m.probabilities.over35 * 0.94)).toFixed(2))),
  },
  {
    id: 'BTTS',
    label: 'BTTS %',
    shortLabel: 'BTTS',
    marketName: () => 'Mindkét csapat szerez gólt (BTTS)',
    market: 'BTTS_YES',
    getValue: (p) => p.bttsYes,
    getOdds: (m) => m.odds.bttsYes,
  },
  {
    id: 'HOME_WIN',
    label: '1 (Hazai) %',
    shortLabel: '1 (Hazai)',
    marketName: (m) => `${m.homeTeam.name} Győzelem (1)`,
    market: '1',
    getValue: (p) => p.homeWin,
    getOdds: (m) => m.odds.home,
  },
  {
    id: 'DRAW',
    label: 'X (Döntetlen) %',
    shortLabel: 'X (Dönt.)',
    marketName: () => 'Döntetlen (X)',
    market: 'X',
    getValue: (p) => p.draw,
    getOdds: (m) => m.odds.draw,
  },
  {
    id: 'AWAY_WIN',
    label: '2 (Vendég) %',
    shortLabel: '2 (Vendég)',
    marketName: (m) => `${m.awayTeam.name} Győzelem (2)`,
    market: '2',
    getValue: (p) => p.awayWin,
    getOdds: (m) => m.odds.away,
  },
  {
    id: 'FH_OVER_05',
    label: '1.F >0.5 %',
    shortLabel: 'HT >0.5',
    marketName: () => '1. félidő 0.5 gól felett',
    market: 'FH_OVER_05',
    getValue: (p) => p.fhOver05,
    getOdds: (m) =>
      Number(Math.max(1.15, +(100 / Math.max(10, m.probabilities.fhOver05 * 0.94)).toFixed(2))),
  },
  {
    id: 'BTTS_AND_OVER25',
    label: 'BTTS & >2.5 %',
    shortLabel: 'BTTS & >2.5',
    marketName: () => 'BTTS és 2.5 gól felett',
    market: 'BTTS_AND_OVER25',
    getValue: (p) => p.bttsAndOver25 ?? Math.round((p.bttsYes * p.over25) / 100),
    getOdds: (m) => {
      const pVal =
        m.probabilities.bttsAndOver25 ?? Math.round((m.probabilities.bttsYes * m.probabilities.over25) / 100);
      return Number(Math.max(1.3, +(100 / Math.max(10, pVal * 0.9)).toFixed(2)));
    },
  },
];
