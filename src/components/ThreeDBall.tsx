import React, { useState } from 'react';

interface ThreeDBallProps {
  size?: number;
  className?: string;
  showRings?: boolean;
  interactive?: boolean;
}

export const ThreeDBall: React.FC<ThreeDBallProps> = ({
  size = 64,
  className = '',
  showRings = true,
  interactive = true,
}) => {
  const [isSpinningFast, setIsSpinningFast] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const handleClick = () => {
    if (!interactive) return;
    setIsSpinningFast(true);
    setClickCount((prev) => prev + 1);
    setTimeout(() => setIsSpinningFast(false), 1400);
  };

  return (
    <div
      onClick={handleClick}
      title={interactive ? 'Kattints rám a 3D szuperspinhez! ⚽✨' : undefined}
      className={`relative inline-flex items-center justify-center select-none cursor-pointer ${className}`}
      style={{
        width: size,
        height: size,
        perspective: '1200px',
      }}
    >
      {/* 3D Orbitális Külső Energetikai Gyűrű (Zöld / Smaragd / Arany) */}
      {showRings && (
        <>
          <div
            className={`absolute inset-0 rounded-full border border-emerald-400/40 pointer-events-none transition-all duration-700 ${
              isSpinningFast ? 'animate-spin scale-110 border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.6)]' : 'animate-[spin_12s_linear_infinite]'
            }`}
            style={{
              transformStyle: 'preserve-3d',
              transform: 'rotateX(68deg) rotateY(15deg)',
            }}
          />
          <div
            className={`absolute inset-0 rounded-full border border-amber-400/35 pointer-events-none transition-all duration-700 ${
              isSpinningFast ? 'animate-[spin_0.8s_linear_infinite] scale-115 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)]' : 'animate-[spin_18s_linear_infinite_reverse]'
            }`}
            style={{
              transformStyle: 'preserve-3d',
              transform: 'rotateX(25deg) rotateY(65deg)',
            }}
          />
        </>
      )}

      {/* 3D Labda Gömb Teste */}
      <div
        className={`relative rounded-full transition-transform duration-700 ${
          isSpinningFast
            ? 'animate-[spin_0.7s_cubic-bezier(0.25,1,0.5,1)] shadow-[0_0_25px_rgba(16,185,129,0.5)]'
            : 'animate-[spin_24s_linear_infinite] hover:shadow-[0_0_18px_rgba(52,211,153,0.35)]'
        }`}
        style={{
          width: size * 0.78,
          height: size * 0.78,
          transformStyle: 'preserve-3d',
          background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #cbd5e1 40%, #475569 75%, #0f172a 100%)',
          boxShadow: 'inset -8px -8px 18px rgba(2, 6, 23, 0.8), 0 8px 24px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Belső Varrásmintázat és 3D Ötszögek */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full rounded-full"
          style={{ transform: 'rotate(-10deg)' }}
        >
          <defs>
            <radialGradient id="ballPatchGrad" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="70%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
            <linearGradient id="sheenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Központi ötszög */}
          <polygon
            points="50,38 60,46 56,58 44,58 40,46"
            fill="url(#ballPatchGrad)"
            stroke="#020617"
            strokeWidth="1.2"
          />

          {/* Felső ötszög */}
          <polygon
            points="50,18 57,25 43,25"
            fill="url(#ballPatchGrad)"
            stroke="#020617"
            strokeWidth="1"
          />
          {/* Jobb felső */}
          <polygon
            points="76,33 80,44 71,43 68,35"
            fill="url(#ballPatchGrad)"
            stroke="#020617"
            strokeWidth="1"
          />
          {/* Jobb alsó */}
          <polygon
            points="70,68 79,62 74,53 65,58"
            fill="url(#ballPatchGrad)"
            stroke="#020617"
            strokeWidth="1"
          />
          {/* Bal alsó */}
          <polygon
            points="30,68 21,62 26,53 35,58"
            fill="url(#ballPatchGrad)"
            stroke="#020617"
            strokeWidth="1"
          />
          {/* Bal felső */}
          <polygon
            points="24,33 20,44 29,43 32,35"
            fill="url(#ballPatchGrad)"
            stroke="#020617"
            strokeWidth="1"
          />
          {/* Alsó */}
          <polygon
            points="45,78 55,78 50,70"
            fill="url(#ballPatchGrad)"
            stroke="#020617"
            strokeWidth="1"
          />

          {/* Varrások */}
          <g stroke="#64748b" strokeWidth="1" opacity="0.75" strokeLinecap="round">
            <line x1="50" y1="38" x2="50" y2="25" />
            <line x1="60" y1="46" x2="71" y2="43" />
            <line x1="56" y1="58" x2="65" y2="58" />
            <line x1="44" y1="58" x2="35" y2="58" />
            <line x1="40" y1="46" x2="29" y2="43" />
            <line x1="57" y1="25" x2="68" y2="35" />
            <line x1="43" y1="25" x2="32" y2="35" />
            <line x1="71" y1="43" x2="74" y2="53" />
            <line x1="29" y1="43" x2="26" y2="53" />
            <line x1="70" y1="68" x2="55" y2="78" />
            <line x1="30" y1="68" x2="45" y2="78" />
          </g>

          {/* 3D Gömb Fénycsillanás (Specular Reflection) */}
          <ellipse
            cx="40"
            cy="28"
            rx="14"
            ry="8"
            transform="rotate(-25 40 28)"
            fill="url(#sheenGrad)"
          />

          {/* AI Szikrapont */}
          <circle cx="34" cy="24" r="1.8" fill="#ffffff" />
        </svg>

        {/* Fényudvar a gömb alatt */}
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4/5 h-2 rounded-full bg-emerald-500/20 blur-sm pointer-events-none"
        />
      </div>

      {/* Kattintási számláló visszajelzés (ha interaktív) */}
      {interactive && clickCount > 0 && (
        <span
          key={clickCount}
          className="absolute -top-1 -right-1 text-[9px] font-black text-emerald-400 bg-slate-900/90 px-1 rounded-full border border-emerald-500/40 animate-ping pointer-events-none"
        >
          +{clickCount}
        </span>
      )}
    </div>
  );
};
