import React from 'react';
import {
  ShieldCheck,
  Calculator,
  Activity,
  Scale,
  Database,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface MethodologyViewProps {
  onGoToGrid: () => void;
  onGoToPicks: () => void;
}

export const MethodologyView: React.FC<MethodologyViewProps> = ({
  onGoToGrid,
  onGoToPicks,
}) => {
  return (
    <section className="py-6 sm:py-8 bg-[#070B14] w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Fejléc */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#0D1527] via-[#0F1A30] to-[#0D1527] border border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Intézményi Kvantitatív Elemzési Keretrendszer</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Módszertan &amp; Hőtérkép Segédlet
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Hogyan számolja a SoccerAI PRO a valószínűségeket, hogyan szűri ki a bukmékeri árrést és a hamis value fogadásokat.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onGoToPicks}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
            >
              🔥 Top Tippek
            </button>
            <button
              onClick={onGoToGrid}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              📊 Mérkőzés Rács
            </button>
          </div>
        </div>

        {/* 1. Valószínűségi Hőtérkép Színskála */}
        <div className="p-5 rounded-2xl bg-[#0D1527] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-white font-extrabold text-sm sm:text-base">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3>1. Valószínűségi Hőtérkép Színkódok</h3>
          </div>
          <p className="text-xs text-slate-400">
            A Mérkőzés Rácsban minden piaci cella (1X2, BTTS, Over 1.5/2.5/3.5, 1. félidő) a matematikai modell által számított százalékos esély alapján kap színkódot:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
              <div className="font-black text-base">65%+</div>
              <div className="font-bold mt-0.5">Kiemelt Szignál</div>
              <p className="text-[11px] text-emerald-200/80 mt-1">
                Kimagasló statisztikai valószínűség, erős modellbizalom.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300">
              <div className="font-black text-base">55 – 64%</div>
              <div className="font-bold mt-0.5">Erős Esély</div>
              <p className="text-[11px] text-teal-200/80 mt-1">
                Kedvező tendencia, jó odds esetén pozitív várható érték (+EV).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-700/40 border border-slate-600/40 text-slate-200">
              <div className="font-black text-base">45 – 54%</div>
              <div className="font-bold mt-0.5">Kiegyenlített</div>
              <p className="text-[11px] text-slate-300/80 mt-1">
                Kétesélyes piac, csak magas piaci szorzó mellett érdemes.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-800 text-slate-400">
              <div className="font-black text-base">35 – 44%</div>
              <div className="font-bold mt-0.5">Mérsékelt</div>
              <p className="text-[11px] text-slate-400/80 mt-1">
                Kisebb valószínűségű kimenetel (pl. döntetlenek).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-slate-500">
              <div className="font-black text-base">&lt; 35%</div>
              <div className="font-bold mt-0.5">Valószínűtlen</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Statisztikailag alacsony esélyű kimenetel (esélytelen fél).
              </p>
            </div>
          </div>
        </div>

        {/* 2. Kvantitatív Pillérek (4 kártya) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Dixon-Coles */}
          <div className="p-5 rounded-2xl bg-[#0D1527] border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
              <Calculator className="w-4 h-4" />
              <h4>2. Dixon–Coles (1997) Bivariáns Poisson Modell</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              A hagyományos független Poisson-eloszlás alulbecsüli a <strong>0–0, 1–0, 0–1 és 1–1</strong> eredmények gyakoriságát a modern labdarúgásban.
            </p>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 font-mono">
              τ(x, y) korrekció ρ = -0.13 korrelációs együtthatóval a 10×10-es gólmátrixon
            </div>
          </div>

          {/* Shin De-vigging */}
          <div className="p-5 rounded-2xl bg-[#0D1527] border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-sky-400 font-extrabold text-sm">
              <Scale className="w-4 h-4" />
              <h4>3. Shin (1992) De-vigging &amp; Bukmékeri Árrés</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              A bukmékerek nem egyenlő arányban terhelik az árrést (margin) a kimenetelekre: a nagy szorzós esélytelenekre (longshot bias) nagyobb árrést tesznek. A Shin-módszer ezt a torzítást szűri ki a valós piaci esélyek meghatározásához.
            </p>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 font-mono">
              Valódi piaci valószínűség vs. Modell valószínűség = Tiszta Érték (Edge %)
            </div>
          </div>

          {/* Robusztussági szűrő */}
          <div className="p-5 rounded-2xl bg-[#0D1527] border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
              <Activity className="w-4 h-4" />
              <h4>4. λ-rács Robusztussági Teszt &amp; λ-inverzió</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Minden tippet letesztelünk úgy is, hogy a várható gólokat (λ) ±10%-kal elmozdítjuk. Csak az a tipp kap <strong>ROBUSZTUS</strong> minősítést, amely még kedvezőtlen paraméter-eltolódás esetén is pozitív várható értéket (+2% feletti élt) tart fenn.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ✓ ROBUSZTUS: Min. él &gt; +2%
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                ~ valószínű: ≥80% pozitív rács
              </span>
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                ✗ ELVETVE: Túl érzékeny
              </span>
            </div>
          </div>

          {/* Negyed-Kelly & Adatminőség */}
          <div className="p-5 rounded-2xl bg-[#0D1527] border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-purple-400 font-extrabold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <h4>5. Negyed-Kelly Tétméretezés &amp; Adatminőség</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              A teljes Kelly-kritérium túl agresszív a sportfogadási varianciához. A SoccerAI <strong>Negyed-Kelly (0.25×)</strong> képletet alkalmaz a bankroll védelmére, és minden mérkőzést adatminőségi osztályba sorol:
            </p>
            <div className="grid grid-cols-3 gap-2 text-[10px] pt-1">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <strong className="text-emerald-400 block">A-szint</strong>
                <span className="text-slate-400">Top 5 európai liga &amp; BL</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <strong className="text-amber-400 block">B-szint</strong>
                <span className="text-slate-400">Championship, Eredivisie, NB I</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <strong className="text-slate-400 block">C-szint</strong>
                <span className="text-slate-500">Korlátozott minta, óvatos</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
