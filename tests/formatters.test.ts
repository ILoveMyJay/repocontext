import { describe, it, expect } from 'vitest';
import { MarkdownFormatter, XmlFormatter, JsonFormatter } from '../src/formatters/index.js';
import { PackedFile, TokenStats } from '../src/core/types.js';

describe('Formatters', () => {
  const mockFiles: PackedFile[] = [
    {
      relativePath: 'src/index.ts',
      language: 'typescript',
      isAstOutline: false,
      content: 'console.log("hello");',
      tokenCount: 10
    }
  ];

  const mockStats: TokenStats = {
    totalFiles: 1,
    totalLines: 1,
    rawTokens: 20,
    finalTokens: 10,
    tokenSavingsPercent: 50,
    estimatedCostUsd: { gpt4o: 0.0001, gpt5: 0.0002, claude35Sonnet: 0.0001, gemini15Pro: 0.0001 },
    languageStats: []
  };

  it('should generate valid Markdown output', () => {
    const md = MarkdownFormatter.format(mockFiles, mockStats, '├── index.ts');
    expect(md).toContain('# RepoContext Codebase Pack');
    expect(md).toContain('```typescript');
  });

  it('should generate valid XML output', () => {
    const xml = XmlFormatter.format(mockFiles, mockStats, '├── index.ts');
    expect(xml).toContain('<documents>');
    expect(xml).toContain('<document index="1">');
    expect(xml).toContain('</documents>');
  });

  it('should generate valid JSON output', () => {
    const jsonStr = JsonFormatter.format(mockFiles, mockStats, '├── index.ts');
    const parsed = JSON.parse(jsonStr);
    expect(parsed.generator).toBe('RepoContext');
    expect(parsed.files.length).toBe(1);
  });
});
