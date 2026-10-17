import React, { useState } from 'react';
import { BetSlipItem } from '../types/football';
import { X, Trash2, Ticket, Sparkles, Copy, Check, TrendingUp } from 'lucide-react';

interface BetSlipDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: BetSlipItem[];
  onRemoveItem: (index: number) => void;
  onClearAll: () => void;
}

export const BetSlipDrawer: React.FC<BetSlipDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onClearAll,
}) => {
  const [stake, setStake] = useState<number>(3000);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  // Kumulált szorzó és együttes valószínűség számítás
  const totalOdds = items.reduce((acc, curr) => acc * curr.odds, 1);
  const combinedProbPct =
    items.length > 0
      ? Math.round(
          items.reduce((acc, curr) => acc * (curr.probability / 100), 1) * 100
        )
      : 0;

  const potentialWin = Math.round(stake * totalOdds);

  const handleCopyTicket = () => {
    const text = `🏆 TippMester AI Szelvény (${items.length} esemény)\n` +
      items.map((i, idx) => `${idx + 1}. ${i.matchTitle} -> ${i.marketLabel} (@${i.odds.toFixed(2)})`).join('\n') +
      `\nÖsszesített Odds: ${totalOdds.toFixed(2)} | Várható nyeremény (${stake} Ft): ${potentialWin.toLocaleString('hu-HU')} Ft`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#0D1527] border-l border-slate-800 h-full flex flex-col shadow-2xl">
        
        {/* Fejléc */}
        <div className="p-4 bg-[#0A101F] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-white text-base">Fogadási Szelvény</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
              {items.length} esemény
            </span>
          </div>

          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-slate-400 hover:text-red-400 px-2 py-1 transition-colors"
                title="Összes törlése"
              >
                Törlés
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Események listája */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <Ticket className="w-10 h-10 mx-auto opacity-30 text-amber-400" />
              <p className="text-sm font-semibold text-slate-400">A szelvényed jelenleg üres</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Kattints bármelyik mérkőzés cellájára vagy a Kiemelt Tippek gombjára a hozzáadáshoz!
              </p>
            </div>
          ) : (
            items.map((item, idx) => (
              <div
                key={`${item.matchId}-${idx}`}
                className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 relative group hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 pr-6">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {item.matchTitle}
                    </span>
                    <span className="text-xs font-medium text-amber-300">
                      {item.marketLabel}
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {item.odds.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Modell valószínűség: <strong className="text-emerald-400">{item.probability}%</strong></span>
                </div>

                <button
                  onClick={() => onRemoveItem(idx)}
                  className="absolute top-2.5 right-2.5 p-1 text-slate-500 hover:text-red-400 opacity-60 hover:opacity-100 transition-opacity"
                  title="Eltávolítás"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Összesítő és kalkulátor */}
        {items.length > 0 && (
          <div className="p-4 bg-[#0A101F] border-t border-slate-800 space-y-3">
            {/* Kumulált statisztikák */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Összesített Odds</span>
                <span className="text-lg font-black text-amber-400">{totalOdds.toFixed(2)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Együttes AI Esély</span>
                <span className="text-lg font-black text-emerald-400">{combinedProbPct}%</span>
              </div>
            </div>

            {/* Tét beállító */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Tét összege:</span>
                <span className="font-bold text-white">{stake.toLocaleString('hu-HU')} Ft</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[1000, 3000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setStake(amt)}
                    className={`py-1 rounded text-xs font-semibold transition-colors ${
                      stake === amt
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {amt.toLocaleString('hu-HU')} Ft
                  </button>
                ))}
              </div>
            </div>

            {/* Várható nyeremény */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
                  Várható Bruttó Kifizetés
                </span>
                <span className="text-xl font-black text-white">
                  {potentialWin.toLocaleString('hu-HU')} Ft
                </span>
              </div>
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>

            {/* Kimásolás vágólapra */}
            <button
              onClick={handleCopyTicket}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Szelvény kimásolva a vágólapra!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Szelvény adatok másolása
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
