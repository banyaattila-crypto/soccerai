import React from 'react';
import { ClipboardCheck, ClipboardX } from 'lucide-react';
import type { Match } from '../types/football';
import { evaluateMatchPick } from '../services/bettingProtocol';
import { getAuditLog, getMatchKickoffTimestamp } from '../services/predictionAuditService';
import { ProtocolBetButton } from './bankroll/ProtocolBetButton';

interface ProtocolChipProps {
  match: Match;
}

/**
 * Jelzi, hogy a tipp megfelel-e a rögzített fogadási protokollnak (papíron követett tipp). A "csak papír" felirat
 * azt mondja: az éles fogadáshoz az Eredmények oldali kapunak kell zöld utat adnia. A napi keretet nem vizsgálja.
 */
export const ProtocolChip: React.FC<ProtocolChipProps> = ({ match }) => {
  const result = evaluateMatchPick(match, getMatchKickoffTimestamp(match));
  if (!result) return null;

  if (result.eligible) {
    const pick = match.aiPick!;
    const rec = getAuditLog().find((r) => r.matchId === match.id);
    return (
      <>
      <span
        title={`Megfelel a fogadási protokollnak (ár-előny ${result.edgePct?.toFixed(1)}% a piaci konszenzushoz). Papíron követjük; éles fogadásra csak az Eredmények oldali kapu után alkalmas.`}
        className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border bg-brand-500/15 text-brand-300 border-brand-500/40"
      >
        <ClipboardCheck className="w-3 h-3 shrink-0" />
        <span>Protokoll-tipp, csak papír</span>
      </span>
      <span className="ml-1.5">
        <ProtocolBetButton
          target={{
            protocol: 'edge',
            match,
            market: pick.market,
            marketLabel: pick.marketLabel,
            loggedOdds: rec?.pick.odds ?? pick.odds,
            loggedBookmaker: rec?.marketAtLog?.bookmaker ?? pick.bookmakerName,
            probabilityPct: pick.probability,
            recordId: rec?.id,
          }}
        />
      </span>
      </>
    );
  }

  return (
    <span
      title={`Nem protokoll-tipp: ${result.reasons.join(' ')}`}
      className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border bg-slate-800/60 text-slate-400 border-slate-700"
    >
      <ClipboardX className="w-3 h-3 shrink-0" />
      <span>Nem protokoll-tipp</span>
    </span>
  );
};
