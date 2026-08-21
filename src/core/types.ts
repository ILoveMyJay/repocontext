export type SupportedLanguage =
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'go'
  | 'rust'
  | 'java'
  | 'c'
  | 'cpp'
  | 'csharp'
  | 'ruby'
  | 'php'
  | 'swift'
  | 'kotlin'
  | 'html'
  | 'css'
  | 'sql'
  | 'json'
  | 'yaml'
  | 'markdown'
  | 'other';

export type SymbolKind =
  | 'function'
  | 'class'
  | 'interface'
  | 'type'
  | 'method'
  | 'enum'
  | 'struct'
  | 'trait'
  | 'variable'
  | 'import';

export interface AstSymbol {
  name: string;
  kind: SymbolKind;
  lineStart: number;
  lineEnd: number;
  signature: string;
  docstring?: string;
  children?: AstSymbol[];
}

export interface AstOutline {
  filePath: string;
  language: SupportedLanguage;
  symbols: AstSymbol[];
  imports: string[];
  exports: string[];
  skeletonCode: string;
  originalLines: number;
  skeletonLines: number;
  originalTokens: number;
  skeletonTokens: number;
  tokenSavingsPercent: number;
}

export interface FileInfo {
  path: string;
  relativePath: string;
  extension: string;
  language: SupportedLanguage;
  sizeBytes: number;
  lineCount: number;
  isBinary: boolean;
  content?: string;
}

export interface ScanOptions {
  rootDir: string;
  include?: string[];
  exclude?: string[];
  respectGitignore?: boolean;
  respectRepocontextIgnore?: boolean;
  maxFileSizeKb?: number;
  includeHidden?: boolean;
}

export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low';

export interface SecurityRule {
  id: string;
  name: string;
  severity: SecuritySeverity;
  pattern: RegExp;
  description: string;
}

export interface SecurityFinding {
  ruleId: string;
  ruleName: string;
  severity: SecuritySeverity;
  filePath: string;
  lineNumber: number;
  rawMatch: string;
  redactedPreview: string;
}

export interface SecurityFilterResult {
  cleanedContent: string;
  findings: SecurityFinding[];
  hasCriticalOrHigh: boolean;
}

export interface LanguageTokenStat {
  language: SupportedLanguage;
  fileCount: number;
  lines: number;
  tokens: number;
  percentage: number;
}

export interface TokenStats {
  totalFiles: number;
  totalLines: number;
  rawTokens: number;
  finalTokens: number;
  tokenSavingsPercent: number;
  estimatedCostUsd: {
    gpt4o: number;
    gpt5: number;
    claude35Sonnet: number;
    gemini15Pro: number;
  };
  languageStats: LanguageTokenStat[];
}

export interface RelevanceScore {
  filePath: string;
  score: number;
  matchedKeywords: string[];
  matchedSymbols: string[];
  reason: string;
}

export type PackMode = 'full' | 'ast' | 'relevant' | 'hybrid';
export type OutputFormat = 'markdown' | 'xml' | 'json';
export type TargetModel = 'gpt-4o' | 'gpt-5' | 'claude-3-5-sonnet' | 'claude-3-7-sonnet' | 'gemini-1-5-pro' | 'gemini-2-0-flash';

export interface PackOptions {
  rootDir: string;
  mode?: PackMode;
  query?: string;
  format?: OutputFormat;
  outputFile?: string;
  maxTokens?: number;
  securityCheck?: boolean;
  autoRedact?: boolean;
  includePatterns?: string[];
  excludePatterns?: string[];
  targetModel?: TargetModel;
  includeTree?: boolean;
  verbose?: boolean;
}

export interface PackedFile {
  relativePath: string;
  language: SupportedLanguage;
  isAstOutline: boolean;
  content: string;
  tokenCount: number;
  relevanceScore?: number;
}

export interface PackResult {
  formattedOutput: string;
  stats: TokenStats;
  securityFindings: SecurityFinding[];
  packedFiles: PackedFile[];
  treeView: string;
}
