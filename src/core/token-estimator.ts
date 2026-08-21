import { PackedFile, SupportedLanguage, TargetModel, TokenStats } from './types.js';

export class TokenEstimator {
  private static readonly MODEL_COSTS_PER_MILLION: Record<TargetModel, number> = {
    'gpt-4o': 2.5,
    'gpt-5': 5.0,
    'claude-3-5-sonnet': 3.0,
    'claude-3-7-sonnet': 3.0,
    'gemini-1-5-pro': 1.25,
    'gemini-2-0-flash': 0.1
  };

  public static estimateTokens(text: string, language?: SupportedLanguage): number {
    if (!text || text.length === 0) return 0;

    let charsPerToken = 3.6;

    switch (language) {
      case 'json':
      case 'yaml':
        charsPerToken = 3.0;
        break;
      case 'markdown':
      case 'html':
        charsPerToken = 4.0;
        break;
      case 'typescript':
      case 'javascript':
      case 'python':
      case 'go':
      case 'rust':
      case 'c':
      case 'cpp':
      case 'csharp':
        charsPerToken = 3.5;
        break;
      default:
        charsPerToken = 3.6;
    }

    const lines = text.split('\n').length;
    const estimated = Math.ceil(text.length / charsPerToken) + Math.floor(lines * 0.15);
    return Math.max(1, estimated);
  }

  public static calculateStats(packedFiles: PackedFile[], rawTotalTokens: number): TokenStats {
    const totalFiles = packedFiles.length;
    let totalLines = 0;
    let finalTokens = 0;
    const langMap = new Map<SupportedLanguage, { fileCount: number; lines: number; tokens: number }>();

    for (const file of packedFiles) {
      const lines = file.content.split('\n').length;
      const tokens = file.tokenCount;
      totalLines += lines;
      finalTokens += tokens;

      const current = langMap.get(file.language) || { fileCount: 0, lines: 0, tokens: 0 };
      current.fileCount += 1;
      current.lines += lines;
      current.tokens += tokens;
      langMap.set(file.language, current);
    }

    const savingsPercent = rawTotalTokens > 0
      ? Math.max(0, Math.round(((rawTotalTokens - finalTokens) / rawTotalTokens) * 100))
      : 0;

    const languageStats = Array.from(langMap.entries())
      .map(([language, data]) => ({
        language,
        fileCount: data.fileCount,
        lines: data.lines,
        tokens: data.tokens,
        percentage: finalTokens > 0 ? Math.round((data.tokens / finalTokens) * 100) : 0
      }))
      .sort((a, b) => b.tokens - a.tokens);

    return {
      totalFiles,
      totalLines,
      rawTokens: rawTotalTokens,
      finalTokens,
      tokenSavingsPercent: savingsPercent,
      estimatedCostUsd: {
        gpt4o: Number(((finalTokens / 1_000_000) * this.MODEL_COSTS_PER_MILLION['gpt-4o']).toFixed(4)),
        gpt5: Number(((finalTokens / 1_000_000) * this.MODEL_COSTS_PER_MILLION['gpt-5']).toFixed(4)),
        claude35Sonnet: Number(((finalTokens / 1_000_000) * this.MODEL_COSTS_PER_MILLION['claude-3-5-sonnet']).toFixed(4)),
        gemini15Pro: Number(((finalTokens / 1_000_000) * this.MODEL_COSTS_PER_MILLION['gemini-1-5-pro']).toFixed(4))
      },
      languageStats
    };
  }

  public static estimateCost(tokens: number, model: TargetModel = 'claude-3-5-sonnet'): number {
    const rate = this.MODEL_COSTS_PER_MILLION[model] || 3.0;
    return Number(((tokens / 1_000_000) * rate).toFixed(4));
  }
}
