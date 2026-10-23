import React, { useState } from 'react';
import { Building2, RefreshCw, Zap } from 'lucide-react';
import type { FixtureRealOdds, Match, MarketProbabilities } from '../../types/football';
import type { MarketFair } from '../../services/marketBlend';
import { buildOddsRows, type BookieTab, type OddsRowData } from './oddsRows';

interface OddsTtl {
  isReal: boolean;
  isExpired: boolean;
  remainingMinutes: number;
}

interface LiveOddsSectionProps {
  match: Match;
  realOdds: FixtureRealOdds | null;
  loadingOdds: boolean;
  fixtureId: number | null | undefined;
  ttlStatus: OddsTtl;
  isRealOddsActive: boolean;
  marketFair: MarketFair | undefined;
  modelP: MarketProbabilities;
  onRefresh: () => void;
}

const OddsRow: React.FC<{
  row: OddsRowData;
  showSource: boolean;
  isRealOddsActive: boolean;
  isExpired: boolean;
}> = ({ row, showSource, isRealOddsActive, isExpired }) => {
  const { odd, ev } = row;
  const hasOdd = odd !== undefined && odd > 1;
  const isPositive = isRealOddsActive && ev !== null && ev > 0;

  return (
    <div className="grid grid-cols-12 items-center py-1.5 px-2.5 rounded-lg bg-slate-950/50 hover:bg-slate-950/80 transition-colors border border-slate-800/60 text-xs">
      <div className="col-span-4 font-semibold text-white flex flex-col">
        <span>{row.label}</span>
        {row.source && showSource && <span className="text-[9px] text-slate-500 truncate">{row.source}</span>}
      </div>

      <div className="col-span-3 text-center text-slate-400 font-mono text-[11px]">
        Fair: <strong className="text-slate-200">{row.fair}</strong>
      </div>

      <div className="col-span-3 text-center">
        {hasOdd ? (
          <span
            className={`font-extrabold font-mono px-2 py-0.5 rounded border ${
              !isRealOddsActive && isExpired
                ? 'text-red-300 bg-red-950/30 border-red-500/20 line-through'
                : 'text-amber-300 bg-amber-500/10 border-amber-500/20'
            }`}
          >
            {odd.toFixed(2)}
          </span>
        ) : (
          <span className="text-slate-600 italic text-[11px]">-</span>
        )}
      </div>

      <div className="col-span-2 text-right">
        {hasOdd && isRealOddsActive && ev !== null ? (
          <span
            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${
              isPositive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700/60'
            }`}
          >
            {ev > 0 ? `+${ev}%` : `${ev}%`}
          </span>
        ) : hasOdd && !isRealOddsActive ? (
          <span className="text-slate-500 text-[10px] italic">{isExpired ? 'Lejárt' : 'Letiltva'}</span>
        ) : (
          <span className="text-slate-600 text-[10px]">-</span>
        )}
      </div>
    </div>
  );
};

const TAB_STYLE: Record<BookieTab, string> = {
  pinnacle: 'bg-blue-600 text-white shadow-md',
  bet365: 'bg-emerald-600 text-white shadow-md',
  best: 'bg-amber-600 text-white shadow-md',
};

/** Élő bukmékeri oddsok (Pinnacle, Bet365, legjobb piac) fair szorzókkal és a piaci referenciához mért EV-vel. */
export const LiveOddsSection: React.FC<LiveOddsSectionProps> = ({
  match,
  realOdds,
  loadingOdds,
  fixtureId,
  ttlStatus,
  isRealOddsActive,
  marketFair,
  modelP,
  onRefresh,
}) => {
  const [activeBookieTab, setActiveBookieTab] = useState<BookieTab>('pinnacle');
  const tabButton = (tab: BookieTab, content: React.ReactNode) => (
    <button
      onClick={() => setActiveBookieTab(tab)}
      className={`flex-1 py-1.5 px-2 rounded-md font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
        activeBookieTab === tab ? TAB_STYLE[tab] : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {content}
    </button>
  );

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-[#0F1C36] via-[#0A1224] to-[#080D1A] border border-blue-500/30 space-y-3.5 shadow-lg">
      {/* Fejléc */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Élő Bukmékeri Oddsok &amp; Valós Piaci Élek
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ÉLŐ PIAC
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Pinnacle (éles záró árak) &bull; Bet365 (fővonal)</div>
          </div>
        </div>

        {/* Jobb oldali gomb / frissítés státusz */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {realOdds?.updatedAt && (
            <span className="text-[10px] text-slate-400 hidden sm:inline">Frissítve: {realOdds.updatedAt}</span>
          )}
          {ttlStatus.isReal && (
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                ttlStatus.isExpired
                  ? 'bg-red-500/15 text-red-300 border-red-500/30'
                  : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
              }`}
            >
              {ttlStatus.isExpired ? '🔴 Lejárt odds (60p TTL)' : `⏳ ${ttlStatus.remainingMinutes}p hátra`}
            </span>
          )}
          {fixtureId ? (
            <button
              onClick={onRefresh}
              disabled={loadingOdds}
              title="Valós oddsok frissítése"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingOdds ? 'animate-spin text-amber-400' : 'text-blue-400'}`} />
              <span className="text-[11px]">{loadingOdds ? 'Betöltés...' : 'Frissítés'}</span>
            </button>
          ) : (
            <span className="text-[10px] text-slate-500 italic">Modell fair oddsok</span>
          )}
        </div>
      </div>

      {/* Tartalom */}
      {loadingOdds && !realOdds ? (
        <div className="p-4 text-center space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
          <div className="text-xs text-slate-400 font-medium">Élő Pinnacle és Bet365 oddsok lekérése...</div>
        </div>
      ) : realOdds ? (
        <div className="space-y-3">
          {/* Fülválasztó (Pinnacle / Bet365 / Legjobb) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 rounded-lg border border-slate-800 text-xs">
            {realOdds.pinnacle &&
              tabButton(
                'pinnacle',
                <>
                  <span>Pinnacle</span>
                  {realOdds.pinnacle.margin !== undefined && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-emerald-300 font-mono">
                      {realOdds.pinnacle.margin}% vig
                    </span>
                  )}
                </>
              )}
            {realOdds.bet365 &&
              tabButton(
                'bet365',
                <>
                  <span>Bet365</span>
                  {realOdds.bet365.margin !== undefined && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-amber-300 font-mono">
                      {realOdds.bet365.margin}% vig
                    </span>
                  )}
                </>
              )}
            {tabButton(
              'best',
              <>
                <Zap className="w-3 h-3 text-amber-300" />
                <span>Legjobb Piac</span>
              </>
            )}
          </div>

          {/* Táblázatos piac összehasonlító */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-12 text-[10px] uppercase font-bold text-slate-400 px-2.5 pb-0.5">
              <div className="col-span-4">Piac / Kimenetel</div>
              <div className="col-span-3 text-center">Piaci Fair</div>
              <div className="col-span-3 text-center">Bukméker</div>
              <div className="col-span-2 text-right">Érték (+EV)</div>
            </div>
            {buildOddsRows(match, realOdds, activeBookieTab, modelP, marketFair).map((row) => (
              <OddsRow
                key={row.key}
                row={row}
                showSource={activeBookieTab === 'best'}
                isRealOddsActive={isRealOddsActive}
                isExpired={ttlStatus.isExpired}
              />
            ))}
          </div>

          {/* Bukméker információ & árrés összegzés */}
          <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between text-slate-400 gap-1">
            <span>
              Elérhető bukmékerek:{' '}
              <strong className="text-slate-200">
                {realOdds.bookmakers.map((b) => b.name).slice(0, 4).join(', ')}
                {realOdds.bookmakers.length > 4 ? ` (+${realOdds.bookmakers.length - 4})` : ''}
              </strong>
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              Zöld kiemelés: ár-előny a piaci konszenzushoz (+EV)
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3 text-center text-xs text-slate-400 bg-slate-950/40 rounded-lg border border-slate-800/80 space-y-1">
          <div>A bukmékerek még nem nyitották meg a hivatalos élő piacot ehhez a mérkőzéshez.</div>
          <div className="text-[11px] text-slate-500">
            A fenti kvantitatív Dixon–Coles és Shin de-vig modell fair szorzói érvényesek.
          </div>
        </div>
      )}
    </div>
  );
};
