import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { RepoPacker } from '../core/packer.js';
import { CodebaseScanner } from '../core/scanner.js';
import { AstParser } from '../core/ast-parser.js';

export async function startMcpServer() {
  const server = new Server(
    {
      name: 'repocontext-mcp',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'get_codebase_map',
          description: 'Extracts a token-efficient AST symbol outline map (classes, functions, interfaces) of the repository.',
          inputSchema: {
            type: 'object',
            properties: {
              rootDir: {
                type: 'string',
                description: 'Path to repository root directory (default: current working directory)'
              }
            }
          }
        },
        {
          name: 'extract_relevant_context',
          description: 'Extracts and packages only the code files most relevant to a specific user coding task, pruning irrelevant files to save tokens.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Task description or coding prompt (e.g., "Fix JWT authentication token expiration error")'
              },
              rootDir: {
                type: 'string',
                description: 'Path to repository root directory'
              },
              maxTokens: {
                type: 'number',
                description: 'Token budget ceiling (default: 40000)'
              }
            },
            required: ['query']
          }
        },
        {
          name: 'read_file_outline',
          description: 'Reads the semantic AST skeleton outline of a single file, omitting internal implementations while preserving signatures and docstrings.',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: 'Relative or absolute path to the file'
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
        const files = await CodebaseScanner.scan({ rootDir: '.', include: [filePath] });
        if (files.length === 0 || !files[0].content) {
          throw new Error(`File not found: ${filePath}`);
        }
        const outline = AstParser.extractOutline(filePath, files[0].content, files[0].language);
        return {
          content: [
            {
              type: 'text',
              text: `\`\`\`${outline.language}\n${outline.skeletonCode}\n\`\`\``
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

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (process.argv[1]?.includes('server')) {
  startMcpServer().catch((err) => {
    console.error('MCP Server error:', err);
    process.exit(1);
  });
}
