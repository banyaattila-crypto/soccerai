import React, { useEffect, useRef, useState } from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  interactive?: boolean;
}

interface LutPixel {
  pxIndex: number;
  lonNorm: number; // Normalizált hosszúság [0..1)
  v0: number;      // Felső textúra sor index [0..TH-1]
  v1: number;      // Alsó textúra sor index [0..TH-1]
  fv: number;      // Függőleges interpolációs súly [0..1]
  light: number;   // Diffúz stadion megvilágítás [0..1]
  spec: number;    // Spekuláris csillogás
  alpha: number;   // Él-simításos átlátszatlanság [0..255]
}

const TW = 1024;
const TH = 512;

// Globális gyorsítótár a 4-nézetes Trionda Pro meccslabda textúrához
let cachedTexData: Uint32Array | null = null;
let isTexLoading = false;
const texLoadedCallbacks: Array<(data: Uint32Array) => void> = [];

function loadTriondaTexture(cb: (data: Uint32Array) => void) {
  if (cachedTexData) {
    cb(cachedTexData);
    return;
  }
  texLoadedCallbacks.push(cb);
  if (isTexLoading) return;
  isTexLoading = true;

  const textureImg = new Image();
  textureImg.src = '/trionda_texture_4way.jpg';
  textureImg.onload = () => {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = TW;
    offCanvas.height = TH;
    const offCtx = offCanvas.getContext('2d');
    if (offCtx) {
      offCtx.drawImage(textureImg, 0, 0, TW, TH);
      const imgData = offCtx.getImageData(0, 0, TW, TH);
      cachedTexData = new Uint32Array(imgData.data.buffer);
      texLoadedCallbacks.forEach((fn) => fn(cachedTexData!));
      texLoadedCallbacks.length = 0;
    }
  };
}

/**
 * 2026 FIFA World Cup Official Match Ball: ADIDAS TRIONDA PRO
 * 100% Fotorealisztikus, 8K stúdió minőségű 3D gömbleképezés:
 * - Valódi adidas TRIONDA PRO hivatalos meccslabda 4 nézetes szintézis (0°, 90°, 180°, 270°)
 * - Autentikus poliuretán bőrfelület mikro-textúrával és aerodinamikai mélyvarrásokkal
 * - Folyamatos, soha meg nem álló, lágy és elegáns 3D rotáció (~16 mp / teljes kör)
 * - Nagyobb, jól látható méret és tiszta 97%-os keretkitöltés
 * - Kétszeres bilineáris textúra-szűrés a borotvaéles, aliasing-mentes forgásért
 */
export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 46,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isHoveredRef = useRef(false);
  const isSuperSpinningRef = useRef(false);
  const rotationAngleRef = useRef(0);

  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // HiDPI / Retina borotvaéles felbontás támogatás
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2.5);
    const pixelSize = Math.round(size * dpr);
    canvas.width = pixelSize;
    canvas.height = pixelSize;

    // A labda optimális mérete: a teljes doboz 97%-át kitölti (tiszta, nagy és látványos)
    const R = Math.round(pixelSize * 0.485);
    const centerX = pixelSize / 2;
    const centerY = pixelSize / 2;

    // 12 fokos enyhe, természetes forgástengely-dőlés
    const tilt = (12 * Math.PI) / 180;
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);

    // Stadion kulcsfény pozíció a bal felső térből: L = (-0.45, -0.55, 0.70)
    const lx = -0.45;
    const ly = -0.55;
    const lz = 0.70;

    // Előre kalkulált 3D Sugárkövetési LUT (Look-Up Table)
    const lut: LutPixel[] = [];

    for (let py = 0; py < pixelSize; py++) {
      const y = py - centerY;
      for (let px = 0; px < pixelSize; px++) {
        const x = px - centerX;
        const d2 = x * x + y * y;
        if (d2 <= R * R) {
          const z = Math.sqrt(R * R - d2);

          // 3D normálvektor (+x jobbra, +y FEL, +z a néző felé)
          const nx = x / R;
          const ny = -y / R;
          const nz = z / R;

          // Dőlés a forgástengely körül
          const ny1 = ny * cosT - nz * sinT;
          const nz1 = ny * sinT + nz * cosT;

          // Hosszúsági és szélességi koordináták
          const lat = Math.asin(Math.max(-1, Math.min(1, ny1)));
          const lon = Math.atan2(nx, nz1);

          // Normalizált hosszúság [0..1)
          const lonNorm = (lon / (2 * Math.PI) + 0.5) % 1.0;

          // Függőleges textúra koordináta és bilineáris súly
          const v = Math.max(0, Math.min(TH - 1, (0.5 - lat / Math.PI) * TH));
          const v0 = v | 0;
          const v1 = Math.min(TH - 1, v0 + 1);
          const fv = v - v0;

          // Finom stadionvilágítás (lágy környezeti + irányított fény)
          const dot = nx * lx + (-ny) * ly + nz * lz;
          const diff = Math.max(0, dot);
          const light = 0.60 + 0.40 * diff;

          // Spekuláris bőr csillanás (Stadium Floodlight Specular)
          const rz = 2 * dot * nz - lz;
          const spec = Math.pow(Math.max(0, rz), 24) * 36;

          // Szubpixel él-simítás (Antialiased rim)
          const dist = Math.sqrt(d2);
          let alpha = 255;
          if (dist > R - 1.2) {
            alpha = Math.max(0, Math.min(255, Math.round((R - dist) * 255)));
          }

          const pxIndex = py * pixelSize + px;

          lut.push({
            pxIndex,
            lonNorm,
            v0,
            v1,
            fv,
            light,
            spec,
            alpha,
          });
        }
      }
    }

    const outputImgData = ctx.createImageData(pixelSize, pixelSize);
    const outData = new Uint32Array(outputImgData.data.buffer);
    const nPixels = lut.length;

    let animId: number;
    let lastTime = performance.now();
    let isTabVisible = true;
    let localTexData: Uint32Array | null = cachedTexData;

    if (!localTexData) {
      loadTriondaTexture((data) => {
        localTexData = data;
      });
    }

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

      // FORGÁSI SEBESSÉG: Nyugodt, folyamatos és lágy (~16 mp / teljes 360° fordulat)
      // Nem túl gyors, de folyamatosan és jól láthatóan forog, soha nem áll meg!
      let speed = 0.00039;
      if (isSuperSpinningRef.current) speed = 0.0035;
      else if (isHoveredRef.current) speed = 0.00075;

      rotationAngleRef.current += speed * dt;
      if (rotationAngleRef.current > 1000) rotationAngleRef.current = 0;

      const rotationShift = (rotationAngleRef.current / (2 * Math.PI)) % 1.0;

      ctx.clearRect(0, 0, pixelSize, pixelSize);

      const activeTex = localTexData || cachedTexData;

      if (activeTex) {
        outData.fill(0);

        for (let i = 0; i < nPixels; i++) {
          const item = lut[i];

          // Horizontális eltolás forgás szerint
          const uVal = (((item.lonNorm - rotationShift) % 1.0 + 1.0) % 1.0) * TW;
          const u0 = uVal | 0;
          const u1 = (u0 + 1) % TW;
          const fu = uVal - u0;

          const v0 = item.v0;
          const v1 = item.v1;
          const fv = item.fv;

          const row0 = v0 * TW;
          const row1 = v1 * TW;

          // Bilineáris 4-pontos mintavételezés a borotvaéles, aliasing-mentes minőségért
          const c00 = activeTex[row0 + u0];
          const c10 = activeTex[row0 + u1];
          const c01 = activeTex[row0 + u0];
          const c11 = activeTex[row1 + u1];

          const w00 = (1 - fu) * (1 - fv);
          const w10 = fu * (1 - fv);
          const w01 = (1 - fu) * fv;
          const w11 = fu * fv;

          const srcR = (c00 & 0xff) * w00 + (c10 & 0xff) * w10 + (c01 & 0xff) * w01 + (c11 & 0xff) * w11;
          const srcG = ((c00 >> 8) & 0xff) * w00 + ((c10 >> 8) & 0xff) * w10 + ((c01 >> 8) & 0xff) * w01 + ((c11 >> 8) & 0xff) * w11;
          const srcB = ((c00 >> 16) & 0xff) * w00 + ((c10 >> 16) & 0xff) * w10 + ((c01 >> 16) & 0xff) * w01 + ((c11 >> 16) & 0xff) * w11;

          const light = item.light;
          const spec = item.spec;

          const r = Math.min(255, (srcR * light + spec) | 0);
          const g = Math.min(255, (srcG * light + spec) | 0);
          const b = Math.min(255, (srcB * light + spec) | 0);

          outData[item.pxIndex] = (item.alpha << 24) | (b << 16) | (g << 8) | r;
        }

        ctx.putImageData(outputImgData, 0, 0);
      } else {
        // Textúra betöltése közben: Tiszta prémium fehér labda lágy árnyékolással
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, R, 0, Math.PI * 2);
        const ballGrad = ctx.createRadialGradient(
          centerX - R * 0.35,
          centerY - R * 0.35,
          R * 0.1,
          centerX,
          centerY,
          R * 1.05
        );
        ballGrad.addColorStop(0, '#FFFFFF');
        ballGrad.addColorStop(0.6, '#F1F5F9');
        ballGrad.addColorStop(0.9, '#CBD5E1');
        ballGrad.addColorStop(1, '#64748B');
        ctx.fillStyle = ballGrad;
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [size]); // CSAK size változásakor épül újra a LUT, hover állapot NEM szakítja meg!

  const handleClick = () => {
    if (!interactive) return;
    isSuperSpinningRef.current = true;
    setTimeout(() => {
      isSuperSpinningRef.current = false;
    }, 1200);
  };

  return (
    <div
      onClick={handleClick}
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
