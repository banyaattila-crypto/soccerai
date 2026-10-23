import React, { useState, useMemo } from 'react';
import { Match } from '../types/football';
import { generateMatchExplanation } from '../services/matchExplanationService';
import {
  Sparkles,
  BookOpen,
  TrendingUp,
  Target,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Activity,
  Flame,
  Award,
} from 'lucide-react';

interface MatchExplanationCardProps {
  match: Match;
  realOddsActive?: boolean;
}

export const MatchExplanationCard: React.FC<MatchExplanationCardProps> = ({
  match,
  realOddsActive = false,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const explanation = useMemo(() => generateMatchExplanation(match), [match]);

  const defaultPick = match.aiPick || {
    marketLabel: `${match.homeTeam.shortName || match.homeTeam.name} Győzelem (1)`,
    market: '1',
    odds: match.odds.home,
    probability: match.probabilities.homeWin,
    confidence: 7,
    reasoning: 'Alapértelmezett modell predikció',
  };

  const getRiskColor = (level: 'Alacsony' | 'Közepes' | 'Magas') => {
    switch (level) {
      case 'Alacsony':
        return 'text-brand-400 bg-brand-500/15 border-brand-500/30';
      case 'Magas':
        return 'text-rose-400 bg-rose-500/15 border-rose-500/30';
      case 'Közepes':
      default:
        return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900/95 via-[#0A1224] to-[#070D1B] border border-amber-500/30 shadow-xl overflow-hidden space-y-4 p-4 sm:p-5 text-slate-200">
      
      {/* 1. Fejléc: Címke és Bizalmi Index */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
              <span>Szakértői Elemzés &amp; Meccs Magyarázat</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </div>
            <div className="text-[10px] text-slate-400">
              Automatikus taktikai és statisztikai elemzés a fogadáshoz
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRiskColor(
              explanation.riskAssessment.level
            )}`}
          >
            {explanation.riskAssessment.level} kockázat
          </span>
          <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            Bizalom: {defaultPick.confidence || 7}/10
          </span>
        </div>
      </div>

      {/* 2. Fő Narratíva & Címsor */}
      <div className="space-y-2">
        <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug tracking-tight">
          {explanation.headline}
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
          {explanation.summary}
        </p>
      </div>

      {/* 3. Négy Kulcstényező Kártya (Key Factors Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {explanation.keyFactors.map((factor, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/90 flex items-start gap-2.5"
          >
            <div className="p-1.5 rounded-lg bg-slate-900 text-amber-400 border border-slate-800 shrink-0 mt-0.5">
              {factor.icon === 'trend' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
              {factor.icon === 'goal' && <Flame className="w-4 h-4 text-amber-400" />}
              {factor.icon === 'target' && <Target className="w-4 h-4 text-blue-400" />}
              {factor.icon === 'shield' && <ShieldCheck className="w-4 h-4 text-indigo-400" />}
            </div>
            <div className="space-y-0.5 text-xs">
              <div className="font-bold text-slate-200">{factor.title}</div>
              <div className="text-[11px] text-slate-400 leading-relaxed">{factor.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Részletes Elemző Blokkok */}
      <div className="space-y-2.5 pt-1 text-xs">
        
        {/* Csapatdinamika & Forma */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5 text-brand-400">
            <Activity className="w-3.5 h-3.5" />
            <span>Csapatdinamika, Helyezés &amp; Múltbéli Mérleg</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">
            {explanation.teamDynamics}
          </p>
        </div>

        {/* Gólszám & Játékstílus */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5 text-amber-400">
            <Flame className="w-3.5 h-3.5" />
            <span>Gólvárás &amp; Taktikai Játékstílus (gólmodell)</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">
            {explanation.goalExpectation}
          </p>
        </div>

        {/* Kiemelt Tipp Részletes Indoklása */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-brand-500/10 border border-amber-500/30 space-y-1.5">
          <div className="font-extrabold text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            <span>Miért ezt a tippet választotta az algoritmus?</span>
          </div>
          <p className="text-slate-200 leading-relaxed text-xs">
            {explanation.pickRationale}
          </p>
          <div className="flex flex-wrap items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/80 gap-2">
            <span className="text-slate-400">
              Kiemelt ajánlás: <strong className="text-white">{defaultPick.marketLabel}</strong>
            </span>
            <span className="font-mono font-bold text-amber-300">
              {!realOddsActive && match.aiPick?.isSimulatedOdds !== false ? 'Becsült odds' : 'Odds'}:{' '}
              {defaultPick.odds.toFixed(2)} &bull; {defaultPick.probability}% esély
            </span>
          </div>
        </div>

        {/* Kockázati összefoglaló */}
        <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/70 space-y-1">
          <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5 text-rose-400">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{explanation.riskAssessment.label}</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            {explanation.riskAssessment.description}
          </p>
        </div>

      </div>

      {/* 5. Opcionálisan lenyitható Kvantitatív Diagnosztika */}
      {match.aiPick?.reasoning && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full py-1.5 px-3 rounded-lg bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-slate-200 text-[11px] font-semibold flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Matematikai λ-rács és diagnosztikai napló</span>
            </span>
            {showTechnicalDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showTechnicalDetails && (
            <div className="mt-2 p-3 rounded-lg bg-slate-950/90 border border-slate-800 font-mono text-[10px] text-slate-300 leading-relaxed space-y-1 animate-fade-in">
              <div className="text-amber-400 font-bold">Algoritmus Diagnosztika:</div>
              <div>{match.aiPick.reasoning}</div>
              {match.quantAnalysis && (
                <div className="text-slate-500 pt-1 border-t border-slate-800 text-[9px]">
                  Shin Vig: {match.quantAnalysis.shinMargin}% | Stabilitás: {match.quantAnalysis.posPct}% | Verdit: {match.quantAnalysis.robustnessVerdict}
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
