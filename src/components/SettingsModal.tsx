import React, { useState, useEffect } from 'react';
import { X, Server, Key, Palette, Check, Sparkles, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [dataSource, setDataSource] = useState<'builtin' | 'api'>(() => {
    return (localStorage.getItem('focitipp_datasource') as 'builtin' | 'api') || 'builtin';
  });
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('focitipp_apikey') || '';
  });
  const [threshold, setThreshold] = useState<number>(() => {
    return parseInt(localStorage.getItem('focitipp_threshold') || '60', 10);
  });
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    if (saved) {
      const timer = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [saved]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('focitipp_datasource', dataSource);
    localStorage.setItem('focitipp_apikey', apiKey);
    localStorage.setItem('focitipp_threshold', threshold.toString());
    setSaved(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0D1527] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Fejléc */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0F1A30] to-[#0A101F] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-white text-base">Rendszer & API Beállítások</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Test tartalom */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          
          {/* Adatforrás választó */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Adatforrás & Szimulációs Mód
            </label>

            <div className="space-y-2">
              <label
                onClick={() => setDataSource('builtin')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  dataSource === 'builtin'
                    ? 'bg-amber-500/10 border-amber-500/50 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="datasource"
                  checked={dataSource === 'builtin'}
                  onChange={() => setDataSource('builtin')}
                  className="mt-1 text-amber-500 focus:ring-amber-500"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-extrabold text-white flex items-center gap-2">
                    <span>Beépített Intelligens AI Predikciós Motor</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                      Aktív / Ajánlott
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Azonnal futtatható valósághű adatokkal, matematikai Poisson-eloszlás és xG modell kalkulációval (nulla API költség).
                  </div>
                </div>
              </label>

              <label
                onClick={() => setDataSource('api')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  dataSource === 'api'
                    ? 'bg-amber-500/10 border-amber-500/50 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="datasource"
                  checked={dataSource === 'api'}
                  onChange={() => setDataSource('api')}
                  className="mt-1 text-amber-500 focus:ring-amber-500"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-extrabold text-white">
                    Élő Külső Futball API (Football-Data / API-Football)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Közvetlen élő szinkronizáció hivatalos sportstatisztikai szolgáltatóktól saját API kulccsal.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* API Kulcs mező ha API mód kiválasztva */}
          {dataSource === 'api' && (
            <div className="space-y-2 p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>API Kulcs (Token)</span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Pl. fc394208a98... (football-data.org)"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
              />
              <p className="text-[10px] text-slate-500">
                A kulcs csak a saját böngésződ biztonságos helyi tárhelyén (localStorage) tárolódik.
              </p>
            </div>
          )}

          {/* Erős szignál küszöbérték */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="uppercase tracking-wider">Erős Szignál Küszöbérték</span>
              <span className="text-amber-400 font-mono font-black">{threshold}%+</span>
            </div>
            <input
              type="range"
              min="50"
              max="75"
              step="5"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>50% (Több tipp)</span>
              <span>60% (Kiegyensúlyozott)</span>
              <span>75% (Csak elit)</span>
            </div>
          </div>

        </div>

        {/* Lábléc gombok */}
        <div className="p-4 bg-[#0A101F] border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Mégse
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                Mentve!
              </>
            ) : (
              'Beállítások Mentése'
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
