import React from 'react';
import { useSoccerBallCanvas } from '../hooks/useSoccerBallCanvas';

interface LogoProps {
  className?: string;
  size?: number;
  interactive?: boolean;
}

/**
 * 2026 FIFA World Cup Official Match Ball: ADIDAS TRIONDA PRO
 * Fotorealisztikus 3D gömbleképezés a megosztott useSoccerBallCanvas hook segítségével:
 * - Valódi adidas TRIONDA PRO hivatalos meccslabda 4 nézetes szintézis (0°, 90°, 180°, 270°)
 * - Autentikus poliuretán bőrfelület mikro-textúrával és aerodinamikai mélyvarrásokkal
 * - Folyamatos, soha meg nem álló, lágy és elegáns 3D rotáció
 * - Kétszeres bilineáris textúra-szűrés a borotvaéles, aliasing-mentes forgásért
 */
export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 46,
  interactive = true,
}) => {
  const { canvasRef, isHovered, setIsHovered, triggerSuperSpin } = useSoccerBallCanvas({
    size,
    interactive,
  });

  return (
    <div
      onClick={triggerSuperSpin}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="FIFA 2026 Világbajnokság hivatalos meccslabda: adidas TRIONDA PRO • 3D folyamatos forgás"
      className={`relative inline-flex items-center justify-center select-none cursor-pointer transition-transform duration-300 ${
        isHovered ? 'scale-106' : 'scale-100'
      } ${className}`}
      style={{
        width: size,
        height: size,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: size,
          height: size,
          display: 'block',
        }}
        className="rounded-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.55)]"
      />
    </div>
  );
};
