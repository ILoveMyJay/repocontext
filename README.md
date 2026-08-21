# ⚡ RepoContext

<div align="center">

[![CI](https://github.com/ILoveMyJay/repocontext/actions/workflows/ci.yml/badge.svg)](https://github.com/ILoveMyJay/repocontext/actions)
[![npm version](https://img.shields.io/npm/v/repocontext.svg?color=blue)](https://www.npmjs.com/package/repocontext)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-brightgreen.svg)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)

**The Next-Generation AST Codebase Map, Token Compression, and Context Packaging Engine for AI Coding Agents and IDEs.**

[English](./README.md) | [中文说明](./README_zh.md)

</div>

---

## 🌟 Why RepoContext?

When feeding codebases into modern AI coding assistants (**Claude Code**, **Cursor**, **Windsurf**, **OpenAI Codex**, **Antigravity**, **Cline**), developers face three critical bottlenecks:

1. 💥 **Token Explosion & High API Costs**: Raw code dumps quickly exceed context limits or cost tens of dollars per query.
2. 📉 **Low Signal-to-Noise Ratio**: 80% of lines are routine implementation details. LLMs only need the semantic API surface (signatures, types, interfaces, docstrings).
3. 🔓 **Security Leaks**: Accidental exposure of `.env` credentials, API keys, and database URIs in prompts.

**RepoContext** solves all three with intelligent AST outline pruning, task-focused semantic file ranking, automated credential redaction, and native **Model Context Protocol (MCP)** integration.

---

## 🚀 Key Features

* ⚡ **AST Codebase Map & Skeletonizer**: Compresses source files by **70%~85%** while retaining 100% of interfaces, types, functions, and JSDoc/docstrings.
* 🎯 **Task-Oriented Relevance Pruning**: Pass your prompt query (e.g. `repocontext pack -q "Fix JWT auth token expiry"`) to automatically rank and pack only the most critical files.
* 🛡️ **Automated Secret Scanner & Redaction**: Built-in entropy and regex scanner detects and masks OpenAI keys, GitHub tokens, AWS keys, JWTs, and database URIs.
* 🔌 **Native Model Context Protocol (MCP) Server**: Directly integrates with Claude Desktop, Cursor, Windsurf, and Antigravity via standard MCP tools.
* 📑 **Multi-Format Export**: Generates clean Markdown with directory trees, Claude-optimized XML (`<documents>`), or structured JSON.
* 📊 **Multi-Model Token & Cost Analytics**: Real-time token counter with cost estimates for GPT-4o, GPT-5, Claude 3.5 Sonnet, and Gemini 1.5 Pro.

---

## 📦 Quick Start

### 1. Run without installation via `npx`
```bash
# Pack entire repository into an optimized Markdown prompt
npx repocontext pack

# Pack only files relevant to a specific task prompt
npx repocontext pack -q "Implement Stripe payment webhook handler" -o prompt.md

# Generate lightweight AST skeleton map (75%+ token reduction)
npx repocontext map -o codebase-map.md
```

### 2. Global Installation
```bash
npm install -g repocontext
```

---

## 🛠️ CLI Usage & Options

```bash
repocontext pack [dir] [options]

Options:
  -m, --mode <mode>         Packing mode: full | ast | relevant | hybrid (default: "full")
  -q, --query <query>       Filter and rank files relevant to a coding task prompt
  -f, --format <format>     Output format: markdown | xml | json (default: "markdown")
  -o, --output <file>       Output file path (default: "repocontext-output.md")
  -t, --max-tokens <number> Maximum token budget ceiling (default: 80000)
  --no-security             Disable secret scanning and auto-redaction
  -h, --help                Display help for command
```

---

## 🔌 Model Context Protocol (MCP) Integration

RepoContext comes with built-in MCP server support. Add it to your `claude_desktop_config.json` or Cursor/Windsurf MCP settings:

```json
{
  "mcpServers": {
    "repocontext": {
      "command": "npx",
      "args": ["-y", "repocontext", "mcp"]
    }
  }
}
```

### Exposed MCP Tools:
* `get_codebase_map`: Returns AST symbol outline map of the repository.
* `extract_relevant_context`: Prunes codebase and returns only files needed for a prompt.
* `read_file_outline`: Reads compressed AST skeleton for a single file.

---

## 📊 Benchmark & Comparison

| Feature | Raw Concatenation | Repomix | RepoContext |
| :--- | :---: | :---: | :---: |
| **AST Skeleton Pruning** | ❌ No | ❌ No | ✅ **Yes (80% Token Savings)** |
| **Task Relevance Ranker** | ❌ No | ❌ No | ✅ **Yes (Query-guided Pruning)** |
| **Secret Auto-Redaction** | ❌ No | ⚠️ Basic | ✅ **Yes (10+ Security Rules)** |
| **Native MCP Server** | ❌ No | ❌ No | ✅ **Yes (Claude / Cursor / Windsurf)** |
| **Multi-Model Cost Est.** | ❌ No | ❌ No | ✅ **Yes (GPT-4o/5, Claude, Gemini)** |

---

## 🤝 Contributing

Contributions, issues and feature requests are welcome! Feel free to check [issues page](https://github.com/ILoveMyJay/repocontext/issues).

## 📄 License

This project is [MIT](./LICENSE) licensed.
