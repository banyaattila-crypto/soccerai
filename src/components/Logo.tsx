import React, { useEffect, useRef, useState } from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  interactive?: boolean;
}

/**
 * 2026-os FIFA Világbajnokság (USA - Mexikó - Kanada) Hivatalos Meccslabda (adidas Trionda)
 * Nagy felbontású equirectangular textúra generálás az offscreen canvas-en:
 * - Gyöngyházfehér alap finom bőrmintázattal
 * - 4-paneles forradalmi aerodinamikai mélyvarrások
 * - 3 dinamikus nemzeti hullám (USA kobaltkék, Mexikó smaragdzöld, Kanada rubinpiros)
 * - Arany FIFA trófea szegélyek és hivatalos 2026 / adidas jelvények
 */
function createTriondaTexture(): Uint32Array {
  const TW = 384;
  const TH = 192;

  if (typeof document === 'undefined') {
    return new Uint32Array(TW * TH).fill(0xffffffff);
  }

  const canvas = document.createElement('canvas');
  canvas.width = TW;
  canvas.height = TH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Uint32Array(TW * TH).fill(0xffffffff);

  // 1. Gyöngyházfehér alaptest finom mikromintázattal
  const bgGrad = ctx.createLinearGradient(0, 0, 0, TH);
  bgGrad.addColorStop(0, '#FFFFFF');
  bgGrad.addColorStop(0.5, '#F8FAFC');
  bgGrad.addColorStop(1, '#F1F5F9');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, TW, TH);

  // Finom bőr textúra hexagonális mikro-rács
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)';
  ctx.lineWidth = 0.5;
  const step = 8;
  for (let x = 0; x < TW; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, TH);
    ctx.stroke();
  }
  for (let y = 0; y < TH; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(TW, y);
    ctx.stroke();
  }

  // 2. A 3 Fő Hullám (Tri-Onda) kirajzolása
  // A) 1. Hullám: USA Kobalt- és Királykék (csillag motívumokkal és arany szegéllyel)
  const drawWave = (
    centerX: number,
    centerY: number,
    color1: string,
    color2: string,
    color3: string,
    goldColor: string,
    isStar: boolean
  ) => {
    ctx.save();
    ctx.translate(centerX, centerY);

    // Fő aerodinamikai hullámszalag
    const waveGrad = ctx.createLinearGradient(-50, -40, 50, 40);
    waveGrad.addColorStop(0, color1);
    waveGrad.addColorStop(0.5, color2);
    waveGrad.addColorStop(1, color3);

    // Külső arany szegély (FIFA Trophy Gold)
    ctx.strokeStyle = goldColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-58, -34);
    ctx.bezierCurveTo(-30, -55, 30, -10, 60, -38);
    ctx.bezierCurveTo(45, 15, 10, 45, -35, 30);
    ctx.bezierCurveTo(-55, 20, -65, -5, -58, -34);
    ctx.closePath();
    ctx.stroke();

    // Belső színes dinamikus hullámtest
    ctx.fillStyle = waveGrad;
    ctx.beginPath();
    ctx.moveTo(-56, -32);
    ctx.bezierCurveTo(-28, -52, 28, -8, 58, -36);
    ctx.bezierCurveTo(43, 13, 8, 43, -33, 28);
    ctx.bezierCurveTo(-53, 18, -63, -3, -56, -32);
    ctx.closePath();
    ctx.fill();

    // Másodlagos belső aerodinamikai vágat
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.moveTo(-40, -20);
    ctx.bezierCurveTo(-15, -35, 15, -5, 38, -25);
    ctx.bezierCurveTo(28, 5, 5, 25, -20, 15);
    ctx.closePath();
    ctx.fill();

    // Grafikai díszítő motívum (USA csillag vagy Mexikó tollív)
    if (isStar) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-10, -5, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(15, 5, 2.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(20, 0);
      ctx.stroke();
    }

    ctx.restore();
  };

  // 1. Hullámpár (USA Kék: Pacific & Atlantic Navy)
  drawWave(TW * 0.18, TH * 0.42, '#0F172A', '#1D4ED8', '#38BDF8', '#F59E0B', true);
  drawWave(TW * 0.68, TH * 0.45, '#0F172A', '#1D4ED8', '#38BDF8', '#F59E0B', true);

  // 2. Hullámpár (Mexikó Smaragdzöld: Sierra & Aztec Green)
  drawWave(TW * 0.38, TH * 0.72, '#064E3B', '#059669', '#34D399', '#FBBF24', false);
  drawWave(TW * 0.88, TH * 0.70, '#064E3B', '#059669', '#34D399', '#FBBF24', false);

  // 3. Hullámpár (Kanada Rubinpiros: Crimson Maple)
  drawWave(TW * 0.38, TH * 0.22, '#881337', '#DC2626', '#F87171', '#F59E0B', false);
  drawWave(TW * 0.88, TH * 0.20, '#881337', '#DC2626', '#F87171', '#F59E0B', false);

  // 3. Forradalmi 4-paneles ívelt mélyvarrások (Debossed aerodynamic seams)
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.75)';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(0, TH * 0.5);
  ctx.bezierCurveTo(TW * 0.25, TH * 0.1, TW * 0.25, TH * 0.9, TW * 0.5, TH * 0.5);
  ctx.bezierCurveTo(TW * 0.75, TH * 0.1, TW * 0.75, TH * 0.9, TW, TH * 0.5);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, TH * 0.15);
  ctx.bezierCurveTo(TW * 0.3, TH * 0.35, TW * 0.7, TH * 0.05, TW, TH * 0.25);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, TH * 0.85);
  ctx.bezierCurveTo(TW * 0.3, TH * 0.65, TW * 0.7, TH * 0.95, TW, TH * 0.75);
  ctx.stroke();

  // 4. Hivatalos FIFA World Cup 2026 & Trionda Feliratok és Adidas 3-Bar Logo
  // Adidas embléma a fehér bőrön
  ctx.save();
  ctx.translate(TW * 0.5, TH * 0.28);
  ctx.fillStyle = '#0F172A';
  // 3 sáv
  ctx.fillRect(-6, -4, 3, 8);
  ctx.fillRect(-1, -6, 3, 10);
  ctx.fillRect(4, -8, 3, 12);
  ctx.restore();

  // FIFA World Cup 2026 Arany Embléma
  ctx.save();
  ctx.translate(TW * 0.5, TH * 0.72);
  ctx.fillStyle = '#D97706';
  ctx.font = 'bold 9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FIFA 2026', 0, -2);
  ctx.font = 'bold 7px system-ui, sans-serif';
  ctx.fillStyle = '#1E293B';
  ctx.fillText('TRIONDA', 0, 7);
  ctx.restore();

  const imgData = ctx.getImageData(0, 0, TW, TH);
  return new Uint32Array(imgData.data.buffer);
}

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

    // Retina / HiDPI skálázás a borotvaéles megjelenítéshez
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2.5);
    const pixelSize = Math.round(size * dpr);
    canvas.width = pixelSize;
    canvas.height = pixelSize;

    const R = Math.round(pixelSize * 0.38); // A labda sugara a canvas közepén
    const centerX = pixelSize / 2;
    const centerY = pixelSize / 2;

    const TW = 384;
    const TH = 192;
    const texData = createTriondaTexture();

    // 3D Szféra Sugárkövetési Előszámítás (Lookup Table - LUT a maximális FPS-hez)
    const tilt = (14 * Math.PI) / 180; // 14 fokos természetes dőlésszög
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);

    interface LutPixel {
      pxIndex: number;
      u0: number;
      v: number;
      diffuse: number;
      specular: number;
      rim: number;
    }

    const lut: LutPixel[] = [];

    // Fényforrás pozíciója a bal felső térből: L = (-0.42, -0.55, 0.72) normalizálva
    const lx = -0.42;
    const ly = -0.55;
    const lz = 0.72;

    for (let y = -R; y <= R; y++) {
      for (let x = -R; x <= R; x++) {
        const d2 = x * x + y * y;
        if (d2 <= R * R) {
          const z = Math.sqrt(R * R - d2);
          const nx = x / R;
          const ny = y / R;
          const nz = z / R;

          // Döntött tengely körüli koordinátatranszformáció
          const y1 = y * cosT + z * sinT;
          const z1 = -y * sinT + z * cosT;

          // Hosszúsági és szélességi körök
          const lon0 = Math.atan2(x, z1); // -PI .. PI
          const lat = Math.asin(Math.max(-1, Math.min(1, y1 / R))); // -PI/2 .. PI/2

          const u0 = (lon0 / (2 * Math.PI) + 0.5) * TW;
          const v = Math.max(0, Math.min(TH - 1, ((0.5 - lat / Math.PI) * TH) | 0));

          // 3D Fény-árnyék számítás: Diffúz + Környezeti + Spekuláris csillanás + Peremfény
          const dot = nx * lx + ny * ly + nz * lz;
          const diff = Math.max(0, dot);
          const ambient = 0.38 + 0.62 * diff;

          // Visszavert sugár a fényes bőrfelülethez (Specular Phong rz a kamera (0,0,1) felé)
          const rz = 2 * dot * nz - lz;
          const specDot = Math.max(0, rz);
          const spec = Math.pow(specDot, 14) * 0.95;

          // Finom peremfény (Rim light) a labda sziluettjén
          const rim = Math.pow(1 - nz, 3) * 0.35;

          const pxIndex = Math.round(centerY + y) * pixelSize + Math.round(centerX + x);

          lut.push({
            pxIndex,
            u0,
            v,
            diffuse: ambient,
            specular: spec,
            rim,
          });
        }
      }
    }

    const outputImgData = ctx.createImageData(pixelSize, pixelSize);
    const outData = new Uint32Array(outputImgData.data.buffer);
    const nPixels = lut.length;

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

      // Forgási sebesség szabályozás: Alap: ~16 mp / teljes 360 kör; Hover: enyhén gyorsabb; Click: szuperspin
      let speed = 0.00038;
      if (isSuperSpinning) speed = 0.0035;
      else if (isHovered) speed = 0.00075;

      rotationAngle += speed * dt;
      if (rotationAngle > 1000) rotationAngle = 0;

      const thetaShift = (rotationAngle * TW) % TW;

      // 1. Háttér törlése
      outData.fill(0);

      // 2. 3D Gömb felületének pixel alapú renderelése (LUT-tal ~0.4ms)
      for (let i = 0; i < nPixels; i++) {
        const item = lut[i];
        const u = ((item.u0 + thetaShift) % TW + TW) % TW | 0;
        const v = item.v;

        const srcCol = texData[v * TW + u];
        const srcR = srcCol & 0xff;
        const srcG = (srcCol >> 8) & 0xff;
        const srcB = (srcCol >> 16) & 0xff;

        // Fény-árnyék és csillanás szintézis
        const light = item.diffuse;
        const specVal = item.specular * 255;
        const rimVal = item.rim * 255;

        const r = Math.min(255, (srcR * light + specVal + rimVal) | 0);
        const g = Math.min(255, (srcG * light + specVal + rimVal) | 0);
        const b = Math.min(255, (srcB * light + specVal + rimVal * 1.2) | 0);

        outData[item.pxIndex] = (255 << 24) | (b << 16) | (g << 8) | r;
      }

      ctx.putImageData(outputImgData, 0, 0);

      // 3. Külső Prémium Arany/Smaragd Fénykoszorú (Orbital Tech Glow)
      ctx.save();
      const orbitAngle = now * 0.001;

      // Lágy külső árnyék és aura
      const grad = ctx.createRadialGradient(centerX, centerY, R * 0.9, centerX, centerY, R * 1.22);
      grad.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
      grad.addColorStop(0.6, 'rgba(16, 185, 129, 0.15)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, R * 1.22, 0, Math.PI * 2);
      ctx.fill();

      // Finom arany keringési ív
      ctx.strokeStyle = isHovered ? '#FDE68A' : 'rgba(245, 158, 11, 0.45)';
      ctx.lineWidth = 1.2 * dpr;
      ctx.setLineDash([8 * dpr, 6 * dpr]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, R * 1.12, orbitAngle, orbitAngle + Math.PI * 1.3);
      ctx.stroke();

      // Smaragd ellentétes ív
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1 * dpr;
      ctx.setLineDash([4 * dpr, 8 * dpr]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, R * 1.12, -orbitAngle, -orbitAngle + Math.PI);
      ctx.stroke();

      ctx.restore();

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
    setTimeout(() => setIsSuperSpinning(false), 1400);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="FIFA 2026 Világbajnokság hivatalos meccslabda (adidas Trionda) • 3D forgatás"
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
        className="rounded-full drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]"
      />
    </div>
  );
};
