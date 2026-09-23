# Changelog

All notable changes to **RepoContext** will be documented in this file.

## [1.2.0] - 2026-09-23

### Added
- **New MCP Tool `read_file_content`**: Precise line-range windowing (`startLine`/`endLine`) with integrated automatic secret masking. Completes the three-tier context hierarchy recommended by Glama evaluation audit.
- **Glama TDQS Grade A+ Compliance**:
  - Implemented industrial triple-layer descriptions (Action, Behavior, and Usage Guidelines) across all MCP tools.
  - Explicit read-only and zero-side-effects security disclosures.
  - Mutual-exclusion routing directives (`When to use` vs `When NOT to use`) eliminating agent ambiguity.
- **MCP Test Suite**: Added dedicated Vitest suite (`tests/mcp.test.ts`) covering all 4 tools, parameter constraints, secret redaction, and error contracts.

### Improved
- Upgraded MCP server export architecture with modular `createMcpServer()` factory for robust automated testing and embedding.
- Enhanced file outline headers with explicit language and token compression ratio metadata.

## [1.1.0] - 2026-09-10

### Added
- Multi-language AST Outline extraction expanded to **Java**, **C#**, **Kotlin**, **C**, and **C++**.
- Instant system clipboard copy flag (`--copy` / `-c`) for `pack` and `map` commands.
- Standalone `repocontext analyze [dir]` command for zero-file token distribution breakdown.
- Official Glama Certified **Grade A (3.9/5.0)** quality rating and badge integration.

### Fixed
- Fixed CLI ESM packaging shebang deduplication in `dist/cli/index.js`.
- Improved Windows cross-platform clipboard pipe reliability.

## [1.0.0] - 2026-08-21

### Added
- Multi-language AST Outline extraction for TypeScript, JavaScript, Python, Go, Rust.
- Task-oriented relevance pruning and file ranking engine.
- Automated secret detection and redaction for OpenAI, GitHub, AWS, JWT, and DB URIs.
- Native Model Context Protocol (MCP) server support.
- Multi-format prompt export (Markdown, Claude XML, JSON).
- Token and cost estimator for GPT-4o, GPT-5, Claude 3.5 Sonnet, and Gemini.
- Interactive CLI with colored progress and summary dashboards.
