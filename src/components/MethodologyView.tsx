import React, { useMemo } from 'react';
import {
  ShieldCheck,
  Calculator,
  Activity,
  Scale,
  Layers,
  Sparkles,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  FlaskConical,
  Zap,
} from 'lucide-react';
import { runChronologicalCalibrationAudit } from '../services/calibrationService';

interface MethodologyViewProps {
  onGoToGrid: () => void;
  onGoToPicks: () => void;
}

export const MethodologyView: React.FC<MethodologyViewProps> = ({
  onGoToGrid,
  onGoToPicks,
}) => {
  const auditReport = useMemo(() => {
    return runChronologicalCalibrationAudit();
  }, []);

  const { calibration, performance, verdict } = auditReport;
  return (
    <section className="py-6 sm:py-8 bg-transparent w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Fejléc */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-mesh-card border border-slate-800">
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
        <div className="p-5 rounded-2xl bg-mesh-card border border-slate-800 space-y-4">
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
          <div className="p-5 rounded-2xl bg-mesh-card border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
              <Calculator className="w-4 h-4" />
              <h4>2. Dixon–Coles (1997) Bivariáns Poisson &amp; MLE Illesztés</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              A csapatok várható góljait (xG) a szezonban már lejátszott mérkőzésekből, <strong>Maximum Likelihood Estimation (MLE)</strong> és időbeli súlyozás segítségével számoljuk ki. Minden csapat egyedi támadóerővel (α) és védelmi gyengeséggel (β) rendelkezik, korrigálva az alacsony gólszámú (0–0, 1–0, 0–1, 1–1) τ(x,y) összefüggésekkel (ρ = -0.13).
            </p>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 font-mono">
              λ_hazai = α_hazai · β_vendég · γ | μ_vendég = α_vendég · β_hazai
            </div>
          </div>

          {/* Shin De-vigging */}
          <div className="p-5 rounded-2xl bg-mesh-card border border-slate-800 space-y-2.5">
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
          <div className="p-5 rounded-2xl bg-mesh-card border border-slate-800 space-y-2.5">
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
          <div className="p-5 rounded-2xl bg-mesh-card border border-slate-800 space-y-2.5">
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

          {/* 6. Időrendhelyes Kalibráció, Brier-Pontszám & Piaci Él Hitelesítés */}
          <div className="p-5 rounded-2xl bg-mesh-card border border-slate-800 space-y-4 md:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-base">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                <h4>6. Időrendhelyes Kalibráció, Brier Score &amp; Piaci Él Hitelesítés</h4>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                Vágási dátum (T_split): <strong className="text-white">{auditReport.splitDate}</strong>
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              A pénzügyi és sportfogadási kvantitatív modellezés alapszabálya: <strong>nem létezik igazolt piaci előny időrendhelyes (chronological walk-forward), szigorúan elkülönített out-of-sample tesztelés nélkül</strong>. A véletlenszerű keresztvalidáció adatcsorgást (lookahead bias) okoz. A modell predikcióit valós időrendi szekvenciában vetjük össze a záró oddsokkal (CLV) és a tényleges kimenetelekkel.
            </p>

            {/* Döntési kapu sáv: Szigorú előny-hitelesítés */}
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                verdict.hasProvenEdge
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="flex items-start gap-3">
                {verdict.hasProvenEdge ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <h5 className="font-extrabold text-sm">{verdict.verdictTitle}</h5>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                    {verdict.verdictDescription}
                  </p>
                  <p className="text-[11px] font-mono font-bold pt-1 opacity-90">
                    {verdict.claimStatusDisclaimer}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Mintaméret Haladás
                </span>
                <span className="text-sm font-black text-amber-400">
                  {auditReport.outOfSampleCount} / {verdict.requiredSampleSize} meccs
                </span>
                <div className="w-24 bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full"
                    style={{ width: `${verdict.sampleSufficiencyPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Fő Kalibrációs és Statisztikai Mutatók Rács */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {/* Brier Score */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  1X2 Brier-Pontszám
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-xl font-black text-white">{calibration.brierScore}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    (bázis: {calibration.naiveBrierScore})
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 block mt-1 font-semibold">
                  BSS: +{(calibration.brierSkillScore * 100).toFixed(1)}% hozzáadott érték
                </span>
              </div>

              {/* Várható Kalibrációs Hiba (ECE) */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Kalibrációs Hiba (ECE)
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-xl font-black text-amber-400">
                    {(calibration.expectedCalibrationError * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    (max: {(calibration.maxCalibrationError * 100).toFixed(1)}%)
                  </span>
                </div>
                <span className="text-[10px] text-slate-300 block mt-1">
                  Státusz: <strong className="text-teal-300">{calibration.calibrationVerdict}</strong>
                </span>
              </div>

              {/* Out-of-Sample ROI */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Out-of-Sample Realizált ROI
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span
                    className={`text-xl font-black ${
                      performance.flatStakeRoiPct >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {performance.flatStakeRoiPct > 0 ? `+${performance.flatStakeRoiPct}%` : `${performance.flatStakeRoiPct}%`}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    (fix tét)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Negyed-Kelly ROI: <strong className="text-white">{performance.quarterKellyRoiPct > 0 ? `+${performance.quarterKellyRoiPct}%` : `${performance.quarterKellyRoiPct}%`}</strong>
                </span>
              </div>

              {/* Statisztikai Szignifikancia (Z-score & p-érték) */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Szignifikancia (H₀: Él ≤ 0)
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-xl font-black text-sky-400">p = {performance.pValue}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    (Z = {performance.zScore})
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  95% CI: [{performance.confidenceInterval95[0]}%, {performance.confidenceInterval95[1]}%]
                </span>
              </div>
            </div>

            {/* Megbízhatósági diagram (Reliability Table) */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-white block">
                Valószínűségi Megbízhatósági Görbe (Reliability Table)
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left border border-slate-800 rounded-xl overflow-hidden">
                  <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Esély Sáv</th>
                      <th className="p-2.5">Elemszám (N)</th>
                      <th className="p-2.5">Átlagos Modell Esély</th>
                      <th className="p-2.5">Tényleges Találat</th>
                      <th className="p-2.5">Eltérés (|Gap|)</th>
                      <th className="p-2.5 text-right">Kalibrált?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
                    {calibration.reliabilityBins.map((b, i) => (
                      <tr key={i} className="hover:bg-slate-900/50">
                        <td className="p-2.5 font-bold text-white">{b.binLabel}</td>
                        <td className="p-2.5 font-mono text-slate-300">{b.count} meccs</td>
                        <td className="p-2.5 font-mono text-emerald-400 font-bold">{b.avgPredictedProb}%</td>
                        <td className="p-2.5 font-mono text-white font-bold">{b.observedHitRate}%</td>
                        <td className="p-2.5 font-mono text-slate-300">
                          {b.count > 0 ? `${b.calibrationGap}%` : '—'}
                        </td>
                        <td className="p-2.5 text-right">
                          {b.count === 0 ? (
                            <span className="text-slate-500 text-[10px]">N/A</span>
                          ) : b.isWellCalibrated ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              ✓ Pontos
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              Eltérés
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 7. Szimulált Odds vs. Bukméker Odds: Kockázatkezelés és Anti-Fake Value Etika */}
          <div className="p-5 rounded-2xl bg-mesh-card border border-slate-800 space-y-4 md:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sky-400 font-extrabold text-base">
                <FlaskConical className="w-5 h-5 text-sky-400" />
                <h4>7. 🧪 Szimulált Odds vs. 🎯 Bukméker Odds: Kockázatkezelés &amp; Anti-Fake Value Etika</h4>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-bold">
                Anti-Fake Value Védelem Aktív
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Gyakori kérdés a sportfogadók részéről: <em>„A Napi Top Tippekben mit jelent a Szimulált?! Akkor nem valós fogadható adatok?!!”</em>
              <br className="hidden sm:inline" />
              A válasz határozott: <strong>A mérkőzések, a csapatok, a kezdési időpontok és a modell által számolt valószínűségek 100%-ban valósak!</strong> A jelölés kizárólag a <strong>megjelenített szorzó (odds) forrására</strong> utal, és a SoccerAI PRO egyik legfontosabb beépített biztonsági és tőkévédelmi fékrendszere.
            </p>

            {/* Összehasonlító táblázat */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-bold text-white block">
                Összehasonlítás: Szimulált vs. Valós Bukmékeri Odds
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-slate-800 rounded-xl overflow-hidden">
                  <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Tulajdonság</th>
                      <th className="p-2.5 text-amber-300">🧪 Szimulált Odds</th>
                      <th className="p-2.5 text-emerald-400">🎯 Bukméker Odds (Valós)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-950/40 text-[11px]">
                    <tr className="hover:bg-slate-900/50">
                      <td className="p-2.5 font-bold text-white">Mérkőzés &amp; Időpont</td>
                      <td className="p-2.5 text-emerald-300">✓ Valós hivatalos meccs (API adatfolyam)</td>
                      <td className="p-2.5 text-emerald-300">✓ Valós hivatalos meccs (API adatfolyam)</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="p-2.5 font-bold text-white">Modell Valószínűség (%)</td>
                      <td className="p-2.5 text-emerald-300">✓ Valós Dixon–Coles bivariáns MI predikció</td>
                      <td className="p-2.5 text-emerald-300">✓ Valós Dixon–Coles bivariáns MI predikció</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="p-2.5 font-bold text-white">Szorzó (Odds) forrása</td>
                      <td className="p-2.5 text-amber-300">
                        <strong>Matematikailag becsült ár</strong> (Fair odds + 5% bukmékeri árrés)
                      </td>
                      <td className="p-2.5 text-sky-300 font-bold">
                        Hivatalos fogadóiroda (Bet365, Pinnacle, 1xBet stb.)
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="p-2.5 font-bold text-white">Value (+EV%) &amp; Kelly-tét</td>
                      <td className="p-2.5 text-red-400 font-mono font-bold">
                        ⛔ Szigorúan letiltva (0% / 0 unit az öncsalás ellen)
                      </td>
                      <td className="p-2.5 text-emerald-400 font-mono font-bold">
                        🟢 Élesítve (+EV% él és Negyed-Kelly tétméretezés)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Részletes kifejtés: 2 kártya */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
              {/* Bal kártya: Miért van szükség rá */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Miért létezik a „Szimulált” státusz? (Anti-Fake Value Etika)</span>
                </div>
                <ul className="text-slate-300 space-y-1.5 list-disc list-inside text-[11px] leading-relaxed">
                  <li>
                    <strong>API források jellege:</strong> A hivatalos ligamenetrendeket szállító API (Football-Data.org) valós meccseket, formát és tabellát szolgáltat ingyenesen, de nem tartalmaz élő oddsokat. Az élő szorzókat az API-Sports biztosítja szigorú napi kvótával.
                  </li>
                  <li>
                    <strong>Szigorú öncsalás-védelem:</strong> Ha a rendszer a saját maga által kiszámolt valószínűségből generált szorzóra számolna ki várható értéket (+EV%) és Kelly tétet, az <em>hamis arbitrázs</em> lenne (a saját szorzónkat hasonlítanánk össze a saját valószínűségünkkel!).
                  </li>
                  <li>
                    <strong>Tőkévédelmi fék:</strong> Amíg nem érkezik meg a hiteles, független bukmékeri szorzó, a rendszer sportszerűen és láthatóan kiírja a <code className="text-amber-300 font-mono">🧪 Szimulált</code> jelölést, és szigorúan nullázza a Value és Kelly kalkulációt, megóvva a bankrollt a megtévesztő fogadási szignáloktól.
                  </li>
                </ul>
              </div>

              {/* Jobb kártya: Hogyan válnak valósággá */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Hogyan válnak a tippek „🎯 Bukméker Odds”-szá?</span>
                </div>
                <ol className="text-slate-300 space-y-1.5 list-decimal list-inside text-[11px] leading-relaxed">
                  <li>
                    <strong>Kattints a mérkőzés kártyájára</strong> a listában vagy a Napi Top Tippekben.
                  </li>
                  <li>
                    A felugró <strong>Mérkőzés Részletei</strong> ablakban a rendszer a háttérben azonnal lekéri a mérkőzés <strong>élő Bet365 / Pinnacle piaci szorzóit</strong> (30 perces intelligens cache-sel).
                  </li>
                  <li>
                    Amint a valós odds megérkezik:
                    <ul className="list-disc list-inside pl-4 text-slate-400 text-[10px] space-y-0.5 mt-0.5">
                      <li>A badge azonnal átvált <code className="text-emerald-300 font-mono">🎯 Bukméker Odds</code>-ra az iroda nevével és érvényességi idejével (TTL).</li>
                      <li>Azonnal kiszámításra kerül a valós piaci <strong className="text-emerald-400">+EV%</strong> és élesedik a <strong className="text-emerald-400">Negyed-Kelly</strong> ajánlott egységtét.</li>
                      <li>A szelvényre kattintva a valódi fogadóirodai szorzó kerül át a szelvényépítőbe.</li>
                    </ul>
                  </li>
                </ol>
              </div>
            </div>

            {/* Összegzés / FAQ banner */}
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px] text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Összegzés fogadóknak</span>
                </div>
                <p className="text-slate-400">
                  A meccsek és a valószínűségek 100%-ban valósak. A tippek bátran megtehetők bármelyik fogadóirodánál; a mérkőzés részletes adatlapjának megnyitásával pedig az élő piaci szorzók és a valódi matematikai él azonnal láthatóvá válik.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <button
                  onClick={onGoToPicks}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-[10px] transition-all cursor-pointer whitespace-nowrap"
                >
                  🔥 Top Tippek Megtekintése →
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
