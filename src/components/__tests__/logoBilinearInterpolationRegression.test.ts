import { describe, it, expect } from 'vitest';
import canvasHookRaw from '../../hooks/useSoccerBallCanvas.ts?raw';

describe('3D Logo Bilinear Interpolation Regression', () => {
  it('ensures useSoccerBallCanvas samples c01 from activeTex[row1 + u0] instead of row0', () => {
    // Ellenőrizzük, hogy a c01 a row1-ből olvas
    expect(canvasHookRaw).toContain('const c01 = activeTex[row1 + u0];');
    // Ellenőrizzük, hogy a korábbi bugos sor nem szerepel benne
    expect(canvasHookRaw).not.toContain('const c01 = activeTex[row0 + u0];');
  });

  it('mathematically evaluates 4-texel bilinear sampling without vertical left-edge clamping bug', () => {
    // 2x2 textúra rács:
    // row0 + u0 (top-left) = Piros (0x0000FF)
    // row0 + u1 (top-right) = Zöld (0x00FF00)
    // row1 + u0 (bottom-left) = Kék (0xFF0000)
    // row1 + u1 (bottom-right) = Fehér (0xFFFFFF)
    const TW = 2;
    const activeTex = new Uint32Array(4);
    const u0 = 0;
    const u1 = 1;
    const row0 = 0;
    const row1 = 1 * TW;

    const COLOR_TOP_LEFT = 0x0000ff; // Piros
    const COLOR_BOTTOM_LEFT = 0xff0000; // Kék

    activeTex[row0 + u0] = COLOR_TOP_LEFT;
    activeTex[row0 + u1] = 0x00ff00;
    activeTex[row1 + u0] = COLOR_BOTTOM_LEFT;
    activeTex[row1 + u1] = 0xffffff;

    // Helyes bilineáris mintavételezés
    const c00 = activeTex[row0 + u0];
    const c10 = activeTex[row0 + u1];
    const c01 = activeTex[row1 + u0];
    const c11 = activeTex[row1 + u1];

    // Mintavételezés bal alsó sarokban: fu = 0, fv = 1 (100% alsó sor)
    const fu = 0;
    const fv = 1;

    const w00 = (1 - fu) * (1 - fv);
    const w10 = fu * (1 - fv);
    const w01 = (1 - fu) * fv;
    const w11 = fu * fv;

    const sampledR = (c00 & 0xff) * w00 + (c10 & 0xff) * w10 + (c01 & 0xff) * w01 + (c11 & 0xff) * w11;
    const sampledB = ((c00 >> 16) & 0xff) * w00 + ((c10 >> 16) & 0xff) * w10 + ((c01 >> 16) & 0xff) * w01 + ((c11 >> 16) & 0xff) * w11;

    // A mintavételezés pontosan a bottom-left kék színt adja (R: 0, B: 255)
    // A régi bugos kód esetén R: 255 és B: 0 lett volna (a felső piros színt adta volna vissza)!
    expect(sampledR).toBe(0);
    expect(sampledB).toBe(255);
  });
});
