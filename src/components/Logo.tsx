import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 42 }) => {
  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="drop-shadow-[0_0_12px_rgba(245,158,11,0.45)]"
      >
        <defs>
          {/* Külső fémgyűrű gradiens */}
          <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="30%" stopColor="#F59E0B" />
            <stop offset="70%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>

          {/* Sötét mélységi alap */}
          <radialGradient id="darkOrb" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="70%" stopColor="#0B132B" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>

          {/* 3D Labda fény-árnyék szféra */}
          <radialGradient id="ball3D" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#E2E8F0" />
            <stop offset="75%" stopColor="#94A3B8" />
            <stop offset="95%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0F172A" />
          </radialGradient>

          {/* Fekete ötszögek textúrája fényvisszaverődéssel */}
          <linearGradient id="patchGrad" x1="20%" y1="20%" x2="80%" y2="80%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          {/* AI Energetikai neon fénycsík */}
          <linearGradient id="aiEnergy" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          {/* Gömb csillanás (Specular Highlight) */}
          <linearGradient id="gloss" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.0" />
          </linearGradient>

          <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Külső arany/techno gyűrű */}
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="url(#darkOrb)"
          stroke="url(#goldRim)"
          strokeWidth="2.5"
        />

        {/* 2. AI Dinamikus forgási ívek (3D Orbitális animáció) */}
        <g className="animate-[spin_10s_linear_infinite] origin-center" style={{ transformOrigin: '50px 50px' }}>
          <path
            d="M 12 50 A 38 38 0 0 1 88 50"
            fill="none"
            stroke="url(#aiEnergy)"
            strokeWidth="1.8"
            strokeDasharray="14 6"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M 88 50 A 38 38 0 0 1 12 50"
            fill="none"
            stroke="url(#goldRim)"
            strokeWidth="1.2"
            strokeDasharray="8 8"
            strokeLinecap="round"
            opacity="0.6"
          />
        </g>

        {/* 3. A 3D Focilabda Alaptest */}
        <circle cx="50" cy="50" r="34" fill="url(#ball3D)" />

        {/* 4. Élethű fekete ötszög panelek és varrások */}
        {/* Központi ötszög */}
        <polygon
          points="50,38 59,45 56,56 44,56 41,45"
          fill="url(#patchGrad)"
          stroke="#0F172A"
          strokeWidth="0.8"
        />

        {/* Felső panel */}
        <polygon
          points="50,22 55,27 45,27"
          fill="url(#patchGrad)"
          stroke="#1E293B"
          strokeWidth="0.6"
        />
        {/* Jobb felső panel */}
        <polygon
          points="73,34 76,44 68,43 65,36"
          fill="url(#patchGrad)"
          stroke="#1E293B"
          strokeWidth="0.6"
        />
        {/* Jobb alsó panel */}
        <polygon
          points="68,66 76,60 72,52 64,56"
          fill="url(#patchGrad)"
          stroke="#1E293B"
          strokeWidth="0.6"
        />
        {/* Bal alsó panel */}
        <polygon
          points="32,66 24,60 28,52 36,56"
          fill="url(#patchGrad)"
          stroke="#1E293B"
          strokeWidth="0.6"
        />
        {/* Bal felső panel */}
        <polygon
          points="27,34 24,44 32,43 35,36"
          fill="url(#patchGrad)"
          stroke="#1E293B"
          strokeWidth="0.6"
        />
        {/* Alsó panel */}
        <polygon
          points="46,75 54,75 50,68"
          fill="url(#patchGrad)"
          stroke="#1E293B"
          strokeWidth="0.6"
        />

        {/* Varrás vonalak a panelek között */}
        <g stroke="#64748B" strokeWidth="0.9" opacity="0.6" strokeLinecap="round">
          {/* Középpontból kifelé */}
          <line x1="50" y1="38" x2="50" y2="27" />
          <line x1="59" y1="45" x2="68" y2="43" />
          <line x1="56" y1="56" x2="64" y2="60" />
          <line x1="44" y1="56" x2="36" y2="60" />
          <line x1="41" y1="45" x2="32" y2="43" />

          {/* Külső összekötők */}
          <line x1="45" y1="27" x2="35" y2="36" />
          <line x1="55" y1="27" x2="65" y2="36" />
          <line x1="68" y1="43" x2="72" y2="52" />
          <line x1="68" y1="66" x2="54" y2="75" />
          <line x1="32" y1="66" x2="46" y2="75" />
          <line x1="28" y1="52" x2="32" y2="43" />
        </g>

        {/* 5. 3D Árnyék a labda peremén (Shadow overlay) */}
        <path
          d="M 50 16 A 34 34 0 0 1 84 50 A 34 34 0 0 1 50 84 A 34 34 0 0 0 50 16"
          fill="#020617"
          opacity="0.25"
        />

        {/* 6. Csillogó 3D Fénytükröződés (Gloss highlight) */}
        <ellipse
          cx="42"
          cy="30"
          rx="12"
          ry="7"
          transform="rotate(-25 42 30)"
          fill="url(#gloss)"
        />

        {/* 7. AI Fénycsillag / Szikra */}
        <circle cx="36" cy="26" r="1.5" fill="#FFFFFF" />
        <path
          d="M 36 21 L 37.5 26 L 42 26 L 38 29 L 39.5 34 L 36 31 L 32.5 34 L 34 29 L 30 26 L 34.5 26 Z"
          fill="#FDE68A"
          opacity="0.7"
          transform="scale(0.3) translate(65, 35)"
        />
      </svg>
    </div>
  );
};
