import { PackedFile, TokenStats } from '../core/types.js';

export class JsonFormatter {
  public static format(packedFiles: PackedFile[], stats: TokenStats, treeView: string, query?: string): string {
    return JSON.stringify(
      {
        generator: 'RepoContext',
        query: query || null,
        stats,
        tree: treeView,
        files: packedFiles.map((f) => ({
          path: f.relativePath,
          language: f.language,
          isAstOutline: f.isAstOutline,
          tokens: f.tokenCount,
          content: f.content
        }))
      },
      null,
      2
    );
  }
}
