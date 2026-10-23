import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { createTrackedBet } from '../../services/bankrollService';

interface ManualBetModalProps {
  onClose: () => void;
  /** A szelvény rögzítése után hívódik (a hívó frissít, bezár és értesít) */
  onSaved: () => void;
}

const INPUT_CLASS =
  'w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400';

/** Kézi tét rögzítése: egyesemenyes szelvény felvétele a tétnaplóba. */
export const ManualBetModal: React.FC<ManualBetModalProps> = ({ onClose, onSaved }) => {
  const [title, setTitle] = useState<string>('');
  const [market, setMarket] = useState<string>('2.5 gól felett');
  const [odds, setOdds] = useState<string>('1.85');
  const [prob, setProb] = useState<string>('60');
  const [stake, setStake] = useState<string>('3000');
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const oddsNum = parseFloat(odds);
    const probNum = parseInt(prob, 10) || 50;
    const stakeNum = parseInt(stake, 10) || 3000;

    if (!title.trim() || isNaN(oddsNum) || oddsNum < 1.01) {
      alert('Kérlek adj meg érvényes mérkőzésnevet és minimum 1.01-es oddsszintet!');
      return;
    }

    createTrackedBet(
      [
        {
          matchId: `manual-${Date.now()}`,
          matchTitle: title.trim(),
          marketLabel: market.trim(),
          odds: oddsNum,
          probability: probNum,
        },
      ],
      stakeNum,
      notes.trim() || undefined
    );
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-mesh-modal border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-white text-base">Új Tét Kézi Rögzítése</h3>
          </div>
          <button onClick={onClose} className="btn-link text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-bold mb-1">Mérkőzés neve</label>
            <input
              type="text"
              required
              placeholder="pl. Manchester City vs Arsenal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Piac / Tipp</label>
              <input
                type="text"
                required
                placeholder="pl. Hazai (1) vagy BTTS"
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Szorzó (Odds)</label>
              <input
                type="number"
                step="0.01"
                min="1.01"
                required
                value={odds}
                onChange={(e) => setOdds(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Tét összege (Ft)</label>
              <input
                type="number"
                step="500"
                min="500"
                required
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Becsült Esély (%)</label>
              <input
                type="number"
                min="1"
                max="99"
                value={prob}
                onChange={(e) => setProb(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Opcionális jegyzet</label>
            <input
              type="text"
              placeholder="pl. Értékfogadás Pinnacle áron"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
            >
              Mégse
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow-lg shadow-amber-500/20"
            >
              Szelvény Rögzítése
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
