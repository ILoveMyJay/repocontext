import * as fs from 'node:fs';
import * as path from 'node:path';
import fg from 'fast-glob';
import ignore from 'ignore';
import { FileInfo, ScanOptions, SupportedLanguage } from './types.js';

export class CodebaseScanner {
  private static readonly DEFAULT_IGNORES = [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    'coverage/**',
    '.next/**',
    '.nuxt/**',
    'vendor/**',
    '__pycache__/**',
    '*.pyc',
    '*.lock',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    '*.min.js',
    '*.min.css',
    '*.map',
    '*.wasm',
    '*.exe',
    '*.dll',
    '*.so',
    '*.dylib',
    '*.bin',
    '*.zip',
    '*.tar',
    '*.gz',
    '*.png',
    '*.jpg',
    '*.jpeg',
    '*.gif',
    '*.ico',
    '*.pdf',
    '*.mp4',
    '*.mp3',
    '*.woff',
    '*.woff2',
    '*.ttf',
    '*.eot',
    '.repocontext/**',
    'repocontext-output.*'
  ];

  public static getLanguageFromPath(filePath: string): SupportedLanguage {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.ts':
      case '.tsx':
      case '.mts':
      case '.cts':
        return 'typescript';
      case '.js':
      case '.jsx':
      case '.mjs':
      case '.cjs':
        return 'javascript';
      case '.py':
      case '.pyi':
        return 'python';
      case '.go':
        return 'go';
      case '.rs':
        return 'rust';
      case '.java':
        return 'java';
      case '.c':
      case '.h':
        return 'c';
      case '.cpp':
      case '.hpp':
      case '.cc':
      case '.cxx':
        return 'cpp';
      case '.cs':
        return 'csharp';
      case '.rb':
        return 'ruby';
      case '.php':
        return 'php';
      case '.swift':
        return 'swift';
      case '.kt':
      case '.kts':
        return 'kotlin';
      case '.html':
      case '.htm':
        return 'html';
      case '.css':
      case '.scss':
      case '.sass':
      case '.less':
        return 'css';
      case '.sql':
        return 'sql';
      case '.json':
        return 'json';
      case '.yaml':
      case '.yml':
        return 'yaml';
      case '.md':
      case '.markdown':
        return 'markdown';
      default:
        return 'other';
    }
  }

  public static isBinaryFile(filePath: string): boolean {
    try {
      const buffer = Buffer.alloc(512);
      const fd = fs.openSync(filePath, 'r');
      const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
      fs.closeSync(fd);

      for (let i = 0; i < bytesRead; i++) {
        if (buffer[i] === 0) return true; // Null byte found -> binary
      }
      return false;
    } catch {
      return false;
    }
  }

  public static async scan(options: ScanOptions): Promise<FileInfo[]> {
    const rootDir = path.resolve(options.rootDir || '.');
    const maxFileSize = (options.maxFileSizeKb ?? 500) * 1024;
    const ig = ignore();

    // Add default ignores
    ig.add(this.DEFAULT_IGNORES);

    // Add .gitignore if exists and requested
    if (options.respectGitignore !== false) {
      const gitignorePath = path.join(rootDir, '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        try {
          const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
          ig.add(gitignoreContent);
        } catch {
          // ignore read error
        }
      }
    }

    // Add .repocontextignore if exists
    if (options.respectRepocontextIgnore !== false) {
      const customIgnorePath = path.join(rootDir, '.repocontextignore');
      if (fs.existsSync(customIgnorePath)) {
        try {
          const customContent = fs.readFileSync(customIgnorePath, 'utf-8');
          ig.add(customContent);
        } catch {
          // ignore read error
        }
      }
    }

    if (options.exclude && options.exclude.length > 0) {
      ig.add(options.exclude);
    }

    const includePatterns = options.include && options.include.length > 0
      ? options.include
      : ['**/*'];

    const entries = await fg(includePatterns, {
      cwd: rootDir,
      dot: options.includeHidden ?? false,
      onlyFiles: true,
      absolute: false,
      followSymbolicLinks: false
    });

    const fileInfos: FileInfo[] = [];

    for (const relPath of entries) {
      const normalizedRelPath = relPath.replace(/\\/g, '/');
      if (ig.ignores(normalizedRelPath)) {
        continue;
      }

      const fullPath = path.join(rootDir, relPath);
      let stat: fs.Stats;
      try {
        stat = fs.statSync(fullPath);
      } catch {
        continue;
      }

      if (stat.size > maxFileSize) {
        continue; // Exceeds max file size
      }

      const isBinary = this.isBinaryFile(fullPath);
      if (isBinary) {
        continue; // Skip binaries
      }

      let content: string | undefined;
      let lineCount = 0;
      try {
        content = fs.readFileSync(fullPath, 'utf-8');
        lineCount = content.split('\n').length;
      } catch {
        continue;
      }

      fileInfos.push({
        path: fullPath,
        relativePath: normalizedRelPath,
        extension: path.extname(fullPath).toLowerCase(),
        language: this.getLanguageFromPath(fullPath),
        sizeBytes: stat.size,
        lineCount,
        isBinary: false,
        content
      });
    }

    // Sort by relative path alphabetically
    return fileInfos.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  }

  public static buildDirectoryTree(files: FileInfo[]): string {
    const lines: string[] = ['.'];
    const paths = files.map((f) => f.relativePath).sort();

    const root: Record<string, any> = {};
    for (const p of paths) {
      const parts = p.split('/');
      let current = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = i === parts.length - 1 ? null : {};
        }
        current = current[part];
      }
    }

    function renderNode(node: Record<string, any>, prefix: string = '') {
      const keys = Object.keys(node);
      keys.forEach((key, index) => {
        const isLast = index === keys.length - 1;
        const pointer = isLast ? '└── ' : '├── ';
        lines.push(`${prefix}${pointer}${key}`);
        if (node[key] !== null) {
          renderNode(node[key], `${prefix}${isLast ? '    ' : '│   '}`);
        }
      });
    }

    renderNode(root);
    return lines.join('\n');
  }
}
