import React, { useState } from 'react';
import { useSoccerBallCanvas } from '../hooks/useSoccerBallCanvas';

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
  const ballInnerSize = Math.round(size * 0.78);
  const { canvasRef, triggerSuperSpin, isSuperSpinning } = useSoccerBallCanvas({
    size: ballInnerSize,
    interactive,
  });
  const [clickCount, setClickCount] = useState(0);

  const handleClick = () => {
    if (!interactive) return;
    triggerSuperSpin();
    setClickCount((prev) => prev + 1);
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
            className={`absolute inset-0 rounded-full border border-brand-400/40 pointer-events-none transition-all duration-700 ${
              isSuperSpinning
                ? 'animate-spin scale-110 border-brand-300 shadow-[0_0_20px_rgba(79,112,245,0.6)]'
                : 'animate-[spin_12s_linear_infinite]'
            }`}
            style={{
              transformStyle: 'preserve-3d',
              transform: 'rotateX(68deg) rotateY(15deg)',
            }}
          />
          <div
            className={`absolute inset-0 rounded-full border border-amber-400/35 pointer-events-none transition-all duration-700 ${
              isSuperSpinning
                ? 'animate-[spin_0.8s_linear_infinite] scale-115 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                : 'animate-[spin_18s_linear_infinite_reverse]'
            }`}
            style={{
              transformStyle: 'preserve-3d',
              transform: 'rotateX(25deg) rotateY(65deg)',
            }}
          />
        </>
      )}

      {/* 3D Labda Gömb Teste Fotorealisztikus 3D Canvas-szel */}
      <div
        className={`relative rounded-full transition-transform duration-700 ${
          isSuperSpinning
            ? 'scale-105 shadow-[0_0_25px_rgba(79,112,245,0.5)]'
            : 'hover:shadow-[0_0_18px_rgba(111,140,255,0.35)]'
        }`}
        style={{
          width: ballInnerSize,
          height: ballInnerSize,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: ballInnerSize,
            height: ballInnerSize,
            display: 'block',
          }}
          className="rounded-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.55)]"
        />

        {/* Fényudvar a gömb alatt */}
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4/5 h-2 rounded-full bg-brand-500/20 blur-sm pointer-events-none"
        />
      </div>

      {/* Kattintási számláló visszajelzés (ha interaktív) */}
      {interactive && clickCount > 0 && (
        <span
          key={clickCount}
          className="absolute -top-1 -right-1 text-[9px] font-black text-brand-400 bg-slate-900/90 px-1 rounded-full border border-brand-500/40 animate-ping pointer-events-none"
        >
          +{clickCount}
        </span>
      )}
    </div>
  );
};
