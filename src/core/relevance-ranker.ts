import { FileInfo, RelevanceScore } from './types.js';

export class RelevanceRanker {
  /**
   * Ranks codebase files based on their relevance to a user coding prompt or task.
   * Utilizes keyword frequency, path matching, symbol significance, and semantic weights.
   */
  public static rankFiles(files: FileInfo[], query: string, maxTokensBudget: number = 50000): RelevanceScore[] {
    if (!query || query.trim().length === 0) {
      return files.map((f) => ({
        filePath: f.relativePath,
        score: 1.0,
        matchedKeywords: [],
        matchedSymbols: [],
        reason: 'Default inclusion (No query specified)'
      }));
    }

    const keywords = this.extractKeywords(query);
    const scores: RelevanceScore[] = [];

    for (const file of files) {
      let score = 0;
      const matchedKeywords: string[] = [];
      const matchedSymbols: string[] = [];
      const lowerPath = file.relativePath.toLowerCase();
      const content = file.content || '';
      const lowerContent = content.toLowerCase();

      // 1. Path & Filename Match (Highest weight)
      for (const kw of keywords) {
        if (lowerPath.includes(kw)) {
          score += 15;
          matchedKeywords.push(`path:${kw}`);
        }
      }

      // 2. Exact match in filename basename
      const basename = lowerPath.split('/').pop() || '';
      for (const kw of keywords) {
        if (basename.includes(kw)) {
          score += 25;
          matchedKeywords.push(`file:${kw}`);
        }
      }

      // 3. Symbol / Code Occurrences
      for (const kw of keywords) {
        // Regex word boundary count
        const regex = new RegExp(`\\b${kw}\\b`, 'gi');
        const count = (lowerContent.match(regex) || []).length;
        if (count > 0) {
          score += Math.min(20, count * 2);
          matchedKeywords.push(`term:${kw}(x${count})`);
        }
      }

      // 4. Boost primary entrypoints if general terms match
      if (lowerPath.includes('index.') || lowerPath.includes('main.') || lowerPath.includes('app.') || lowerPath.includes('core/')) {
        score += 3;
      }

      // 5. Penalize test files slightly unless query specifically mentions test
      const queryWantsTests = lowerPath.includes('test') && query.toLowerCase().includes('test');
      if (lowerPath.includes('test') && !queryWantsTests) {
        score = Math.max(0, score * 0.7);
      }

      scores.push({
        filePath: file.relativePath,
        score: Math.round(score * 10) / 10,
        matchedKeywords: Array.from(new Set(matchedKeywords)),
        matchedSymbols,
        reason: score > 0 ? `Relevance score: ${score}` : 'Low relevance'
      });
    }

    return scores.sort((a, b) => b.score - a.score);
  }

  private static extractKeywords(query: string): string[] {
    const stopwords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'for', 'in', 'on', 'with', 'to',
      'from', 'by', 'at', 'of', 'how', 'what', 'why', 'can', 'you', 'please', 'i', 'we', 'is', 'are'
    ]);

    const words = query
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !stopwords.has(w));

    return Array.from(new Set(words));
  }
}
