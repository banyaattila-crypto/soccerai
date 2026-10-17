import React, { useState, useEffect } from 'react';
import { X, Server, Key, Check } from 'lucide-react';
import { APP_VERSION } from '../version';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAbout?: () => void;
  onSaveConfig?: (source: 'builtin' | 'api', key: string, apiSportsKey?: string, enableSecondary?: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onOpenAbout, onSaveConfig }) => {
  const [dataSource, setDataSource] = useState<'builtin' | 'api'>(() => {
    return (localStorage.getItem('focitipp_datasource') as 'builtin' | 'api') || 'api';
  });
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('focitipp_apikey') || '0a2ff5ef40ed4113a0ca28d6b9b122d8';
  });
  const [apiSportsKey, setApiSportsKey] = useState<string>(() => {
    return localStorage.getItem('focitipp_apisports_key') || 'b088263aae59a54a7f9a597f1ce83644';
  });
  const [enableSecondaryLeagues, setEnableSecondaryLeagues] = useState<boolean>(() => {
    return localStorage.getItem('focitipp_enable_secondary') !== 'false';
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
    localStorage.setItem('focitipp_apisports_key', apiSportsKey);
    localStorage.setItem('focitipp_enable_secondary', enableSecondaryLeagues ? 'true' : 'false');
    localStorage.setItem('focitipp_threshold', threshold.toString());
    setSaved(true);
    if (onSaveConfig) {
      onSaveConfig(dataSource, apiKey, apiSportsKey, enableSecondaryLeagues);
    }
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
                  <div className="text-xs font-extrabold text-white flex items-center gap-2">
                    <span>Élő Külső Futball API (Football-Data.org)</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                      Aktív / Éles kulccsal
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Közvetlen élő mérkőzés szinkronizáció valós mai párosításokkal, állásokkal és logókkal.
                  </div>
                </div>
              </label>

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
                    <span>Beépített Offline Szimulációs Motor</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-medium">
                      Offline Demó
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Előre definiált minta rangadók és tesztadatok (internetkapcsolattól és API rátakorlátoktól független).
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* API Kulcs mező */}
          <div className="space-y-2 p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Football-Data.org API Kulcs</span>
              </label>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                ✓ Érvényes kulcs
              </span>
            </div>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Pl. 0a2ff5ef40ed..."
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
            <p className="text-[10px] text-slate-500">
              Fiók: <strong className="text-slate-300">banya.attila@icloud.com</strong> &bull; Helyben és felhőben tárolva.
            </p>
          </div>

          {/* Másodosztályok & API-Sports Beállítások */}
          <div className="space-y-3 p-3.5 bg-gradient-to-b from-slate-900/90 to-[#0B1220] rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                <span>API-Sports &amp; Másodosztályok</span>
              </label>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold font-mono">
                ✓ Aktív (100 kérés/nap)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white">Másodosztályok és NB I bekapcsolása</div>
                <div className="text-[10px] text-slate-400">
                  LaLiga 2, Ligue 2, Serie B, 2. Bundesliga és NB I meccsek hozzáadása.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSecondaryLeagues}
                  onChange={(e) => setEnableSecondaryLeagues(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">
                API-Sports Kulcs
              </label>
              <input
                type="text"
                value={apiSportsKey}
                onChange={(e) => setApiSportsKey(e.target.value)}
                placeholder="Pl. b088263aae5..."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <p className="text-[10px] text-slate-500">
                Fiók: <strong className="text-slate-300">Banya Attila</strong> (banya.attila@icloud.com) &bull; Intelligens 45 perces gyorsítótárral védve.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">🇪🇸 LaLiga 2</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">🇫🇷 Ligue 2</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">🇮🇹 Serie B</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">🇩🇪 2. Bundesliga</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">🇭🇺 NB I</span>
            </div>
          </div>

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

          {/* Verzióinformáció & Névjegy gomb */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-300">SoccerAI PRO</span>
              <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 border border-slate-700">
                v{APP_VERSION}
              </span>
            </div>
            {onOpenAbout && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAbout();
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-bold hover:underline flex items-center gap-1"
              >
                <span>Névjegy &amp; Release Notes</span>
                <span>&rarr;</span>
              </button>
            )}
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
                Mentve és Alkalmazva!
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
