import React from 'react';
import {
  X,
  Info,
  ExternalLink,
  GitBranch,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Trophy,
  ShieldAlert,
  Globe,
} from 'lucide-react';
import { Logo } from './Logo';
import { CURRENT_RELEASE_INFO, APP_GITHUB_REPO, APP_GITHUB_RELEASES } from '../version';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-mesh-modal border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Fejléc */}
        <div className="p-4 sm:p-5 bg-mesh-header border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-white text-base">Alkalmazás Névjegy &amp; Rendszerinfó</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Bezárás"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Test tartalom */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          
          {/* Logo & Verzió kártya */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900/60 border border-amber-500/30">
            <Logo size={56} className="shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-white tracking-tight">
                  Soccer<span className="text-amber-400">AI</span>
                </span>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  PRO
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/40">
                  v{CURRENT_RELEASE_INFO.version}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Kvantitatív Futball Statisztikák, Esélyek &amp; Predikciók
              </p>
            </div>
          </div>

          {/* Rendszer Állapot & Verzióadatok */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-slate-400 text-[11px] flex items-center gap-1.5 mb-1">
                <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                <span>Kiadási Verzió (SemVer)</span>
              </div>
              <div className="font-mono font-bold text-white text-sm">
                {CURRENT_RELEASE_INFO.tag}
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Legfrissebb stabil kiadás
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-slate-400 text-[11px] flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Kiadás Dátuma</span>
              </div>
              <div className="font-mono font-bold text-white text-sm">
                {CURRENT_RELEASE_INFO.releaseDate}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Produkciós környezetben
              </div>
            </div>
          </div>

          {/* Platform Leírás & Kvantitatív Háttér */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Platform Leírás &amp; Modellezés</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Kvantitatív labdarúgó analitikai és predikciós platform. Dixon-Coles korrigált Poisson modellezés, Shin (1992) de-vigging bukméker árrés szűrés és negyed-Kelly tétméretezés a fegyelmezett, adatvezérelt sportelemzéshez.
            </p>
          </div>

          {/* Főbb funkciók és újdonságok ebben a verzióban */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>A v{CURRENT_RELEASE_INFO.version} kiadás újdonságai:</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {CURRENT_RELEASE_INFO.highlights.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">&bull;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Lefedett Bajnokságok */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Lefedett Bajnokságok</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-sm">🏴󠁧󠁢󠁥󠁮󠁧󠁿</span>
                <span>Premier League &amp; Championship</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-sm">🇪🇸</span>
                <span>La Liga (Spanyolország)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-sm">🇮🇹</span>
                <span>Serie A (Olaszország)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-sm">🇩🇪</span>
                <span>Bundesliga (Németország)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-sm">🇫🇷</span>
                <span>Ligue 1 (Franciaország)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-sm">🏆</span>
                <span>Bajnokok Ligája, UEL &amp; Eredivisie</span>
              </div>
            </div>
          </div>

          {/* Felelős Játék & Módszertani Figyelmeztetés 18+ */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Felelős Játék &amp; Módszertan (18+)</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              A rendszer statisztikai valószínűségeket és matematikai várható értékeket (Expected Value) számol. Nem garantál 100%-os biztos nyereményt. Fogadj mindig felelősségteljesen és bankroll-menedzsmenttel! (18+)
            </p>
          </div>

          {/* Kvantitatív motor minősítés */}
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Matematikai Biztonsági Szűrők:</strong> Dixon–Coles bivariáns korrekció, Shin (1992) bukmékeri árrés de-vigging, és negyed-Kelly tétméretezés a fals értékek kizárásáért.
            </div>
          </div>

          {/* Rendszer Integrációk & Fejlesztői adatok */}
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex flex-wrap items-center gap-3 text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-brand-400" />
                Élő Football-Data.org API Integráció
              </span>
              <span>&bull;</span>
              <span>Poisson Gólmodell</span>
              <span>&bull;</span>
              <span>Magyar Nyelvű Fejlesztés</span>
            </div>
            <div className="text-slate-500 text-[10px] pt-1">
              &copy; 2026 SoccerAI PRO &bull; Minden jog fenntartva.
            </div>
          </div>

        </div>

        {/* Lábléc gombok & Külső linkek */}
        <div className="p-4 bg-mesh-header border-t border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <a
              href={APP_GITHUB_RELEASES}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>GitHub Release Notes</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={APP_GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-slate-400 hover:text-white font-medium flex items-center gap-1 transition-colors hidden sm:flex"
            >
              <span>Forráskód</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Bezárás
          </button>
        </div>

      </div>
    </div>
  );
};
