import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  AlertTriangle,
  Delete,
  RotateCcw,
  HelpCircle,
} from 'lucide-react';
import {
  verifyPin,
  getPinLockoutRemainingSeconds,
  resetPinEmergency,
} from '../services/pinService';
import { Logo } from './Logo';

interface PinLockScreenProps {
  onUnlock: () => void;
}

const PIN_LENGTH = 6;

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(() =>
    getPinLockoutRemainingSeconds()
  );
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Kizárási (Lockout) időzítő frissítése
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setErrorMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  // PIN ellenőrzése
  const handleVerify = useCallback(
    async (codeToVerify: string) => {
      if (codeToVerify.length !== PIN_LENGTH || isVerifying || lockoutSeconds > 0) {
        return;
      }

      setIsVerifying(true);
      setErrorMessage(null);

      try {
        const result = await verifyPin(codeToVerify);

        if (result.success) {
          setIsSuccess(true);
          setTimeout(() => {
            onUnlock();
          }, 350);
        } else {
          setIsShaking(true);
          setErrorMessage(result.error || 'Helytelen PIN kód!');
          if (result.lockoutSeconds && result.lockoutSeconds > 0) {
            setLockoutSeconds(result.lockoutSeconds);
          }
          setTimeout(() => {
            setPin('');
            setIsShaking(false);
          }, 450);
        }
      } catch (err) {
        console.error('PIN ellenőrzési hiba:', err);
        setErrorMessage('Váratlan hiba a PIN ellenőrzésekor.');
      } finally {
        setIsVerifying(false);
      }
    },
    [isVerifying, lockoutSeconds, onUnlock]
  );

  // Számjegy hozzáadása
  const handleAddDigit = useCallback(
    (digit: string) => {
      if (lockoutSeconds > 0 || isVerifying || isSuccess) return;
      if (pin.length < PIN_LENGTH) {
        const nextPin = pin + digit;
        setPin(nextPin);
        if (nextPin.length === PIN_LENGTH) {
          handleVerify(nextPin);
        }
      }
    },
    [handleVerify, isSuccess, isVerifying, lockoutSeconds, pin]
  );

  // Utolsó számjegy törlése
  const handleBackspace = useCallback(() => {
    if (lockoutSeconds > 0 || isVerifying || isSuccess) return;
    setErrorMessage(null);
    setPin((prev) => prev.slice(0, -1));
  }, [isSuccess, isVerifying, lockoutSeconds]);

  // Teljes törlés
  const handleClear = useCallback(() => {
    if (lockoutSeconds > 0 || isVerifying || isSuccess) return;
    setErrorMessage(null);
    setPin('');
  }, [isSuccess, isVerifying, lockoutSeconds]);

  // Fizikai billentyűzet támogatás
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showResetConfirm) return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleAddDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAddDigit, handleBackspace, handleClear, showResetConfirm]);

  // Vészhelyzeti visszaállítás megerősítése
  const handleConfirmReset = () => {
    resetPinEmergency();
    setShowResetConfirm(false);
    onUnlock();
  };

  const keypadButtons = [
    { num: '1', sub: '' },
    { num: '2', sub: 'ABC' },
    { num: '3', sub: 'DEF' },
    { num: '4', sub: 'GHI' },
    { num: '5', sub: 'JKL' },
    { num: '6', sub: 'MNO' },
    { num: '7', sub: 'PQRS' },
    { num: '8', sub: 'TUV' },
    { num: '9', sub: 'WXYZ' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl animate-fade-in select-none">
      <div className="relative w-full max-w-sm flex flex-col items-center text-center space-y-6">
        
        {/* Felső Logó & Biztonsági Cím */}
        <div className="flex flex-col items-center space-y-2">
          <div className="relative">
            <Logo size={56} />
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-900 border border-slate-700 shadow-md">
              {isSuccess ? (
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              )}
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
              <span>SoccerAI</span>
              <span className="text-amber-400">PRO</span>
            </h2>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-semibold text-slate-300">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Biztonsági Zárolás</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 max-w-xs">
            Add meg a 6-jegyű PIN kódodat a bankroll és a predikciók megjelenítéséhez.
          </p>
        </div>

        {/* 6 Digit Pötty Kijelző */}
        <div
          className={`flex items-center justify-center gap-3.5 py-2 transition-transform ${
            isShaking ? 'animate-pin-shake' : ''
          }`}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, idx) => {
            const isFilled = idx < pin.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 border-2 ${
                  isSuccess
                    ? 'border-emerald-400 bg-emerald-400 scale-125 shadow-[0_0_15px_rgba(52,211,153,0.9)]'
                    : isShaking
                    ? 'border-rose-500 bg-rose-500/80 scale-110 shadow-[0_0_12px_rgba(244,63,94,0.8)]'
                    : isFilled
                    ? 'border-emerald-400 bg-emerald-400 scale-110 shadow-[0_0_12px_rgba(52,211,153,0.7)]'
                    : 'border-slate-600 bg-slate-800/80'
                }`}
              />
            );
          })}
        </div>

        {/* Hibaüzenet vagy Lockout számláló */}
        <div className="h-6 flex items-center justify-center">
          {lockoutSeconds > 0 ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Zárolva: várj {lockoutSeconds} mp-et</span>
            </div>
          ) : errorMessage ? (
            <div className="flex items-center gap-1 text-xs font-semibold text-rose-400 animate-fade-in">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-500">
              Gépelj a billentyűzeten vagy használd a lenti számbillentyűket
            </span>
          )}
        </div>

        {/* Számbillentyűzet (Numeric Keypad) */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
          {keypadButtons.map(({ num, sub }) => (
            <button
              key={num}
              type="button"
              disabled={lockoutSeconds > 0 || isVerifying || isSuccess}
              onClick={() => handleAddDigit(num)}
              className="h-14 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 active:scale-95 active:bg-amber-500/20 border border-slate-800 hover:border-slate-700 text-white transition-all flex flex-col items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-slate-950/40"
            >
              <span className="text-xl font-bold font-mono leading-none">{num}</span>
              {sub && (
                <span className="text-[9px] font-semibold text-slate-400 tracking-widest mt-0.5">
                  {sub}
                </span>
              )}
            </button>
          ))}

          {/* Alsó sor: Törlés (Clear), 0, Backspace */}
          <button
            type="button"
            disabled={lockoutSeconds > 0 || isVerifying || isSuccess || pin.length === 0}
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-900/50 hover:bg-slate-850 active:scale-95 border border-slate-800/60 text-slate-400 hover:text-slate-200 transition-all flex flex-col items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Törlés (Clear)"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-[9px] uppercase font-bold tracking-wider mt-1">Törlés</span>
          </button>

          <button
            type="button"
            disabled={lockoutSeconds > 0 || isVerifying || isSuccess}
            onClick={() => handleAddDigit('0')}
            className="h-14 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 active:scale-95 active:bg-amber-500/20 border border-slate-800 hover:border-slate-700 text-white transition-all flex flex-col items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-slate-950/40"
          >
            <span className="text-xl font-bold font-mono leading-none">0</span>
            <span className="text-[9px] font-semibold text-slate-400 tracking-widest mt-0.5">+</span>
          </button>

          <button
            type="button"
            disabled={lockoutSeconds > 0 || isVerifying || isSuccess || pin.length === 0}
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-slate-900/50 hover:bg-slate-850 active:scale-95 border border-slate-800/60 text-slate-400 hover:text-rose-400 transition-all flex flex-col items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Visszatörlés (Backspace)"
          >
            <Delete className="w-5 h-5" />
            <span className="text-[9px] uppercase font-bold tracking-wider mt-1">Vissza</span>
          </button>
        </div>

        {/* Elfelejtett PIN gomb / Vészhelyzeti opció */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="text-xs text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Elfelejtetted a PIN kódot?</span>
          </button>
        </div>

        {/* Visszaállítás megerősítő modális */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-xs bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl text-left space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>PIN Kód Visszaállítása</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ha elfelejtetted a 6-jegyű PIN kódodat, a visszaállítás azonnal <strong>kikapcsolja a PIN védelmet</strong> és feloldja az alkalmazást.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Mégse
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  PIN Törlése &amp; Feloldás
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
