import { describe, it, expect } from 'vitest';
import { TokenEstimator } from '../src/core/token-estimator.js';

describe('TokenEstimator', () => {
  it('should estimate token counts for TypeScript code', () => {
    const code = 'export function add(a: number, b: number): number {\n  return a + b;\n}';
    const tokens = TokenEstimator.estimateTokens(code, 'typescript');
    expect(tokens).toBeGreaterThan(5);
    expect(tokens).toBeLessThan(50);
  });

  it('should compute token statistics and cost approximations', () => {
    const stats = TokenEstimator.calculateStats(
      [
        {
          relativePath: 'src/index.ts',
          language: 'typescript',
          isAstOutline: false,
          content: 'console.log("hello world");',
          tokenCount: 10
        }
      ],
      50
    );

    expect(stats.totalFiles).toBe(1);
    expect(stats.finalTokens).toBe(10);
    expect(stats.tokenSavingsPercent).toBe(80);
    expect(stats.estimatedCostUsd.claude35Sonnet).toBeDefined();
  });
});
