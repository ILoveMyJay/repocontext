# Changelog

All notable changes to **RepoContext** will be documented in this file.

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
