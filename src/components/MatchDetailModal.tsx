import React from 'react';
import { Match, BetSlipItem } from '../types/football';
import { X, Sparkles, TrendingUp, ShieldCheck, MapPin, CloudSun, Plus, Check } from 'lucide-react';
import { getProbabilityColorClass } from '../services/predictionEngine';

interface MatchDetailModalProps {
  match: Match | null;
  onClose: () => void;
  onAddToBetSlip: (item: BetSlipItem) => void;
  betSlipItems: BetSlipItem[];
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  match,
  onClose,
  onAddToBetSlip,
  betSlipItems,
}) => {
  if (!match) return null;

  const p = match.probabilities;
  const isFinished = match.status === 'FINISHED';

  // Szelvény állapota a fő tippre
  const defaultPick = match.aiPick || {
    marketLabel: `${match.homeTeam.name} Győzelem (1)`,
    odds: match.odds.home,
    probability: p.homeWin,
  };

  const isAdded = betSlipItems.some(
    (item) => item.matchId === match.id && item.marketLabel === defaultPick.marketLabel
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0D1527] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Modál Fejléc */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0F1A30] to-[#0A101F] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{match.leagueFlag}</span>
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                {match.leagueName} &bull; {match.leagueCountry}
              </div>
              <div className="text-xs text-slate-400">
                {match.kickoffDate} &bull; Kezdés: <strong className="text-white">{match.kickoffTime}</strong>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Görgethető tartalom */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Csapatok összecsapása */}
          <div className="grid grid-cols-7 items-center bg-[#070B14]/80 p-4 rounded-xl border border-slate-800">
            {/* Hazai */}
            <div className="col-span-3 text-center space-y-1.5">
              <img
                src={match.homeTeam.logo}
                alt={match.homeTeam.name}
                className="w-12 h-12 object-contain mx-auto"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="font-extrabold text-sm text-white">{match.homeTeam.name}</div>
              <div className="text-[11px] text-slate-400">
                {match.homeTeam.rank ? `${match.homeTeam.rank}. hely` : 'Hazai'}
              </div>
              {/* Forma pöttyök */}
              <div className="flex justify-center gap-1 pt-1">
                {match.homeTeam.form?.map((f, i) => (
                  <span
                    key={i}
                    className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center ${
                      f === 'W'
                        ? 'bg-emerald-500 text-slate-950'
                        : f === 'D'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* VS vagy Eredmény */}
            <div className="col-span-1 text-center">
              {isFinished ? (
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {match.homeScore} : {match.awayScore}
                </div>
              ) : (
                <div className="text-xs font-extrabold text-slate-500 bg-slate-900 py-1 px-2 rounded-md border border-slate-800 inline-block">
                  VS
                </div>
              )}
            </div>

            {/* Vendég */}
            <div className="col-span-3 text-center space-y-1.5">
              <img
                src={match.awayTeam.logo}
                alt={match.awayTeam.name}
                className="w-12 h-12 object-contain mx-auto"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="font-extrabold text-sm text-white">{match.awayTeam.name}</div>
              <div className="text-[11px] text-slate-400">
                {match.awayTeam.rank ? `${match.awayTeam.rank}. hely` : 'Vendég'}
              </div>
              {/* Forma pöttyök */}
              <div className="flex justify-center gap-1 pt-1">
                {match.awayTeam.form?.map((f, i) => (
                  <span
                    key={i}
                    className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center ${
                      f === 'W'
                        ? 'bg-emerald-500 text-slate-950'
                        : f === 'D'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* AI Elemzői összefoglaló kártya */}
          {match.aiPick && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-[#0A101F] border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  MI Predikciós Értékelés
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Bizalom: {match.aiPick.confidence}/10
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {match.aiPick.reasoning}
              </p>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                <span className="text-slate-400">
                  Kiemelt tipp: <strong className="text-white">{match.aiPick.marketLabel}</strong>
                </span>
                <span className="text-amber-300 font-bold">Odds: {match.aiPick.odds.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Kvantitatív Modellezés & Szűrők (Dixon-Coles & Shin) */}
          {match.quantAnalysis && (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Kvantitatív Modellezés (Dixon-Coles &amp; Shin de-vig)
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                    match.quantAnalysis.robustnessVerdict === 'ROBUSZTUS'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                  }`}
                >
                  {match.quantAnalysis.robustnessVerdict}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Adatminőség</span>
                  <span className="text-sm font-black text-white">{match.quantAnalysis.dataQuality}-szint</span>
                  <span className="text-[9px] text-slate-500 block">Több forrásból</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Bukméker Vig</span>
                  <span className="text-sm font-black text-amber-400">{match.quantAnalysis.shinMargin}%</span>
                  <span className="text-[9px] text-slate-500 block">Shin de-vig margin</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Rács Pozitív Él</span>
                  <span className="text-sm font-black text-emerald-400">{match.quantAnalysis.posPct}%</span>
                  <span className="text-[9px] text-slate-500 block">λ-rács szűrő</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Negyed-Kelly Tét</span>
                  <span className="text-sm font-black text-amber-300">{match.quantAnalysis.quarterKellyPct}%</span>
                  <span className="text-[9px] text-slate-500 block">Max. tőkeallokáció</span>
                </div>
              </div>

              {match.quantAnalysis.lambdaInversion && (
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between text-slate-300 gap-1">
                  <span>
                    <strong>λ-inverzió:</strong> Piaci gólvárakozás:{' '}
                    <strong className="text-white">
                      {match.quantAnalysis.lambdaInversion.marketLambda}
                    </strong>{' '}
                    gól/meccs
                  </span>
                  <span className="text-emerald-400 font-semibold">
                    {match.quantAnalysis.lambdaInversion.verdict}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 1X2 Valószínűségi megoszlás grafikon */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>1X2 Végeredmény Esélyek</span>
              <span className="text-[10px] text-slate-500">Modell becslés</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Hazai (1)</div>
                <div className="text-base font-extrabold text-emerald-400">{p.homeWin}%</div>
                <div className="text-[10px] text-slate-500 font-mono">Odds: {match.odds.home.toFixed(2)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Döntetlen (X)</div>
                <div className="text-base font-extrabold text-slate-300">{p.draw}%</div>
                <div className="text-[10px] text-slate-500 font-mono">Odds: {match.odds.draw.toFixed(2)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Vendég (2)</div>
                <div className="text-base font-extrabold text-teal-400">{p.awayWin}%</div>
                <div className="text-[10px] text-slate-500 font-mono">Odds: {match.odds.away.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Gólpiacok statisztikái */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Gólpiacok & Valószínűségek
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">BTTS (Mindkettő gól)</span>
                <span className="text-sm font-bold text-white">{p.bttsYes}%</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">&gt; 1.5 Gól</span>
                <span className="text-sm font-bold text-white">{p.over15}%</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">&gt; 2.5 Gól</span>
                <span className="text-sm font-bold text-white">{p.over25}%</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">1.F &gt; 0.5 Gól</span>
                <span className="text-sm font-bold text-white">{p.fhOver05}%</span>
              </div>
            </div>
          </div>

          {/* További meccsadatok: Helyszín, időjárás */}
          {(match.venue || match.weather) && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              {match.venue && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{match.venue}</span>
                </div>
              )}
              {match.weather && (
                <div className="flex items-center gap-1.5">
                  <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                  <span>{match.weather}</span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modál lábléc / Akció gomb */}
        <div className="p-4 bg-[#0A101F] border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Bezárás
          </button>

          <button
            onClick={() => {
              onAddToBetSlip({
                matchId: match.id,
                matchTitle: `${match.homeTeam.name} - ${match.awayTeam.name}`,
                marketLabel: defaultPick.marketLabel,
                odds: defaultPick.odds,
                probability: defaultPick.probability,
              });
            }}
            className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              isAdded
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4" />
                Hozzáadva a szelvényhez
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Kiemelt tipp hozzáadása a szelvényhez
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
