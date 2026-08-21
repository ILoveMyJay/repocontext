import * as path from 'node:path';
import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { RepoPacker } from '../core/packer.js';
import { OutputFormat, PackMode } from '../core/types.js';
import { CliUi } from './ui.js';

const program = new Command();

program
  .name('repocontext')
  .description('Next-gen AST codebase map, token compression, and context packaging engine for AI coding agents & IDEs')
  .version('1.0.0');

program
  .command('pack [dir]')
  .description('Pack codebase into an optimized LLM prompt file (Markdown, XML, or JSON)')
  .option('-m, --mode <mode>', 'Packing mode: full, ast, relevant, hybrid', 'full')
  .option('-q, --query <query>', 'Filter and rank files relevant to a specific coding task prompt')
  .option('-f, --format <format>', 'Output format: markdown, xml, json', 'markdown')
  .option('-o, --output <file>', 'Output file path', 'repocontext-output.md')
  .option('-t, --max-tokens <number>', 'Maximum token budget for prompt pack', '80000')
  .option('--no-security', 'Disable automatic secret scanning and redaction')
  .action(async (dir = '.', opts) => {
    CliUi.printBanner();
    const spinner = ora('Scanning and analyzing codebase...').start();

    try {
      const targetDir = path.resolve(dir);
      const maxTokens = parseInt(opts.maxTokens, 10) || 80000;
      const mode = opts.mode as PackMode;
      const format = opts.format as OutputFormat;

      const result = await RepoPacker.pack({
        rootDir: targetDir,
        mode,
        query: opts.query,
        format,
        outputFile: opts.output,
        maxTokens,
        securityCheck: opts.security
      });

      spinner.succeed('Codebase packed successfully!');
      CliUi.printStats(result.stats, result.securityFindings.length, opts.output);
    } catch (err: any) {
      spinner.fail(`Failed to pack codebase: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('map [dir]')
  .description('Generate a lightweight, token-compressed AST symbol map of the codebase')
  .option('-o, --output <file>', 'Output file path', 'codebase-map.md')
  .action(async (dir = '.', opts) => {
    CliUi.printBanner();
    const spinner = ora('Extracting AST symbol outlines...').start();

    try {
      const result = await RepoPacker.pack({
        rootDir: path.resolve(dir),
        mode: 'ast',
        format: 'markdown',
        outputFile: opts.output
      });

      spinner.succeed('AST Codebase Map generated!');
      CliUi.printStats(result.stats, result.securityFindings.length, opts.output);
    } catch (err: any) {
      spinner.fail(`Failed to generate map: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('mcp')
  .description('Launch RepoContext Model Context Protocol (MCP) server over stdio')
  .action(async () => {
    const { startMcpServer } = await import('../mcp/server.js');
    await startMcpServer();
  });

program.parse(process.argv);
