import boxen from 'boxen';
import chalk from 'chalk';
import { PackResult, TokenStats } from '../core/types.js';

export class CliUi {
  public static printBanner(): void {
    const banner = boxen(
      `${chalk.bold.cyan('RepoContext')} ${chalk.dim('v1.0.0')}\n` +
      `${chalk.gray('Next-gen AST Codebase Map & LLM Context Engine')}\n` +
      `${chalk.dim('Author:')} ${chalk.green('ILoveMyJay')} ${chalk.dim('|')} ${chalk.dim('GitHub:')} ${chalk.underline.blue('https://github.com/ILoveMyJay/repocontext')}`,
      {
        padding: 1,
        margin: { top: 1, bottom: 1 },
        borderStyle: 'round',
        borderColor: 'cyan'
      }
    );
    console.log(banner);
  }

  public static printStats(stats: TokenStats, findingsCount: number, outputFile?: string): void {
    const savingsColor = stats.tokenSavingsPercent > 50 ? chalk.green : chalk.yellow;

    console.log(chalk.bold.white('\n📊 Pack Summary:'));
    console.log(`  ${chalk.dim('•')} Total Files:       ${chalk.bold.white(stats.totalFiles)}`);
    console.log(`  ${chalk.dim('•')} Total Lines:       ${chalk.bold.white(stats.totalLines.toLocaleString())}`);
    console.log(`  ${chalk.dim('•')} Raw Tokens:        ${chalk.dim(stats.rawTokens.toLocaleString())}`);
    console.log(`  ${chalk.dim('•')} Packed Tokens:     ${chalk.bold.cyan(stats.finalTokens.toLocaleString())}`);
    console.log(`  ${chalk.dim('•')} Token Compression: ${savingsColor(`-${stats.tokenSavingsPercent}%`)}`);
    console.log(`  ${chalk.dim('•')} Est. API Cost:     ${chalk.green(`$${stats.estimatedCostUsd.claude35Sonnet}`)} ${chalk.dim('(Claude 3.5 Sonnet)')}`);

    if (findingsCount > 0) {
      console.log(`  ${chalk.dim('•')} Security Status:   ${chalk.bold.yellow(`🛡️ ${findingsCount} Secrets Detected & Auto-Redacted`)}`);
    } else {
      console.log(`  ${chalk.dim('•')} Security Status:   ${chalk.green('🛡️ No Exposed Secrets Detected')}`);
    }

    if (outputFile) {
      console.log(`\n${chalk.bold.green('✔')} Context successfully saved to: ${chalk.underline.cyan(outputFile)}`);
    }
  }
}
