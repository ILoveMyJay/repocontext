# ⚡ RepoContext

<div align="center">

[![CI](https://github.com/ILoveMyJay/repocontext/actions/workflows/ci.yml/badge.svg)](https://github.com/ILoveMyJay/repocontext/actions)
[![Glama Score](https://glama.ai/mcp/servers/ILoveMyJay/repocontext/badges/score.svg)](https://glama.ai/mcp/servers/ILoveMyJay/repocontext)
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
# 1. Pack with direct clipboard copy (ready to paste into ChatGPT/Claude)
repocontext pack -c

# 2. Pack relevant files only based on task query
repocontext pack -q "Fix JWT auth expiration" -o prompt.md

# 3. Generate AST symbol map
repocontext map -c

# 4. Analyze token distribution without writing a file
repocontext analyze .
```

### Options for `pack`:
| Option | Description | Default |
| :--- | :--- | :--- |
| `-m, --mode <mode>` | Packing mode: `full`, `ast`, `relevant`, `hybrid` | `"full"` |
| `-q, --query <query>` | Filter and rank files relevant to coding prompt | None |
| `-f, --format <format>`| Output format: `markdown`, `xml`, `json` | `"markdown"` |
| `-o, --output <file>` | Output file path | `"repocontext-output.md"` |
| `-t, --max-tokens <num>`| Maximum token budget | `80000` |
| `-c, --copy` | Copy output directly to system clipboard | `false` |
| `--no-security` | Disable automated secret redaction | `false` |

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

### Exposed MCP Tools (4-Tier Context Pyramid):
* `get_codebase_map`: Extracts token-efficient AST symbol outline map across the repository (~80% token savings).
* `extract_relevant_context`: Prunes codebase using semantic ranking to return files pertinent to a task prompt.
* `read_file_outline`: Reads compressed AST skeleton for an individual file (signatures & docstrings).
* `read_file_content`: Precise source code reading with optional line-range slicing (`startLine`/`endLine`) and automated credential masking.

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
