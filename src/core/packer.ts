import * as fs from 'node:fs';
import * as path from 'node:path';
import { AstParser } from './ast-parser.js';
import { RelevanceRanker } from './relevance-ranker.js';
import { CodebaseScanner } from './scanner.js';
import { SecurityFilter } from './security-filter.js';
import { TokenEstimator } from './token-estimator.js';
import { PackedFile, PackOptions, PackResult, SecurityFinding } from './types.js';
import { JsonFormatter, MarkdownFormatter, XmlFormatter } from '../formatters/index.js';

export class RepoPacker {
  public static async pack(options: PackOptions): Promise<PackResult> {
    const rootDir = path.resolve(options.rootDir || '.');
    const mode = options.mode || 'full';
    const format = options.format || 'markdown';
    const maxTokens = options.maxTokens || 80000;
    const shouldCheckSecurity = options.securityCheck !== false;
    const shouldAutoRedact = options.autoRedact !== false;

    // 1. Scan codebase
    const files = await CodebaseScanner.scan({
      rootDir,
      include: options.includePatterns,
      exclude: options.excludePatterns
    });

    const treeView = CodebaseScanner.buildDirectoryTree(files);
    const securityFilter = new SecurityFilter();
    const allSecurityFindings: SecurityFinding[] = [];

    // Calculate raw token total
    let rawTotalTokens = 0;
    for (const file of files) {
      rawTotalTokens += TokenEstimator.estimateTokens(file.content || '', file.language);
    }

    // 2. Handle relevance ranking if query provided or mode is relevant
    let targetFiles = files;
    if (options.query || mode === 'relevant') {
      const query = options.query || '';
      const ranked = RelevanceRanker.rankFiles(files, query);
      const rankedMap = new Map(ranked.map((r) => [r.filePath, r]));

      targetFiles = files
        .filter((f) => {
          const score = rankedMap.get(f.relativePath)?.score ?? 0;
          return score > 0;
        })
        .sort((a, b) => {
          const scoreA = rankedMap.get(a.relativePath)?.score ?? 0;
          const scoreB = rankedMap.get(b.relativePath)?.score ?? 0;
          return scoreB - scoreA;
        });
    }

    // 3. Process each file based on mode
    const packedFiles: PackedFile[] = [];
    let currentTotalTokens = 0;

    for (const file of targetFiles) {
      let content = file.content || '';
      let isOutline = false;

      // AST mode or Hybrid mode
      if (mode === 'ast') {
        const outline = AstParser.extractOutline(file.relativePath, content, file.language);
        content = outline.skeletonCode;
        isOutline = true;
      } else if (mode === 'hybrid') {
        // In hybrid mode, small files or top 5 are full, others are AST outlines
        if (packedFiles.length >= 5 || content.split('\n').length > 150) {
          const outline = AstParser.extractOutline(file.relativePath, content, file.language);
          content = outline.skeletonCode;
          isOutline = true;
        }
      }

      // Security check and redaction
      if (shouldCheckSecurity) {
        const secResult = securityFilter.scanAndRedact(content, file.relativePath);
        if (secResult.findings.length > 0) {
          allSecurityFindings.push(...secResult.findings);
        }
        if (shouldAutoRedact) {
          content = secResult.cleanedContent;
        }
      }

      const fileTokens = TokenEstimator.estimateTokens(content, file.language);

      // Check maxTokens limit
      if (currentTotalTokens + fileTokens > maxTokens && packedFiles.length > 0) {
        // If we exceed budget in relevant mode, compress into outline
        if (!isOutline) {
          const outline = AstParser.extractOutline(file.relativePath, content, file.language);
          content = outline.skeletonCode;
          isOutline = true;
          const compressedTokens = TokenEstimator.estimateTokens(content, file.language);
          if (currentTotalTokens + compressedTokens <= maxTokens) {
            packedFiles.push({
              relativePath: file.relativePath,
              language: file.language,
              isAstOutline: true,
              content,
              tokenCount: compressedTokens
            });
            currentTotalTokens += compressedTokens;
            continue;
          }
        }
        break; // Reached token cap
      }

      packedFiles.push({
        relativePath: file.relativePath,
        language: file.language,
        isAstOutline: isOutline,
        content,
        tokenCount: fileTokens
      });
      currentTotalTokens += fileTokens;
    }

    // 4. Calculate Final Token Stats
    const stats = TokenEstimator.calculateStats(packedFiles, rawTotalTokens);

    // 5. Format Output
    let formattedOutput = '';
    switch (format) {
      case 'xml':
        formattedOutput = XmlFormatter.format(packedFiles, stats, treeView, options.query);
        break;
      case 'json':
        formattedOutput = JsonFormatter.format(packedFiles, stats, treeView, options.query);
        break;
      case 'markdown':
      default:
        formattedOutput = MarkdownFormatter.format(packedFiles, stats, treeView, options.query);
        break;
    }

    // 6. Write to output file if requested
    if (options.outputFile) {
      const outPath = path.resolve(options.outputFile);
      fs.writeFileSync(outPath, formattedOutput, 'utf-8');
    }

    return {
      formattedOutput,
      stats,
      securityFindings: allSecurityFindings,
      packedFiles,
      treeView
    };
  }
}
