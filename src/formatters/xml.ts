import { PackedFile, TokenStats } from '../core/types.js';

export class XmlFormatter {
  public static format(packedFiles: PackedFile[], stats: TokenStats, treeView: string, query?: string): string {
    const xml: string[] = [];

    xml.push('<documents>');
    xml.push(`  <summary total_files="${stats.totalFiles}" total_tokens="${stats.finalTokens}" compression_percent="${stats.tokenSavingsPercent}">`);
    if (query) {
      xml.push(`    <task_query>${this.escapeXml(query)}</task_query>`);
    }
    if (treeView) {
      xml.push('    <codebase_tree>');
      xml.push(this.escapeXml(treeView));
      xml.push('    </codebase_tree>');
    }
    xml.push('  </summary>');

    packedFiles.forEach((file, index) => {
      xml.push(`  <document index="${index + 1}">`);
      xml.push(`    <source>${this.escapeXml(file.relativePath)}</source>`);
      xml.push(`    <language>${file.language}</language>`);
      xml.push(`    <is_ast_outline>${file.isAstOutline}</is_ast_outline>`);
      xml.push(`    <token_count>${file.tokenCount}</token_count>`);
      xml.push('    <document_content>');
      xml.push(this.escapeXml(file.content));
      xml.push('    </document_content>');
      xml.push('  </document>');
    });

    xml.push('</documents>');
    return xml.join('\n');
  }

  private static escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
