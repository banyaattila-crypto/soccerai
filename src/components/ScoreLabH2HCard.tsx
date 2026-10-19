import React from 'react';
import { Match } from '../types/football';
import { getTeamComparisonStats } from '../services/scoreLabService';
import {
  History,
  TrendingUp,
  Shield,
  Swords,
  Activity,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface ScoreLabH2HCardProps {
  match: Match;
}

export const ScoreLabH2HCard: React.FC<ScoreLabH2HCardProps> = ({ match }) => {
  const stats = getTeamComparisonStats(match);
  const { home, away, h2h, modelVerdict } = stats;

  // xG és mutatók arányos szélességének számítása
  const totalXg = Math.max(0.1, home.xg + away.xg);
  const homeXgPct = Math.round((home.xg / totalXg) * 100);
  const awayXgPct = 100 - homeXgPct;

  const totalAttack = Math.max(0.1, home.attackRating + away.attackRating);
  const homeAttackPct = Math.round((home.attackRating / totalAttack) * 100);
  const awayAttackPct = 100 - homeAttackPct;

  // Védelemnél az alacsonyabb a jobb, így inverz arány a vizualizációhoz
  const invHomeDef = 1 / Math.max(0.2, home.defenseRating);
  const invAwayDef = 1 / Math.max(0.2, away.defenseRating);
  const totalDef = invHomeDef + invAwayDef;
  const homeDefPct = Math.round((invHomeDef / totalDef) * 100);
  const awayDefPct = 100 - homeDefPct;

  return (
    <div className="space-y-4 animate-fade-in text-slate-200">
      
      {/* 1. Felső Modell Értékelés Kártya */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-[#0B1528] border border-amber-500/30 flex items-center justify-between gap-3 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-amber-500/20 text-amber-400">
              <Swords className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              {modelVerdict.advantageTitle}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {modelVerdict.keyInsight}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] text-slate-400 block font-mono">Modell becslés</span>
          <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
            {match.probabilities.homeWin}% - {match.probabilities.draw}% - {match.probabilities.awayWin}%
          </span>
        </div>
      </div>

      {/* 2. Forma és Momentum Összehasonlítás */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <span className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Forma &amp; Momentum (Utolsó 5 Mérkőzés)
          </span>
          <span className="text-[11px] text-slate-400">
            Győzelem = 3p &bull; Döntetlen = 1p
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Hazai Forma */}
          <div className="space-y-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white truncate">{home.shortName}</span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {home.formPoints}/15p <span className="text-[10px] text-slate-400">({home.formPct}%)</span>
              </span>
            </div>
            <div className="flex gap-1.5">
              {home.form.map((res, i) => (
                <span
                  key={i}
                  className={`flex-1 py-1 text-center rounded text-[10px] font-extrabold ${
                    res === 'W'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : res === 'D'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-red-500/20 text-red-300 border border-red-500/40'
                  }`}
                >
                  {res}
                </span>
              ))}
            </div>
          </div>

          {/* Vendég Forma */}
          <div className="space-y-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white truncate">{away.shortName}</span>
              <span className="text-xs font-mono font-bold text-teal-400">
                {away.formPoints}/15p <span className="text-[10px] text-slate-400">({away.formPct}%)</span>
              </span>
            </div>
            <div className="flex gap-1.5">
              {away.form.map((res, i) => (
                <span
                  key={i}
                  className={`flex-1 py-1 text-center rounded text-[10px] font-extrabold ${
                    res === 'W'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : res === 'D'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-red-500/20 text-red-300 border border-red-500/40'
                  }`}
                >
                  {res}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Kétoldalas Összehasonlító Statisztikai Sávok */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <span className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
            <Activity className="w-4 h-4 text-blue-400" />
            Dinamikus Mutatók Összevetése
          </span>
          <div className="flex items-center gap-3 text-[11px] font-bold">
            <span className="text-emerald-400">{home.shortName}</span>
            <span className="text-slate-600">vs</span>
            <span className="text-teal-400">{away.shortName}</span>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {/* xG Összehasonlítás */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-emerald-400 font-bold">{home.xg.toFixed(2)} xG</span>
              <span className="text-slate-400 font-semibold uppercase">Várható gólok (xG)</span>
              <span className="text-teal-400 font-bold">{away.xg.toFixed(2)} xG</span>
            </div>
            <div className="h-2 rounded-full bg-slate-950 overflow-hidden flex border border-slate-800">
              <div
                style={{ width: `${homeXgPct}%` }}
                className="bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
              />
              <div
                style={{ width: `${awayXgPct}%` }}
                className="bg-gradient-to-l from-teal-600 to-teal-400 transition-all duration-500"
              />
            </div>
          </div>

          {/* Támadóerő (Alpha) */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-emerald-400 font-bold">{home.attackRating.toFixed(2)} α</span>
              <span className="text-slate-400 font-semibold uppercase">Támadási Erősség</span>
              <span className="text-teal-400 font-bold">{away.attackRating.toFixed(2)} α</span>
            </div>
            <div className="h-2 rounded-full bg-slate-950 overflow-hidden flex border border-slate-800">
              <div
                style={{ width: `${homeAttackPct}%` }}
                className="bg-emerald-500/80 transition-all duration-500"
              />
              <div
                style={{ width: `${awayAttackPct}%` }}
                className="bg-teal-500/80 transition-all duration-500"
              />
            </div>
          </div>

          {/* Védelmi Stabilitás (Beta - alacsonyabb a jobb) */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {home.defenseRating.toFixed(2)} β
              </span>
              <span className="text-slate-400 font-semibold uppercase">Védelmi Stabilitás</span>
              <span className="text-teal-400 font-bold flex items-center gap-1">
                {away.defenseRating.toFixed(2)} β
                <Shield className="w-3 h-3" />
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-950 overflow-hidden flex border border-slate-800">
              <div
                style={{ width: `${homeDefPct}%` }}
                className="bg-emerald-400/70 transition-all duration-500"
              />
              <div
                style={{ width: `${awayDefPct}%` }}
                className="bg-teal-400/70 transition-all duration-500"
              />
            </div>
          </div>

          {/* Gólátlagok összevetése */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-center">
            <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Lőtt gól átlag / meccs</span>
              <span className="text-sm font-mono font-bold text-white">
                <span className="text-emerald-400">{home.goalsScoredAvg.toFixed(1)}</span>
                <span className="text-slate-600 mx-1.5">:</span>
                <span className="text-teal-400">{away.goalsScoredAvg.toFixed(1)}</span>
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Kapott gól átlag / meccs</span>
              <span className="text-sm font-mono font-bold text-white">
                <span className="text-emerald-400">{home.goalsConcededAvg.toFixed(1)}</span>
                <span className="text-slate-600 mx-1.5">:</span>
                <span className="text-teal-400">{away.goalsConcededAvg.toFixed(1)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Egymás Elleni Múlt (H2H) */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <span className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
            <History className="w-4 h-4 text-amber-400" />
            Egymás Elleni Múlt (Head-to-Head)
          </span>
          <span className="text-[11px] text-slate-400">
            {h2h.hasHistory ? `${h2h.totalMatches} rögzített találkozó` : 'Szezonbeli modell'}
          </span>
        </div>

        {h2h.hasHistory ? (
          <div className="space-y-3">
            {/* KPI mérleg */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold truncate">{home.shortName} Nyert</span>
                <span className="text-sm font-black text-emerald-400">{h2h.homeWins}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold">Döntetlen</span>
                <span className="text-sm font-black text-slate-300">{h2h.draws}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold truncate">{away.shortName} Nyert</span>
                <span className="text-sm font-black text-teal-400">{h2h.awayWins}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 col-span-1 sm:col-span-1">
                <span className="text-[10px] text-slate-400 block font-bold">H2H Gólátlag</span>
                <span className="text-sm font-black text-amber-400">{h2h.avgTotalGoals}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 block font-bold">BTTS Arány</span>
                <span className="text-sm font-black text-amber-300">{h2h.bttsPct}%</span>
              </div>
            </div>

            {/* Korábbi meccsek listája */}
            <div className="space-y-1.5 pt-1">
              {h2h.matches.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/50 hover:bg-slate-950/80 border border-slate-800/70 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{m.date}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`font-semibold ${m.winner === 'home' ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                      {home.name}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono font-extrabold text-amber-300">
                      {m.homeScore} - {m.awayScore}
                    </span>
                    <span className={`font-semibold ${m.winner === 'away' ? 'text-teal-400 font-bold' : 'text-slate-300'}`}>
                      {away.name}
                    </span>
                  </div>

                  <div className="text-[10px] font-mono">
                    {m.winner === 'home' ? (
                      <span className="text-emerald-400 font-bold">1 (Hazai)</span>
                    ) : m.winner === 'away' ? (
                      <span className="text-teal-400 font-bold">2 (Vendég)</span>
                    ) : (
                      <span className="text-slate-400">X (Döntetlen)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>Közvetlen korábbi találkozó még nem rögzített a szezonban</span>
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              A csapatok várható kimenetelét és gólmennyiségét a szezonbeli valós Dixon-Coles MLE paraméterek és az aktuális bajnoki forma alapján számítjuk ki.
            </p>
            <div className="pt-2 flex justify-center gap-4 text-xs font-mono">
              <span className="text-slate-300">
                Becsült össz-gól: <strong className="text-amber-400">{h2h.avgTotalGoals}</strong>
              </span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-slate-300">
                BTTS esély: <strong className="text-amber-300">{h2h.bttsPct}%</strong>
              </span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
