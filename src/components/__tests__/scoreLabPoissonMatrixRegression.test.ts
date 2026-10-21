import { describe, it, expect } from 'vitest';
import matrixRaw from '../ScoreLabPoissonMatrix.tsx?raw';

describe('ScoreLabPoissonMatrix UI Formatting Regression', () => {
  it('does NOT contain raw LaTeX delimiters like $\\lambda_H$, $\\lambda_A$, $\\rho$ or ($1/p$)', () => {
    expect(matrixRaw).not.toContain('$\\lambda_H$');
    expect(matrixRaw).not.toContain('$\\lambda_A$');
    expect(matrixRaw).not.toContain('$\\rho$');
    expect(matrixRaw).not.toContain('($1/p$)');
  });

  it('uses clean native Unicode Greek letters λ_H, λ_A, ρ and clean (1/p) notation', () => {
    expect(matrixRaw).toContain('λ_H =');
    expect(matrixRaw).toContain('λ_A =');
    expect(matrixRaw).toContain('ρ =');
    expect(matrixRaw).toContain('(1/p)');
  });
});
