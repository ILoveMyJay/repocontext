import { describe, it, expect } from 'vitest';
import { AstParser } from '../src/core/ast-parser.js';

describe('AstParser', () => {
  it('should strip implementation details and retain signatures in TypeScript', () => {
    const code = `
import { Foo } from './foo';

/**
 * Greets a user by name
 */
export function greet(name: string): string {
  const message = "Hello " + name;
  console.log(message);
  return message;
}
    `;

    const outline = AstParser.extractOutline('greet.ts', code, 'typescript');
    expect(outline.skeletonCode).toContain('export function greet(name: string): string');
    expect(outline.skeletonCode).not.toContain('const message =');
    expect(outline.tokenSavingsPercent).toBeGreaterThan(0);
  });

  it('should parse Python class and function signatures', () => {
    const pyCode = `
import os

class MathEngine:
    """Performs math operations"""
    def compute(self, x: int, y: int) -> int:
        z = x * 2 + y * 3
        return z
    `;

    const outline = AstParser.extractOutline('math.py', pyCode, 'python');
    expect(outline.skeletonCode).toContain('class MathEngine:');
    expect(outline.skeletonCode).toContain('def compute(self, x: int, y: int) -> int:');
    expect(outline.skeletonCode).not.toContain('z = x * 2 + y * 3');
  });
});
