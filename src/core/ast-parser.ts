import { AstOutline, AstSymbol, SupportedLanguage } from './types.js';
import { TokenEstimator } from './token-estimator.js';

export class AstParser {
  /**
   * Generates a token-compact semantic AST skeleton of source code.
   * Strips implementation details while preserving types, signatures, docstrings, and exports.
   */
  public static extractOutline(filePath: string, content: string, language: SupportedLanguage): AstOutline {
    const originalLines = content.split('\n').length;
    const originalTokens = TokenEstimator.estimateTokens(content, language);

    let skeletonCode = '';
    const symbols: AstSymbol[] = [];
    const imports: string[] = [];
    const exports: string[] = [];

    switch (language) {
      case 'typescript':
      case 'javascript':
        skeletonCode = this.parseTypeScript(content, symbols, imports, exports);
        break;
      case 'python':
        skeletonCode = this.parsePython(content, symbols, imports, exports);
        break;
      case 'go':
        skeletonCode = this.parseGo(content, symbols, imports, exports);
        break;
      case 'rust':
        skeletonCode = this.parseRust(content, symbols, imports, exports);
        break;
      default:
        skeletonCode = this.parseGeneric(content);
    }

    const skeletonLines = skeletonCode.split('\n').length;
    const skeletonTokens = TokenEstimator.estimateTokens(skeletonCode, language);
    const tokenSavingsPercent = originalTokens > 0
      ? Math.max(0, Math.round(((originalTokens - skeletonTokens) / originalTokens) * 100))
      : 0;

    return {
      filePath,
      language,
      symbols,
      imports,
      exports,
      skeletonCode,
      originalLines,
      skeletonLines,
      originalTokens,
      skeletonTokens,
      tokenSavingsPercent
    };
  }

  private static parseTypeScript(
    content: string,
    symbols: AstSymbol[],
    imports: string[],
    exportsList: string[]
  ): string {
    const lines = content.split('\n');
    const result: string[] = [];
    let inDocComment = false;
    let docBuffer: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Collect doc comments
      if (trimmed.startsWith('/**') || trimmed.startsWith('/*')) {
        inDocComment = true;
        docBuffer.push(line);
        if (trimmed.endsWith('*/')) {
          inDocComment = false;
          result.push(docBuffer.join('\n'));
          docBuffer = [];
        }
        continue;
      }
      if (inDocComment) {
        docBuffer.push(line);
        if (trimmed.endsWith('*/')) {
          inDocComment = false;
          result.push(docBuffer.join('\n'));
          docBuffer = [];
        }
        continue;
      }

      // Imports
      if (trimmed.startsWith('import ') || trimmed.startsWith('import{') || trimmed.startsWith('import type ')) {
        imports.push(trimmed);
        result.push(line);
        continue;
      }

      // Interface or Type alias
      if (/^(?:export\s+)?(?:interface|type)\s+([A-Za-z0-9_]+)/.test(trimmed)) {
        result.push(line);
        const match = trimmed.match(/^(?:export\s+)?(?:interface|type)\s+([A-Za-z0-9_]+)/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: trimmed.includes('interface') ? 'interface' : 'type',
            lineStart: i + 1,
            lineEnd: i + 1,
            signature: trimmed
          });
        }
        continue;
      }

      // Class or Enum
      if (/^(?:export\s+)?(?:abstract\s+)?(?:class|enum)\s+([A-Za-z0-9_]+)/.test(trimmed)) {
        result.push(line);
        const match = trimmed.match(/^(?:export\s+)?(?:abstract\s+)?(?:class|enum)\s+([A-Za-z0-9_]+)/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: trimmed.includes('enum') ? 'enum' : 'class',
            lineStart: i + 1,
            lineEnd: i + 1,
            signature: trimmed
          });
        }
        continue;
      }

      // Exported const/let/var functions
      if (/^export\s+(?:const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z0-9_]+)\s*=>/.test(trimmed)) {
        const sig = trimmed.replace(/=>\s*\{[\s\S]*$/, '=> { /* ... */ };');
        result.push(sig);
        exportsList.push(trimmed);
        continue;
      }

      // Function or Method declarations
      if (/^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)/.test(trimmed) ||
          /^(?:public|private|protected|static|async|\s)*[A-Za-z0-9_]+\s*\([^)]*\)\s*:\s*[^{]+/.test(trimmed)) {
        const cleaned = line.replace(/\{[\s\S]*$/, '{ /* ... */ }');
        result.push(cleaned);
        const nameMatch = trimmed.match(/(?:function\s+([A-Za-z0-9_]+)|([A-Za-z0-9_]+)\s*\()/);
        if (nameMatch) {
          symbols.push({
            name: nameMatch[1] || nameMatch[2],
            kind: 'function',
            lineStart: i + 1,
            lineEnd: i + 1,
            signature: trimmed
          });
        }
        continue;
      }

      // Export statements
      if (trimmed.startsWith('export ') || trimmed.startsWith('export {') || trimmed.startsWith('export default ')) {
        exportsList.push(trimmed);
        result.push(line);
        continue;
      }
    }

    return result.length > 0 ? result.join('\n') : '// [Empty or non-symbolic TypeScript content]';
  }

  private static parsePython(
    content: string,
    symbols: AstSymbol[],
    imports: string[],
    exportsList: string[]
  ): string {
    const lines = content.split('\n');
    const result: string[] = [];
    let inDocstring = false;
    let docQuote = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
        if (!inDocstring) {
          inDocstring = true;
          docQuote = trimmed.substring(0, 3);
          result.push(line);
          if (trimmed.length > 3 && trimmed.endsWith(docQuote)) {
            inDocstring = false;
          }
          continue;
        } else if (trimmed.endsWith(docQuote)) {
          inDocstring = false;
          result.push(line);
          continue;
        }
      }

      if (inDocstring) {
        result.push(line);
        continue;
      }

      // Imports
      if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
        imports.push(trimmed);
        result.push(line);
        continue;
      }

      // Decorators
      if (trimmed.startsWith('@')) {
        result.push(line);
        continue;
      }

      // Class definition
      if (trimmed.startsWith('class ')) {
        result.push(line);
        const match = trimmed.match(/^class\s+([A-Za-z0-9_]+)/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: 'class',
            lineStart: i + 1,
            lineEnd: i + 1,
            signature: trimmed
          });
        }
        continue;
      }

      // Function / Method definition
      if (/^(?:async\s+)?def\s+([A-Za-z0-9_]+)/.test(trimmed)) {
        result.push(line);
        result.push(line.replace(/\S.*$/, '    ... # implementation'));
        const match = trimmed.match(/def\s+([A-Za-z0-9_]+)/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: 'function',
            lineStart: i + 1,
            lineEnd: i + 1,
            signature: trimmed
          });
        }
        continue;
      }

      // Global constants or __all__
      if (/^[A-Z0-9_]+\s*[:=]/.test(trimmed) || trimmed.startsWith('__all__')) {
        result.push(line);
        continue;
      }
    }

    return result.length > 0 ? result.join('\n') : '# [Empty or non-symbolic Python content]';
  }

  private static parseGo(
    content: string,
    symbols: AstSymbol[],
    imports: string[],
    exportsList: string[]
  ): string {
    const lines = content.split('\n');
    const result: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('package ') || trimmed.startsWith('import ') || trimmed.startsWith('import (')) {
        result.push(line);
        continue;
      }

      if (/^type\s+([A-Za-z0-9_]+)\s+(?:struct|interface)/.test(trimmed)) {
        result.push(line);
        const match = trimmed.match(/^type\s+([A-Za-z0-9_]+)/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: trimmed.includes('interface') ? 'interface' : 'struct',
            lineStart: i + 1,
            lineEnd: i + 1,
            signature: trimmed
          });
        }
        continue;
      }

      if (/^func\s+(?:\([^)]+\)\s+)?([A-Za-z0-9_]+)/.test(trimmed)) {
        const cleaned = line.replace(/\{[\s\S]*$/, '{ /* ... */ }');
        result.push(cleaned);
        const match = trimmed.match(/func\s+(?:\([^)]+\)\s+)?([A-Za-z0-9_]+)/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: 'function',
            lineStart: i + 1,
            lineEnd: i + 1,
            signature: trimmed
          });
        }
        continue;
      }
    }

    return result.length > 0 ? result.join('\n') : '// [Empty Go outline]';
  }

  private static parseRust(
    content: string,
    symbols: AstSymbol[],
    imports: string[],
    exportsList: string[]
  ): string {
    const lines = content.split('\n');
    const result: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('use ') || trimmed.startsWith('pub use ')) {
        result.push(line);
        continue;
      }

      if (/^(?:pub\s+)?(?:struct|enum|trait|type)\s+([A-Za-z0-9_]+)/.test(trimmed)) {
        result.push(line);
        const match = trimmed.match(/(?:struct|enum|trait|type)\s+([A-Za-z0-9_]+)/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: 'struct',
            lineStart: i + 1,
            lineEnd: i + 1,
            signature: trimmed
          });
        }
        continue;
      }

      if (/^(?:pub\s+)?(?:async\s+)?fn\s+([A-Za-z0-9_]+)/.test(trimmed)) {
        const cleaned = line.replace(/\{[\s\S]*$/, '{ /* ... */ }');
        result.push(cleaned);
        const match = trimmed.match(/fn\s+([A-Za-z0-9_]+)/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: 'function',
            lineStart: i + 1,
            lineEnd: i + 1,
            signature: trimmed
          });
        }
        continue;
      }
    }

    return result.length > 0 ? result.join('\n') : '// [Empty Rust outline]';
  }

  private static parseGeneric(content: string): string {
    const lines = content.split('\n');
    if (lines.length <= 40) return content;
    // Return first 20 and last 10 lines
    const head = lines.slice(0, 20).join('\n');
    const tail = lines.slice(-10).join('\n');
    return `${head}\n\n// ... [${lines.length - 30} lines truncated for token efficiency] ...\n\n${tail}`;
  }
}
