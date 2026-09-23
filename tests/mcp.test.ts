import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { createMcpServer } from '../src/mcp/server.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

describe('RepoContext MCP Server', () => {
  it('should expose exactly 4 well-scoped tools with Glama TDQS compliant schemas', async () => {
    const server = createMcpServer();
    // @ts-ignore - access private request handler for testing
    const handler = server._requestHandlers.get(ListToolsRequestSchema.shape.method.value);
    expect(handler).toBeDefined();

    const response = await handler!({ method: 'tools/list' }, {});
    const tools = response.tools;

    expect(tools).toHaveLength(4);

    const toolNames = tools.map((t: any) => t.name);
    expect(toolNames).toEqual([
      'get_codebase_map',
      'extract_relevant_context',
      'read_file_outline',
      'read_file_content'
    ]);

    // Verify Glama TDQS requirements for every tool:
    for (const tool of tools) {
      // 1. Behavior and safety disclosures
      expect(tool.description).toContain('Behavior: Read-only');
      expect(tool.description).toContain('Zero file modifications');
      expect(tool.description).toContain('zero network calls');

      // 2. Usage guidelines & Mutual exclusion routing
      expect(tool.description).toContain('When to use:');
      expect(tool.description).toContain('When NOT to use:');

      // 3. Schema completeness
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toBeDefined();
    }
  });

  it('should execute get_codebase_map and return structured markdown', async () => {
    const server = createMcpServer();
    // @ts-ignore
    const handler = server._requestHandlers.get(CallToolRequestSchema.shape.method.value);

    const res = await handler!(
      {
        method: 'tools/call',
        params: {
          name: 'get_codebase_map',
          arguments: { rootDir: '.' }
        }
      },
      {}
    );

    expect(res.isError).toBeFalsy();
    expect(res.content).toHaveLength(1);
    expect(res.content[0].type).toBe('text');
    expect(res.content[0].text).toContain('# RepoContext Codebase Pack');
  });

  it('should execute extract_relevant_context with semantic query', async () => {
    const server = createMcpServer();
    // @ts-ignore
    const handler = server._requestHandlers.get(CallToolRequestSchema.shape.method.value);

    const res = await handler!(
      {
        method: 'tools/call',
        params: {
          name: 'extract_relevant_context',
          arguments: {
            query: 'AST parser outline extraction',
            rootDir: '.',
            maxTokens: 10000
          }
        }
      },
      {}
    );

    expect(res.isError).toBeFalsy();
    expect(res.content).toHaveLength(1);
    expect(res.content[0].text).toContain('# RepoContext Codebase Pack');
  });

  it('should execute read_file_outline on a TypeScript file', async () => {
    const server = createMcpServer();
    // @ts-ignore
    const handler = server._requestHandlers.get(CallToolRequestSchema.shape.method.value);

    const res = await handler!(
      {
        method: 'tools/call',
        params: {
          name: 'read_file_outline',
          arguments: {
            filePath: 'src/core/scanner.ts'
          }
        }
      },
      {}
    );

    expect(res.isError).toBeFalsy();
    expect(res.content[0].text).toContain('### File Outline: src/core/scanner.ts');
    expect(res.content[0].text).toContain('class CodebaseScanner');
  });

  it('should execute read_file_content with windowing and secret redaction', async () => {
    const server = createMcpServer();
    // @ts-ignore
    const handler = server._requestHandlers.get(CallToolRequestSchema.shape.method.value);

    // Create temporary file with test code and a fake secret
    const tempFile = path.resolve('temp_test_read.ts');
    fs.writeFileSync(
      tempFile,
      '// Line 1\nconst token = "sk-proj-1234567890abcdef1234567890abcdef1234567890";\n// Line 3\nfunction hello() {\n  return "world";\n}\n// Line 7\n'
    );

    try {
      // 1. Full read with redaction
      const fullRes = await handler!(
        {
          method: 'tools/call',
          params: {
            name: 'read_file_content',
            arguments: { filePath: 'temp_test_read.ts' }
          }
        },
        {}
      );

      expect(fullRes.isError).toBeFalsy();
      expect(fullRes.content[0].text).toContain('Lines 1-8 of 8');
      expect(fullRes.content[0].text).toContain('[REDACTED_OPENAI-API-KEY]');
      expect(fullRes.content[0].text).not.toContain('sk-proj-1234567890');

      // 2. Line slice (lines 4 to 6)
      const sliceRes = await handler!(
        {
          method: 'tools/call',
          params: {
            name: 'read_file_content',
            arguments: {
              filePath: 'temp_test_read.ts',
              startLine: 4,
              endLine: 6
            }
          }
        },
        {}
      );

      expect(sliceRes.isError).toBeFalsy();
      expect(sliceRes.content[0].text).toContain('Lines 4-6 of 8');
      expect(sliceRes.content[0].text).toContain('function hello()');
      expect(sliceRes.content[0].text).toContain('return "world";');
      expect(sliceRes.content[0].text).not.toContain('Line 1');

      // 3. Error for non-existent file
      const errRes = await handler!(
        {
          method: 'tools/call',
          params: {
            name: 'read_file_content',
            arguments: { filePath: 'non_existent_file_xyz.ts' }
          }
        },
        {}
      );

      expect(errRes.isError).toBe(true);
      expect(errRes.content[0].text).toContain('File not found: non_existent_file_xyz.ts');
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });
});
