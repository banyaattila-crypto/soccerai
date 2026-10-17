import React, { useState } from 'react';
import { BetSlipItem } from '../types/football';
import {
  X,
  Trash2,
  Ticket,
  Copy,
  Check,
  TrendingUp,
  BookmarkCheck,
  Wallet,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface BetSlipDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: BetSlipItem[];
  onRemoveItem: (index: number) => void;
  onClearAll: () => void;
  onSaveToTracker?: (items: BetSlipItem[], stake: number, notes?: string) => void;
  onOpenBankroll?: () => void;
  currentBankroll?: number;
}

export const BetSlipDrawer: React.FC<BetSlipDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onClearAll,
  onSaveToTracker,
  onOpenBankroll,
  currentBankroll = 50000,
}) => {
  const [stake, setStake] = useState<number>(3000);
  const [notes, setNotes] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  // Kumulált szorzó és együttes valószínűség számítás
  const totalOdds = Number(
    items.reduce((acc, curr) => acc * curr.odds, 1).toFixed(2)
  );
  const combinedProbPct =
    items.length > 0
      ? Math.round(
          items.reduce((acc, curr) => acc * (curr.probability / 100), 1) * 100
        )
      : 0;

  const potentialWin = Math.round(stake * totalOdds);

  // Bankroll arány számítása
  const bankrollRatio = currentBankroll > 0 ? (stake / currentBankroll) * 100 : 0;
  const isHighRiskStake = bankrollRatio > 10;

  const handleCopyTicket = () => {
    const text =
      `🏆 SoccerAI PRO Szelvény (${items.length} esemény)\n` +
      items
        .map(
          (i, idx) =>
            `${idx + 1}. ${i.matchTitle} -> ${i.marketLabel} (@${i.odds.toFixed(2)})`
        )
        .join('\n') +
      `\nÖsszesített Odds: ${totalOdds.toFixed(2)} | Várható nyeremény (${stake.toLocaleString('hu-HU')} Ft): ${potentialWin.toLocaleString('hu-HU')} Ft`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveTicket = () => {
    if (items.length === 0 || !onSaveToTracker) return;
    onSaveToTracker(items, stake, notes);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3500);
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
            {onOpenBankroll && (
              <button
                onClick={() => {
                  onClose();
                  onOpenBankroll();
                }}
                className="text-xs text-amber-400 hover:text-amber-300 px-2 py-1 flex items-center gap-1 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                title="Tétnapló és Bankroll megnyitása"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bankroll</span>
              </button>
            )}

            {items.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-slate-400 hover:text-red-400 px-2 py-1 transition-colors cursor-pointer"
                title="Összes törlése a szelvényről"
              >
                Törlés
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Események listája */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-3">
              <Ticket className="w-12 h-12 mx-auto opacity-30 text-amber-400" />
              <p className="text-sm font-semibold text-slate-300">A szelvényed jelenleg üres</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Kattints bármelyik mérkőzés odds-cellájára vagy a Kiemelt Tippek gombjára a szelvényhez adáshoz!
              </p>
              {onOpenBankroll && (
                <div className="pt-4">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenBankroll();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Mentett Szelvények &amp; Tétnapló megtekintése</span>
                  </button>
                </div>
              )}
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
                  <span className="text-sm font-extrabold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700 shrink-0">
                    {item.odds.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>
                    Modell esély:{' '}
                    <strong className="text-emerald-400 font-bold">{item.probability}%</strong>
                  </span>
                  {item.quarterKellyPct && item.quarterKellyPct > 0 && (
                    <span className="text-[10px] text-amber-400/90 font-mono">
                      ¼-Kelly: ~{item.quarterKellyPct}%
                    </span>
                  )}
                </div>

                <button
                  onClick={() => onRemoveItem(idx)}
                  className="absolute top-2.5 right-2.5 p-1 text-slate-500 hover:text-red-400 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
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
            {/* Sikeres rögzítés banner */}
            {savedSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs text-emerald-300 animate-fade-in">
                <div className="flex items-center gap-1.5 font-bold">
                  <BookmarkCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Szelvény rögzítve a Tétnaplóban!</span>
                </div>
                {onOpenBankroll && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenBankroll();
                    }}
                    className="flex items-center gap-1 underline font-extrabold text-white hover:text-amber-300 text-[11px] cursor-pointer"
                  >
                    Megnyitás <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Kumulált statisztikák */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">
                  Összesített Odds
                </span>
                <span className="text-lg font-black text-amber-400">{totalOdds.toFixed(2)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">
                  Együttes AI Esély
                </span>
                <span className="text-lg font-black text-emerald-400">{combinedProbPct}%</span>
              </div>
            </div>

            {/* Tét beállító */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <span>Tét összege:</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({bankrollRatio.toFixed(1)}% bankroll)
                  </span>
                </span>
                <span className="font-bold text-white text-sm">
                  {stake.toLocaleString('hu-HU')} Ft
                </span>
              </div>

              {/* Tét gombok */}
              <div className="grid grid-cols-4 gap-1.5">
                {[1000, 3000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setStake(amt)}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      stake === amt
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {amt.toLocaleString('hu-HU')} Ft
                  </button>
                ))}
              </div>

              {/* Túl magas tét figyelmeztetés */}
              {isHighRiskStake && (
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Figyelem: A tét meghaladja a bankroll 10%-át. A kvantitatív Kelly modell 1-5% tétet javasol a tőkevédelem érdekében.
                  </span>
                </div>
              )}
            </div>

            {/* Várható nyeremény */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
                  Várható Bruttó Kifizetés
                </span>
                <span className="text-xl font-black text-white">
                  {potentialWin.toLocaleString('hu-HU')} Ft
                </span>
                <span className="text-[10px] text-emerald-400 font-medium block">
                  Tiszta profit: +{(potentialWin - stake).toLocaleString('hu-HU')} Ft
                </span>
              </div>
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>

            {/* Opcionális jegyzet */}
            <div>
              <input
                type="text"
                placeholder="Opcionális jegyzet a tétnaplóhoz (pl. Hétvégi top kombi)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Gombok: Mentés a Tétnaplóba & Kimásolás */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleSaveTicket}
                className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <BookmarkCheck className="w-4 h-4" />
                <span>Rögzítés Tétnaplóba</span>
              </button>

              <button
                onClick={handleCopyTicket}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Kimásolva!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-400" />
                    <span>Adatok másolása</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
