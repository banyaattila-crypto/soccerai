import React, { useState } from 'react';
import type { Match } from '../../types/football';
import { MarketGapChip } from '../MarketGapChip';
import { Plus, Check, ChevronRight, ShieldCheck } from 'lucide-react';
import { OddsSourceBadge, OddsSourceRibbon, resolveOddsSourceState } from '../OddsSourceBadge';
import { getDataQualityInfo, getProbabilityRange } from '../../utils/modelConfidence';
import { isMarketAnchoredMarket } from '../../services/marketBlend';
import { formatKickoffShort } from '../../utils/kickoffFormat';

interface TopPickCard3DProps {
  match: Match;
  idx: number;
  isAdded: boolean;
  onAddToBetSlip: () => void;
  onSelectMatch: () => void;
}

/** Egy Napi Top Tipp 3D-s, egérmozgásra dőlő kártyája: tipp, esély, fair ár, robusztusság, indoklás, gombok. */
export const TopPickCard3D: React.FC<TopPickCard3DProps> = ({
  match,
  idx,
  isAdded,
  onAddToBetSlip,
  onSelectMatch,
}) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0, active: false });
  const pick = match.aiPick!;
  const impliedProb = Math.round((1 / pick.odds) * 100);
  const edge = pick.probability - impliedProb;
  const verdict = pick.robustnessVerdict || match.quantAnalysis?.robustnessVerdict || 'ROBUSZTUS';
  const isSimulated = pick.isSimulatedOdds !== false;
  const isExpired = pick.isOddsExpired ?? false;
  const bookmakerName = pick.bookmakerName || match.realOdds?.bestOdds.home?.bookmaker;
  const ttlMinutes = pick.ttlMinutes ?? match.realOdds?.ttlMinutes;
  const isRealActive = !isSimulated && !isExpired;
  const oddsState = resolveOddsSourceState({ isSimulated, isExpired });
  const dq = getDataQualityInfo(match);
  // Ha a valószínűség piaci (de-vigelt) alapú, a modell-érzékenységi sáv nem értelmezhető
  const isMarketBased = match.probabilitySource === 'market' && isMarketAnchoredMarket(pick.market);
  const range = isMarketBased ? undefined : getProbabilityRange(match, pick.market);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12; // -6deg to +6deg
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
    setTilt({ x, y, active: true });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, active: false });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative rounded-2xl transition-all duration-300"
      style={{ perspective: '1000px' }}
    >
      <div
        className="group relative flex flex-col justify-between rounded-2xl bg-mesh-card border border-slate-800 hover:border-emerald-500/50 shadow-xl overflow-hidden h-full"
        style={{
          transformStyle: 'preserve-3d',
          transform: tilt.active
            ? `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateY(-4px)`
            : 'rotateX(0deg) rotateY(0deg) translateY(0px)',
          transition: tilt.active ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
        }}
      >
        {/* 3D Fénytükröződési sáv egérmozgásra */}
        <div
          className="absolute inset-0 bg-gradient-to-tr from-white/0 via-emerald-400/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ transform: 'translateZ(10px)' }}
        />

        <OddsSourceRibbon state={oddsState} />

        <div className="p-4 sm:p-5 pb-3">
          {/* Fejléc címke & Ligainfó */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-800 truncate">
              <span>{match.leagueFlag}</span>
              <span className="truncate">{match.leagueName}</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-emerald-400 font-bold">{formatKickoffShort(match)}</span>
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              <OddsSourceBadge
                state={oddsState}
                bookmakerName={bookmakerName}
                ttlMinutes={ttlMinutes}
              />
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border shrink-0 ${
                  idx === 0
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                #{idx + 1} TOP TIPP
              </span>
            </div>
          </div>

          {/* Csapatok logókkal (3D Mélység kiemelés) */}
          <div
            className="space-y-1.5 py-1.5 transition-transform"
            style={{ transform: 'translateZ(20px)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={match.homeTeam.logo}
                  alt={match.homeTeam.name}
                  className="w-5 h-5 object-contain shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="text-sm font-bold text-white group-hover:text-emerald-200 transition-colors truncate">
                  {match.homeTeam.name}
                </span>
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-500 shrink-0">
                Vár. gól {match.homeTeam.xgAvg}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={match.awayTeam.logo}
                  alt={match.awayTeam.name}
                  className="w-5 h-5 object-contain shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="text-sm font-bold text-slate-200 group-hover:text-emerald-200 transition-colors truncate">
                  {match.awayTeam.name}
                </span>
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-500 shrink-0">
                Vár. gól {match.awayTeam.xgAvg}
              </span>
            </div>
          </div>

          {/* Fő Tipp Box (3D Kiemelt mélység) */}
          <div
            className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-700/60 flex items-center justify-between gap-2 shadow-inner"
            style={{ transform: 'translateZ(25px)' }}
          >
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">
                MI Ajánlott Tipp
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-300 truncate block">
                {pick.marketLabel}
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">
                {isRealActive ? 'Bukméker odds' : isExpired ? 'Lejárt odds' : 'Szimulált odds'}
              </span>
              <span
                className={`text-base font-black px-2.5 py-0.5 rounded-lg border ${
                  isRealActive
                    ? 'text-emerald-300 bg-emerald-950/60 border-emerald-500/40 shadow-sm shadow-emerald-900/30'
                    : isExpired
                    ? 'text-red-300 bg-red-950/40 border-red-500/40 border-dotted line-through opacity-80'
                    : 'text-amber-300 bg-amber-950/40 border-amber-500/50 border-dashed'
                }`}
              >
                {pick.odds.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Valószínűség & Fair ár indikátor */}
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                {isMarketBased ? 'Piaci esély (de-vigelt):' : 'Becsült modell esély:'}
              </span>
              <span className="font-extrabold text-emerald-400">{pick.probability}%</span>
            </div>
            <div className="relative w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              {range && (
                <div
                  className="absolute top-0 h-full bg-emerald-300/30"
                  style={{ left: `${range.low}%`, width: `${Math.max(1, range.high - range.low)}%` }}
                  aria-hidden="true"
                />
              )}
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${pick.probability}%` }}
              />
            </div>
            {range && (
              <p
                className="text-[10px] text-slate-400 pt-0.5"
                title={`Ha a várható gólok (λ) ±${Math.round(range.relativeLambdaError * 100)}%-kal eltérnek a becsléstől, a piac esélye ebben a sávban mozog. Forgatókönyv-sáv, nem statisztikai konfidencia-intervallum.`}
              >
                Érzékenységi sáv: <span className="font-mono text-slate-200">{range.low}–{range.high}%</span>
              </p>
            )}
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
              <span>Implikált esély: {impliedProb}%</span>
              <span className={isRealActive && edge > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                {isRealActive
                  ? (pick.expectedValue > 0
                    ? `Ár-előny a piaci konszenzushoz (+EV): +${pick.expectedValue}%`
                    : edge > 0
                    ? `Modell/Piac rés: +${edge}%`
                    : `Fair szorzó: @${(100 / Math.max(1, pick.probability)).toFixed(2)}`)
                  : isExpired
                  ? 'Lejárt ár (Value letiltva)'
                  : 'Szimulált ár (Value letiltva)'}
              </span>
            </div>
          </div>

          <MarketGapChip match={match} />

          {/* Kvantitatív Robusztussági & Kelly sáv */}
          {match.quantAnalysis && (
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-1 gap-y-1 text-[10px] bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <span
                className={`flex items-center gap-1 font-bold ${
                  verdict === 'ROBUSZTUS'
                    ? 'text-emerald-400'
                    : verdict === 'valószínű'
                    ? 'text-teal-300'
                    : 'text-amber-400'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                {verdict}
              </span>
              <span className="text-slate-400 truncate" title={dq.description}>
                Adat: <strong className={dq.toneClass}>{dq.shortLabel}</strong>
              </span>
              <span className="text-slate-300 font-mono font-bold">
                {isRealActive && pick.quarterKellyPct && pick.quarterKellyPct > 0
                  ? `¼-Kelly: ${pick.quarterKellyPct}%`
                  : isExpired
                  ? 'Kelly: Letiltva (lejárt)'
                  : 'Kelly: Letiltva (szimulált)'}
              </span>
            </div>
          )}

          {/* AI Szöveges Indoklás */}
          <p className="mt-2.5 text-[11px] text-slate-300 leading-relaxed bg-mesh-dark p-2.5 rounded-lg border border-slate-800/80 line-clamp-2">
            &ldquo;{pick.reasoning}&rdquo;
          </p>
        </div>

        {/* Alsó gombsor */}
        <div className="p-3.5 pt-2 border-t border-slate-800/80 flex items-center gap-2">
          <button
            onClick={onAddToBetSlip}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isAdded
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Szelvényen
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                Szelvényhez
              </>
            )}
          </button>

          <button
            onClick={onSelectMatch}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
            title="Részletes adatok"
          >
            <span>Elemzés</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
