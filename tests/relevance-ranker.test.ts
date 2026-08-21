import { describe, it, expect } from 'vitest';
import { RelevanceRanker } from '../src/core/relevance-ranker.js';
import { FileInfo } from '../src/core/types.js';

describe('RelevanceRanker', () => {
  const sampleFiles: FileInfo[] = [
    {
      path: '/auth/jwt.ts',
      relativePath: 'src/auth/jwt.ts',
      extension: '.ts',
      language: 'typescript',
      sizeBytes: 500,
      lineCount: 20,
      isBinary: false,
      content: 'export function verifyJwtToken(token: string) { return true; }'
    },
    {
      path: '/ui/button.tsx',
      relativePath: 'src/ui/button.tsx',
      extension: '.tsx',
      language: 'typescript',
      sizeBytes: 300,
      lineCount: 15,
      isBinary: false,
      content: 'export const Button = () => <button>Click</button>;'
    }
  ];

  it('should rank auth files higher when searching for authentication queries', () => {
    const ranked = RelevanceRanker.rankFiles(sampleFiles, 'Fix JWT token authentication verification');
    expect(ranked[0].filePath).toBe('src/auth/jwt.ts');
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });
});
