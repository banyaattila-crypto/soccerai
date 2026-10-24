import React, { useMemo, useState } from 'react';
import { CheckCircle2, Wallet, X } from 'lucide-react';
import type { Match, PickMarket } from '../../types/football';
import {
  calculateBankrollSummary,
  getInitialBankroll,
  getTrackedBets,
} from '../../services/bankrollService';
import {
  createProtocolBet,
  defaultStake,
  findProtocolBet,
  type ProtocolKind,
} from '../../services/protocolBets';
import { eventBus } from '../../utils/eventBus';

export interface ProtocolBetTarget {
  protocol: ProtocolKind;
  match: Match;
  market: PickMarket;
  marketLabel: string;
  /** A naplózáskori (papír) szorzó, iroda és piaci valószínűség */
  loggedOdds: number;
  loggedBookmaker?: string;
  probabilityPct: number;
  recordId?: string;
}

interface ProtocolBetButtonProps {
  target: ProtocolBetTarget;
  compact?: boolean;
}

const INPUT =
  'w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500';

/**
 * "Megfogadtam" gomb protokoll-tippekhez: rögzíti az irodát, a ténylegesen kapott szorzót és a tétet, és a Tétnaplóban
 * a protokoll-tipphez köti. Így mérhető, mennyit ér a valós ár a naplózotthoz képest és irodánként.
 */
export const ProtocolBetButton: React.FC<ProtocolBetButtonProps> = ({ target, compact }) => {
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState(0);
  const existing = useMemo(
    () => findProtocolBet(getTrackedBets(), target.protocol, target.match.id),
    // a mentés után újraolvasunk
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [target.protocol, target.match.id, version]
  );

  const bookmakers = useMemo(
    () => [...new Set((target.match.realOdds?.bookmakers ?? []).map((b) => b.name))].sort(),
    [target.match.realOdds]
  );

  const suggestedStake = useMemo(() => {
    const summary = calculateBankrollSummary(getTrackedBets(), getInitialBankroll());
    return defaultStake(summary.currentBankroll);
  }, [open]);

  const [bookmaker, setBookmaker] = useState(target.loggedBookmaker ?? '');
  const [odds, setOdds] = useState(target.loggedOdds.toFixed(2));
  const [stake, setStake] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (existing) {
    return (
      <span
        className={`${compact ? '' : 'mt-2 '}inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border bg-slate-800/60 text-slate-300 border-slate-700`}
        title={`Rögzítve: ${existing.bookmaker ?? 'ismeretlen iroda'} @${existing.totalOdds.toFixed(2)}, ${existing.stake.toLocaleString('hu-HU')} Ft`}
      >
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Megfogadva
      </span>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const oddsNum = parseFloat(odds.replace(',', '.'));
    const stakeNum = parseInt(stake || String(suggestedStake), 10);
    if (!bookmaker.trim()) return setError('Add meg az irodát.');
    if (!(oddsNum > 1.01)) return setError('Érvénytelen szorzó.');
    if (!(stakeNum > 0)) return setError('Érvénytelen tét.');
    const created = createProtocolBet({
      protocol: target.protocol,
      matchId: target.match.id,
      matchTitle: `${target.match.homeTeam.name} – ${target.match.awayTeam.name}`,
      marketLabel: target.marketLabel,
      market: target.market,
      loggedOdds: target.loggedOdds,
      loggedBookmaker: target.loggedBookmaker,
      probabilityPct: target.probabilityPct,
      recordId: target.recordId,
      takenOdds: oddsNum,
      bookmaker,
      stake: stakeNum,
    });
    if (!created) return setError('A fogadás nem rögzíthető (már rögzítve van, vagy hibás adat).');
    eventBus.emit('bets_changed');
    setError(null);
    setOpen(false);
    setVersion((v) => v + 1);
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={`${compact ? '' : 'mt-2 '}inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border bg-brand-500/15 text-brand-300 border-brand-500/40 hover:bg-brand-500/25 cursor-pointer`}
      >
        <Wallet className="w-3 h-3 shrink-0" />
        Megfogadtam
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className="bg-mesh-modal border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-3 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="min-w-0">
                <h3 className="font-extrabold text-white text-base">Fogadás rögzítése</h3>
                <p className="text-xs text-slate-400 truncate">
                  {target.match.homeTeam.name} – {target.match.awayTeam.name} · {target.marketLabel}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Naplózott (papír) ár: <span className="text-slate-300 font-mono">@{target.loggedOdds.toFixed(2)}</span>
              {target.loggedBookmaker ? ` (${target.loggedBookmaker})` : ''}. Add meg, amit ténylegesen kaptál.
            </p>

            <label className="block text-xs text-slate-300 font-semibold space-y-1">
              Iroda
              <input
                list="protocol-bet-bookmakers"
                value={bookmaker}
                onChange={(e) => setBookmaker(e.target.value)}
                className={INPUT}
                placeholder="pl. Pinnacle"
                autoFocus
              />
              <datalist id="protocol-bet-bookmakers">
                {bookmakers.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs text-slate-300 font-semibold space-y-1">
                Kapott szorzó
                <input value={odds} onChange={(e) => setOdds(e.target.value)} inputMode="decimal" className={INPUT} />
              </label>
              <label className="block text-xs text-slate-300 font-semibold space-y-1">
                Tét (Ft)
                <input
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  inputMode="numeric"
                  placeholder={String(suggestedStake)}
                  className={INPUT}
                />
              </label>
            </div>
            <p className="text-[10px] text-slate-500">
              Javasolt tét: a bankroll 1%-a ({suggestedStake.toLocaleString('hu-HU')} Ft). A fogadás a Tétnaplóban automatikusan
              lezáródik a végeredmény alapján.
            </p>

            {error && (
              <p role="alert" className="text-xs text-red-300">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
              >
                Mégse
              </button>
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 text-xs font-black cursor-pointer"
              >
                Rögzítem
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
