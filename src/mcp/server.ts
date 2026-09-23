import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { RepoPacker } from '../core/packer.js';
import { CodebaseScanner } from '../core/scanner.js';
import { AstParser } from '../core/ast-parser.js';
import { SecurityFilter } from '../core/security-filter.js';

export function createMcpServer() {
  const server = new Server(
    {
      name: 'repocontext-mcp',
      version: '1.2.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  const securityFilter = new SecurityFilter();

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'get_codebase_map',
          description:
            'Extracts a token-efficient AST symbol outline map (classes, interfaces, functions, methods, exported types) across the repository.\n\n' +
            'Behavior: Read-only operation. Zero file modifications, zero persistent side-effects, and zero network calls. Returns structured Markdown.\n\n' +
            'When to use: Call this at the start of a coding task to inspect repository architecture, directory structure, and symbol hierarchies with 70%~85% token savings.\n\n' +
            'When NOT to use: Do NOT use this if you need full function implementations (use read_file_content instead), or if you already know the target task and want only relevant files (use extract_relevant_context instead).',
          inputSchema: {
            type: 'object',
            properties: {
              rootDir: {
                type: 'string',
                description: 'Path to repository root directory. Defaults to current working directory ("."). Respects .gitignore and built-in binary exclusions.'
              }
            }
          }
        },
        {
          name: 'extract_relevant_context',
          description:
            'Performs semantic relevance ranking to extract and package code files pertinent to a specific user coding task or bug report within a token budget.\n\n' +
            'Behavior: Read-only operation. Zero file modifications, zero persistent side-effects, and zero network calls. Applies automatic secret redaction. Returns formatted Markdown.\n\n' +
            'When to use: Use this when given a specific feature request, issue, or debugging objective to gather only the essential source code.\n\n' +
            'When NOT to use: Do NOT use this for full-repository structural overviews (use get_codebase_map instead), or to inspect single file outlines (use read_file_outline instead).',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Natural language task description, bug report, or feature prompt used for semantic and citation-based file scoring.'
              },
              rootDir: {
                type: 'string',
                description: 'Path to repository root directory. Defaults to current working directory (".").'
              },
              maxTokens: {
                type: 'number',
                description: 'Maximum token budget ceiling (1,000 to 128,000; default: 40000). Files with highest relevance scores are packed first until budget is exhausted.'
              }
            },
            required: ['query']
          }
        },
        {
          name: 'read_file_outline',
          description:
            'Extracts the semantic AST skeleton outline of a single source file, preserving all class declarations, function signatures, interfaces, and docstrings while stripping function bodies.\n\n' +
            'Behavior: Read-only operation. Zero file modifications and zero network calls. Returns syntax-highlighted code block.\n\n' +
            'When to use: Use this to understand API contracts, public types, and method signatures of an individual file without consuming tokens on implementation details.\n\n' +
            'When NOT to use: Do NOT use this if you need complete implementation logic (use read_file_content instead), or if you need an overview of multiple repository files (use get_codebase_map instead).',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: 'Relative or absolute path to the target source file.'
              },
              rootDir: {
                type: 'string',
                description: 'Base directory used to resolve relative filePath. Defaults to current working directory (".").'
              }
            },
            required: ['filePath']
          }
        },
        {
          name: 'read_file_content',
          description:
            'Reads raw source code from a single file, with optional line-range slicing and automatic security redaction for secrets and sensitive keys.\n\n' +
            'Behavior: Read-only operation. Zero file modifications and zero network calls. Automatically masks detected credentials. Returns formatted Markdown code block with line indicators.\n\n' +
            'When to use: Use this when you must inspect, debug, or verify exact line-by-line implementation logic of a specific file identified through previous outline or mapping steps.\n\n' +
            'When NOT to use: Do NOT use this for blind exploration of unfamiliar files (use read_file_outline or get_codebase_map first to conserve token budget).',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: 'Relative or absolute path to the file to inspect.'
              },
              startLine: {
                type: 'number',
                description: '1-indexed starting line number (optional, default: 1). Useful for viewing specific functions or ranges in large files.'
              },
              endLine: {
                type: 'number',
                description: '1-indexed ending line number, inclusive (optional, default: end of file).'
              },
              rootDir: {
                type: 'string',
                description: 'Base directory used to resolve relative filePath. Defaults to current working directory (".").'
              }
            },
            required: ['filePath']
          }
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === 'get_codebase_map') {
        const rootDir = (args?.rootDir as string) || '.';
        const result = await RepoPacker.pack({
          rootDir,
          mode: 'ast',
          format: 'markdown'
        });
        return {
          content: [
            {
              type: 'text',
              text: result.formattedOutput
            }
          ]
        };
      }

      if (name === 'extract_relevant_context') {
        const query = (args?.query as string) || '';
        const rootDir = (args?.rootDir as string) || '.';
        const maxTokens = (args?.maxTokens as number) || 40000;

        const result = await RepoPacker.pack({
          rootDir,
          mode: 'relevant',
          query,
          maxTokens,
          format: 'markdown'
        });

        return {
          content: [
            {
              type: 'text',
              text: result.formattedOutput
            }
          ]
        };
      }

      if (name === 'read_file_outline') {
        const filePath = args?.filePath as string;
        const rootDir = (args?.rootDir as string) || '.';
        const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(rootDir, filePath);

        if (!fs.existsSync(fullPath)) {
          throw new Error(`File not found: ${filePath}`);
        }

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          throw new Error(`Path is a directory, not a file: ${filePath}`);
        }

        const content = fs.readFileSync(fullPath, 'utf-8');
        const lang = CodebaseScanner.getLanguageFromPath(fullPath);
        const outline = AstParser.extractOutline(filePath, content, lang);
        return {
          content: [
            {
              type: 'text',
              text: `### File Outline: ${filePath} (${outline.language}, savings: ${outline.tokenSavingsPercent}%)\n\`\`\`${outline.language}\n${outline.skeletonCode}\n\`\`\``
            }
          ]
        };
      }

      if (name === 'read_file_content') {
        const filePath = args?.filePath as string;
        const rootDir = (args?.rootDir as string) || '.';
        const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(rootDir, filePath);

        if (!fs.existsSync(fullPath)) {
          throw new Error(`File not found: ${filePath}`);
        }

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          throw new Error(`Path is a directory, not a file: ${filePath}`);
        }

        let rawContent = fs.readFileSync(fullPath, 'utf-8');
        const filterResult = securityFilter.scanAndRedact(rawContent, filePath);
        rawContent = filterResult.cleanedContent;

        const lines = rawContent.split('\n');
        const totalLines = lines.length;

        const startLine = Math.max(1, Math.min(totalLines, Number(args?.startLine) || 1));
        const endLine = args?.endLine ? Math.max(startLine, Math.min(totalLines, Number(args?.endLine))) : totalLines;

        const slicedLines = lines.slice(startLine - 1, endLine);
        const lang = CodebaseScanner.getLanguageFromPath(fullPath);

        const header = `File: ${filePath} (Lines ${startLine}-${endLine} of ${totalLines})`;
        const formattedCode = slicedLines.join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `### ${header}\n\`\`\`${lang}\n${formattedCode}\n\`\`\``
            }
          ]
        };
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (err: any) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error executing ${name}: ${err.message}`
          }
        ]
      };
    }
  });

  return server;
}

export async function startMcpServer() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[repocontext-mcp] Server running on stdio');
}

// When directly executed as script
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startMcpServer().catch((err) => {
    console.error('[repocontext-mcp] Fatal error:', err);
    process.exit(1);
  });
}
