import React, { useEffect, useRef, useState } from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  interactive?: boolean;
}

/**
 * 3D Pont leképzése gömbfelületről 2D képernyőre ortografikus vetítéssel és 14°-os dőlésszöggel
 */
function projectSphere(
  lon: number,
  lat: number,
  theta: number,
  R: number,
  cx: number,
  cy: number,
  cosT: number,
  sinT: number
): { x: number; y: number; z: number; visible: boolean } {
  const l = lon + theta;
  const x0 = Math.cos(lat) * Math.sin(l);
  const y0 = Math.sin(lat);
  const z0 = Math.cos(lat) * Math.cos(l);

  // Döntött Y-tengely körüli forgatás
  const x = x0;
  const y = y0 * cosT - z0 * sinT;
  const z = y0 * sinT + z0 * cosT;

  return {
    x: cx + x * R,
    y: cy + y * R,
    z,
    visible: z > -0.15,
  };
}

/**
 * Zárt gömbi sokszög / hullámszalag kirajzolása Canvas 2D-n, sima görbékkel
 */
function drawSphericalPolygon(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  theta: number,
  R: number,
  cx: number,
  cy: number,
  cosT: number,
  sinT: number
): boolean {
  const projected = points.map(([lon, lat]) =>
    projectSphere(lon, lat, theta, R, cx, cy, cosT, sinT)
  );

  // Ha a pontok többsége a gömb mögött van, nem rajzoljuk ki
  const visibleCount = projected.filter((p) => p.z > 0).length;
  if (visibleCount < 2) return false;

  ctx.beginPath();
  let first = true;
  for (let i = 0; i < projected.length; i++) {
    const p = projected[i];
    if (first) {
      ctx.moveTo(p.x, p.y);
      first = false;
    } else {
      const prev = projected[i - 1];
      const midX = (prev.x + p.x) / 2;
      const midY = (prev.y + p.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    }
  }
  const last = projected[projected.length - 1];
  const p0 = projected[0];
  ctx.quadraticCurveTo(last.x, last.y, p0.x, p0.y);
  ctx.closePath();

  return true;
}

/**
 * Gömbi 3D vonallánc (varrásvonal) rajzolása
 */
function drawSphericalPolyline(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  theta: number,
  R: number,
  cx: number,
  cy: number,
  cosT: number,
  sinT: number
): void {
  const projected = points.map(([lon, lat]) =>
    projectSphere(lon, lat, theta, R, cx, cy, cosT, sinT)
  );

  ctx.beginPath();
  let started = false;
  for (let i = 0; i < projected.length; i++) {
    const p = projected[i];
    if (p.z > -0.05) {
      if (!started) {
        ctx.moveTo(p.x, p.y);
        started = true;
      } else {
        ctx.lineTo(p.x, p.y);
      }
    } else {
      started = false;
    }
  }
  ctx.stroke();
}

/**
 * 2026 FIFA World Cup Official Match Ball: ADIDAS TRIONDA PRO
 * Élethű, prémium 3D-ben, ultra-lassan és finoman forgó hivatalos meccslabda.
 */
export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 42,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isSuperSpinning, setIsSuperSpinning] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina / HiDPI kijelző támogatás (2x felbontás a borotvaéles vektorgrafikához)
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2.5);
    const pixelSize = Math.round(size * dpr);
    canvas.width = pixelSize;
    canvas.height = pixelSize;

    const R = Math.round(pixelSize * 0.38); // A labda sugara a canvas közepén
    const cx = pixelSize / 2;
    const cy = pixelSize / 2;

    // 14 fokos természetes forgástengely dőlés
    const tilt = (14 * Math.PI) / 180;
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);

    // ================= TRIONDA PRO 3D GÖMBI KOORDINÁTÁK =================
    // 3 Aerodinamikai Nemzeti Hullámszárny (120 fokos körosztásban)
    // 1. USA Kobaltkék hullám (Pacific/Atlantic Navy & Royal Blue)
    const waveUSA: [number, number][] = [
      [-0.45, 0.35],
      [-0.2, 0.55],
      [0.15, 0.48],
      [0.45, 0.25],
      [0.55, 0.05],
      [0.35, -0.08],
      [0.1, 0.08],
      [-0.15, 0.18],
      [-0.35, 0.12],
      [-0.45, 0.22],
    ];

    const innerUSA: [number, number][] = [
      [-0.3, 0.32],
      [-0.1, 0.44],
      [0.2, 0.38],
      [0.35, 0.2],
      [0.22, 0.08],
      [0.05, 0.18],
      [-0.18, 0.24],
    ];

    // 2. Mexikó Smaragdzöld hullám (Aztec & Sierra Emerald Green, +120 fok)
    const offsetMex = (2 * Math.PI) / 3;
    const waveMex: [number, number][] = [
      [offsetMex - 0.45, -0.15],
      [offsetMex - 0.2, 0.1],
      [offsetMex + 0.15, 0.25],
      [offsetMex + 0.45, 0.15],
      [offsetMex + 0.55, -0.08],
      [offsetMex + 0.35, -0.3],
      [offsetMex + 0.1, -0.22],
      [offsetMex - 0.15, -0.1],
      [offsetMex - 0.35, -0.22],
      [offsetMex - 0.45, -0.18],
    ];

    const innerMex: [number, number][] = [
      [offsetMex - 0.3, -0.08],
      [offsetMex - 0.08, 0.12],
      [offsetMex + 0.22, 0.16],
      [offsetMex + 0.36, 0.06],
      [offsetMex + 0.22, -0.14],
      [offsetMex + 0.04, -0.08],
      [offsetMex - 0.18, -0.04],
    ];

    // 3. Kanada Rubinpiros hullám (Crimson Maple, +240 fok)
    const offsetCan = (4 * Math.PI) / 3;
    const waveCan: [number, number][] = [
      [offsetCan - 0.45, 0.1],
      [offsetCan - 0.25, -0.2],
      [offsetCan + 0.05, -0.38],
      [offsetCan + 0.35, -0.28],
      [offsetCan + 0.5, -0.05],
      [offsetCan + 0.35, 0.18],
      [offsetCan + 0.1, 0.12],
      [offsetCan - 0.1, -0.02],
      [offsetCan - 0.3, 0.02],
      [offsetCan - 0.42, 0.08],
    ];

    const innerCan: [number, number][] = [
      [offsetCan - 0.3, -0.06],
      [offsetCan - 0.15, -0.22],
      [offsetCan + 0.12, -0.26],
      [offsetCan + 0.32, -0.14],
      [offsetCan + 0.2, 0.06],
      [offsetCan + 0.04, 0.02],
      [offsetCan - 0.15, -0.04],
    ];

    // 4-Paneles ívelt mélyvarrások (Thermally-bonded aerodynamic panel seams)
    const seam1: [number, number][] = [
      [-0.8, 1.2],
      [-0.4, 0.7],
      [-0.05, 0.3],
      [0.35, -0.1],
      [0.6, -0.5],
      [0.8, -1.2],
    ];
    const seam2: [number, number][] = [
      [offsetMex - 0.8, 1.2],
      [offsetMex - 0.4, 0.7],
      [offsetMex - 0.05, 0.3],
      [offsetMex + 0.35, -0.1],
      [offsetMex + 0.6, -0.5],
      [offsetMex + 0.8, -1.2],
    ];
    const seam3: [number, number][] = [
      [offsetCan - 0.8, 1.2],
      [offsetCan - 0.4, 0.7],
      [offsetCan - 0.05, 0.3],
      [offsetCan + 0.35, -0.1],
      [offsetCan + 0.6, -0.5],
      [offsetCan + 0.8, -1.2],
    ];

    let animId: number;
    let rotationAngle = 0;
    let lastTime = performance.now();
    let isTabVisible = true;

    const handleVisibility = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        lastTime = performance.now();
        animId = requestAnimationFrame(render);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    const render = (now: number) => {
      if (!isTabVisible) return;

      const dt = Math.min(64, now - lastTime);
      lastTime = now;

      // FORGÁSI SEBESSÉG: Ultra-lassú, elegáns és méltóságteljes (~45 mp / teljes 360° kör)
      let speed = 0.00014; // Nyugodt, luxus 3D forgási sebesség
      if (isSuperSpinning) speed = 0.0028;
      else if (isHovered) speed = 0.00032;

      rotationAngle += speed * dt;
      if (rotationAngle > Math.PI * 2) rotationAngle -= Math.PI * 2;

      const theta = rotationAngle;

      ctx.clearRect(0, 0, pixelSize, pixelSize);

      // ================= 1. KÜLSŐ ORBITÁLIS TECH GYŰRŰ =================
      ctx.save();
      const orbitAngle = now * 0.0006;
      // Arany & smaragd finom technológiai aura
      const haloGrad = ctx.createRadialGradient(cx, cy, R * 0.88, cx, cy, R * 1.24);
      haloGrad.addColorStop(0, 'rgba(245, 158, 11, 0.22)');
      haloGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.12)');
      haloGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.24, 0, Math.PI * 2);
      ctx.fill();

      // Arany és smaragd diszkrét keringési ívek
      ctx.strokeStyle = isHovered ? '#FDE68A' : 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 1.2 * dpr;
      ctx.setLineDash([7 * dpr, 6 * dpr]);
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.14, orbitAngle, orbitAngle + Math.PI * 1.2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1 * dpr;
      ctx.setLineDash([4 * dpr, 7 * dpr]);
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.14, -orbitAngle, -orbitAngle + Math.PI * 0.9);
      ctx.stroke();
      ctx.restore();

      // ================= 2. 3D SZFÉRA MASZK & ALAPTEST =================
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip(); // Minden gömbfelületre rajzolt elem borotvaélesen lekerekítve

      // Bázis Gyöngyházfehér 3D Bőrgömb (fénypont a bal felső részben)
      const lightX = cx - R * 0.32;
      const lightY = cy - R * 0.35;
      const ballBase = ctx.createRadialGradient(lightX, lightY, R * 0.08, cx, cy, R * 1.05);
      ballBase.addColorStop(0, '#FFFFFF');
      ballBase.addColorStop(0.4, '#F8FAFC');
      ballBase.addColorStop(0.75, '#E2E8F0');
      ballBase.addColorStop(0.95, '#94A3B8');
      ballBase.addColorStop(1, '#475569');
      ctx.fillStyle = ballBase;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

      // Finom mikro-domborítás (Hexagonális bőr textúra átlátszóan)
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.25)';
      ctx.lineWidth = 0.6 * dpr;
      const hexStep = 6 * dpr;
      for (let x = cx - R; x < cx + R; x += hexStep) {
        ctx.beginPath();
        ctx.moveTo(x, cy - R);
        ctx.lineTo(x, cy + R);
        ctx.stroke();
      }

      // ================= 3. TRIONDA PRO 4-PANELES MÉLYVARRÁSOK =================
      // Mély varrás-árnyék és domború világos perem
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Sötét belső varrás-árok
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.65)';
      ctx.lineWidth = 2.2 * dpr;
      drawSphericalPolyline(ctx, seam1, theta, R, cx, cy, cosT, sinT);
      drawSphericalPolyline(ctx, seam2, theta, R, cx, cy, cosT, sinT);
      drawSphericalPolyline(ctx, seam3, theta, R, cx, cy, cosT, sinT);

      // Fényes varrás-perem kiemelés
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 0.9 * dpr;
      drawSphericalPolyline(ctx, seam1, theta + 0.03, R, cx, cy, cosT, sinT);
      drawSphericalPolyline(ctx, seam2, theta + 0.03, R, cx, cy, cosT, sinT);
      drawSphericalPolyline(ctx, seam3, theta + 0.03, R, cx, cy, cosT, sinT);

      // ================= 4. A 3 HITELES TRIONDA PRO HULLÁM =================

      // A) 1. Hullám: USA KOBALT- ÉS ÉGSZÍNKÉK (Stars & Stripes dinamizmus)
      if (drawSphericalPolygon(ctx, waveUSA, theta, R, cx, cy, cosT, sinT)) {
        // Arany szegély (FIFA Trophy Gold)
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2.2 * dpr;
        ctx.stroke();

        // Kék színátmenet
        const usaGrad = ctx.createLinearGradient(cx - R * 0.4, cy - R * 0.2, cx + R * 0.4, cy + R * 0.2);
        usaGrad.addColorStop(0, '#0F172A');
        usaGrad.addColorStop(0.3, '#1D4ED8');
        usaGrad.addColorStop(0.7, '#2563EB');
        usaGrad.addColorStop(1, '#38BDF8');
        ctx.fillStyle = usaGrad;
        ctx.fill();

        // Belső világoskék aerodinamikai betét
        if (drawSphericalPolygon(ctx, innerUSA, theta, R, cx, cy, cosT, sinT)) {
          ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
          ctx.fill();
        }

        // Fehér csillag motívum a kék hullám szívében
        const starPos = projectSphere(-0.05, 0.35, theta, R, cx, cy, cosT, sinT);
        if (starPos.z > 0.1) {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(starPos.x, starPos.y, 2.2 * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // B) 2. Hullám: MEXIKÓ SMARAGD- ÉS JADEZÖLD (Aztec & Sierra Waves)
      if (drawSphericalPolygon(ctx, waveMex, theta, R, cx, cy, cosT, sinT)) {
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 2.2 * dpr;
        ctx.stroke();

        const mexGrad = ctx.createLinearGradient(cx - R * 0.3, cy + R * 0.3, cx + R * 0.3, cy - R * 0.3);
        mexGrad.addColorStop(0, '#064E3B');
        mexGrad.addColorStop(0.35, '#059669');
        mexGrad.addColorStop(0.75, '#10B981');
        mexGrad.addColorStop(1, '#34D399');
        ctx.fillStyle = mexGrad;
        ctx.fill();

        if (drawSphericalPolygon(ctx, innerMex, theta, R, cx, cy, cosT, sinT)) {
          ctx.fillStyle = 'rgba(209, 250, 229, 0.85)';
          ctx.fill();
        }
      }

      // C) 3. Hullám: KANADA RUBIN- ÉS SKARLÁTVÖRÖS (Crimson Maple Blades)
      if (drawSphericalPolygon(ctx, waveCan, theta, R, cx, cy, cosT, sinT)) {
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2.2 * dpr;
        ctx.stroke();

        const canGrad = ctx.createLinearGradient(cx + R * 0.4, cy - R * 0.2, cx - R * 0.4, cy + R * 0.2);
        canGrad.addColorStop(0, '#881337');
        canGrad.addColorStop(0.3, '#B91C1C');
        canGrad.addColorStop(0.7, '#EF4444');
        canGrad.addColorStop(1, '#F87171');
        ctx.fillStyle = canGrad;
        ctx.fill();

        if (drawSphericalPolygon(ctx, innerCan, theta, R, cx, cy, cosT, sinT)) {
          ctx.fillStyle = 'rgba(254, 226, 226, 0.85)';
          ctx.fill();
        }
      }

      // ================= 5. HIVATALOS MÁRKAJELZÉSEK (TRIONDA PRO WORLD CUP) =================

      // A) 1. Panel: Hivatalos ADIDAS 3-Bar Logo & "TRIONDA PRO" felirat
      const adidasPos = projectSphere(offsetMex * 0.5, 0.1, theta, R, cx, cy, cosT, sinT);
      if (adidasPos.z > 0.15) {
        ctx.save();
        ctx.translate(adidasPos.x, adidasPos.y);
        ctx.scale(adidasPos.z, adidasPos.z); // 3D perspektivikus méretcsökkenés

        // Adidas 3 sáv
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(-6 * dpr, -2 * dpr, 2.8 * dpr, 6 * dpr);
        ctx.fillRect(-1.5 * dpr, -4 * dpr, 2.8 * dpr, 8 * dpr);
        ctx.fillRect(3 * dpr, -6 * dpr, 2.8 * dpr, 10 * dpr);

        // "TRIONDA" felirat
        ctx.fillStyle = '#0F172A';
        ctx.font = `900 ${Math.max(6, 6.5 * dpr)}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('TRIONDA', 0, 9 * dpr);

        // "PRO" arany minőségi kapszula
        ctx.fillStyle = '#D97706';
        ctx.font = `bold ${Math.max(5, 5 * dpr)}px system-ui, sans-serif`;
        ctx.fillText('PRO', 0, 15 * dpr);

        ctx.restore();
      }

      // B) 2. Panel: "FIFA WORLD CUP 2026" Hivatalos Embléma
      const fifaPos = projectSphere(offsetCan * 0.5, -0.08, theta, R, cx, cy, cosT, sinT);
      if (fifaPos.z > 0.15) {
        ctx.save();
        ctx.translate(fifaPos.x, fifaPos.y);
        ctx.scale(fifaPos.z, fifaPos.z);

        // Arany trófea sziluett
        ctx.fillStyle = '#D97706';
        ctx.font = `900 ${Math.max(6, 7 * dpr)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('2026', 0, -2 * dpr);

        ctx.font = `bold ${Math.max(4.5, 5 * dpr)}px system-ui, sans-serif`;
        ctx.fillStyle = '#1E293B';
        ctx.fillText('WORLD CUP', 0, 4.5 * dpr);

        ctx.fillStyle = '#D97706';
        ctx.fillText('★ OFFICIAL ★', 0, 10.5 * dpr);

        ctx.restore();
      }

      // ================= 6. 3D FÉNYEK, ÁRNYÉKOK & FÉNYTÜKRÖZŐDÉS =================

      // A) Mélységi sötét árnyék az alsó-jobb féltekén
      const shadowGrad = ctx.createRadialGradient(cx + R * 0.45, cy + R * 0.45, R * 0.2, cx, cy, R);
      shadowGrad.addColorStop(0, 'rgba(15, 23, 42, 0)');
      shadowGrad.addColorStop(0.65, 'rgba(15, 23, 42, 0.35)');
      shadowGrad.addColorStop(1, 'rgba(2, 6, 23, 0.7)');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

      // B) Fő lágy fénytükröződés (Stadium floodlight specular highlight a bal felső peremen)
      const specX = cx - R * 0.34;
      const specY = cy - R * 0.36;
      const specGrad = ctx.createRadialGradient(specX, specY, 0, specX, specY, R * 0.55);
      specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      specGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
      specGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.08)');
      specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = specGrad;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

      // C) Finom peremfény (Rim light) a bal felső és alsó peremen
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.2 * dpr;
      ctx.beginPath();
      ctx.arc(cx, cy, R - 0.6 * dpr, Math.PI * 0.9, Math.PI * 1.6);
      ctx.stroke();

      ctx.restore(); // 3D gömb maszk lezárása

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [size, isHovered, isSuperSpinning]);

  const handleClick = () => {
    if (!interactive) return;
    setIsSuperSpinning(true);
    setTimeout(() => setIsSuperSpinning(false), 1200);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="FIFA 2026 Világbajnokság hivatalos meccslabda: adidas TRIONDA PRO • 3D forgatás"
      className={`relative inline-flex items-center justify-center select-none cursor-pointer transition-transform duration-300 ${
        isHovered ? 'scale-105' : 'scale-100'
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
        className="rounded-full drop-shadow-[0_0_12px_rgba(245,158,11,0.45)]"
      />
    </div>
  );
};
