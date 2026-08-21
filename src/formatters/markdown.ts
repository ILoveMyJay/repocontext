import { PackedFile, TokenStats } from '../core/types.js';

export class MarkdownFormatter {
  public static format(packedFiles: PackedFile[], stats: TokenStats, treeView: string, query?: string): string {
    const sections: string[] = [];

    // Header
    sections.push('# RepoContext Codebase Pack');
    sections.push(`> Generated with **RepoContext** | Files: **${stats.totalFiles}** | Lines: **${stats.totalLines}** | Tokens: **${stats.finalTokens.toLocaleString()}** (Savings: **${stats.tokenSavingsPercent}%**)`);
    if (query) {
      sections.push(`> 🎯 **Task Query Focus**: \`${query}\``);
    }
    sections.push('');

    // Token Stats Table
    sections.push('## 📊 Token & Cost Breakdown');
    sections.push('| Metric | Value |');
    sections.push('| :--- | :--- |');
    sections.push(`| **Total Files** | ${stats.totalFiles} |`);
    sections.push(`| **Total Lines** | ${stats.totalLines.toLocaleString()} |`);
    sections.push(`| **Raw Tokens** | ${stats.rawTokens.toLocaleString()} |`);
    sections.push(`| **Final Pack Tokens** | ${stats.finalTokens.toLocaleString()} |`);
    sections.push(`| **Token Compression** | **-${stats.tokenSavingsPercent}%** |`);
    sections.push(`| **Est. Cost (Claude 3.5 Sonnet)** | $${stats.estimatedCostUsd.claude35Sonnet} |`);
    sections.push(`| **Est. Cost (GPT-4o)** | $${stats.estimatedCostUsd.gpt4o} |`);
    sections.push('');

    // Directory Tree
    if (treeView) {
      sections.push('## 🗂️ Codebase Structure');
      sections.push('```');
      sections.push(treeView);
      sections.push('```');
      sections.push('');
    }

    // Table of Contents
    sections.push('## 📑 Table of Contents');
    for (let i = 0; i < packedFiles.length; i++) {
      const f = packedFiles[i];
      const tag = f.isAstOutline ? ' *(AST Outline)*' : '';
      sections.push(`${i + 1}. [\`${f.relativePath}\`](#${f.relativePath.replace(/[^a-zA-Z0-9_-]/g, '-')})${tag} - \`${f.tokenCount} tokens\``);
    }
    sections.push('');

    // File Contents
    sections.push('## 📦 Packed Source Code');
    for (const f of packedFiles) {
      sections.push(`### \`${f.relativePath}\``);
      if (f.isAstOutline) {
        sections.push('> ⚡ *Note: This file is presented as a semantic AST Outline (token-compressed)*');
      }
      sections.push(`\`\`\`${f.language}`);
      sections.push(f.content);
      sections.push('```');
      sections.push('');
    }

    return sections.join('\n');
  }
}
