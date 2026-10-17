import React from 'react';
import { Match } from '../types/football';
import { CheckCircle2, XCircle, Award, TrendingUp, Calendar, ShieldCheck } from 'lucide-react';

interface ResultsViewProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ matches, onSelectMatch }) => {
  // Csak a befejezett meccsek
  const finished = matches.filter((m) => m.status === 'FINISHED');

  return (
    <div className="py-8 bg-[#070B14]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Fejléc és Eredmény Összesítő Kártya */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0F1D33] via-[#0D1527] to-[#0A101F] border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              <Award className="w-3.5 h-3.5" />
              <span>Verifikált Modell Teljesítmény</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Legutóbbi Találatok & Befejezett Mérkőzések
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              A modell által adott előrejelzések valós végeredményei és a kiemelt szignálok nyerési aránya.
            </p>
          </div>

          {/* Sikerességi mutató doboz */}
          <div className="flex items-center gap-4 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Tegnapi Sikeresség
              </span>
              <span className="text-3xl font-black text-emerald-400">83.3%</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-800" />
            <div className="text-xs text-slate-300 space-y-1">
              <div>🎯 <strong>5-ből 4</strong> erős szignál nyert</div>
              <div className="text-emerald-400 font-semibold">+18.4% ROI hozam</div>
            </div>
          </div>
        </div>

        {/* Eredmény kártyák listája */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {finished.map((match) => {
            const pick = match.aiPick;
            // Szimulált ellenőrzés a találatra: Tottenham nyert 3-1-re (1), Dortmund nyert 2-1-re (1), Genoa döntetlen 2-2 (X)
            const isWon = match.id === 'm-yest-1' || match.id === 'm-yest-2';

            return (
              <div
                key={match.id}
                onClick={() => onSelectMatch(match)}
                className="p-5 rounded-2xl bg-[#0D1527] border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-3 shadow-lg"
              >
                {/* Fejléc */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span>{match.leagueFlag}</span>
                    <span>{match.leagueName}</span>
                  </span>
                  <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">
                    LEZÁRULT
                  </span>
                </div>

                {/* Eredmény doboz */}
                <div className="py-2 flex items-center justify-between border-y border-slate-800/80">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <img src={match.homeTeam.logo} alt="" className="w-5 h-5 object-contain" />
                      <span className="text-sm font-bold text-white">{match.homeTeam.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <img src={match.awayTeam.logo} alt="" className="w-5 h-5 object-contain" />
                      <span className="text-sm font-medium text-slate-300">{match.awayTeam.name}</span>
                    </div>
                  </div>

                  <div className="text-right font-mono font-black text-xl text-amber-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                    <div>{match.homeScore}</div>
                    <div>{match.awayScore}</div>
                  </div>
                </div>

                {/* MI Tipp értékelése */}
                {pick && (
                  <div
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      isWon
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-red-500/10 border-red-500/30 text-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {isWon ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <div>
                        <span className="text-[10px] uppercase font-bold block opacity-80">
                          {isWon ? 'NYERTES TIPP' : 'NEM JÖTT BE'}
                        </span>
                        <span className="font-extrabold">{pick.marketLabel}</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-sm bg-slate-900 px-2 py-0.5 rounded">
                      @{pick.odds.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
