# ⚡ RepoContext

<div align="center">

[![CI](https://github.com/ILoveMyJay/repocontext/actions/workflows/ci.yml/badge.svg)](https://github.com/ILoveMyJay/repocontext/actions)
[![npm version](https://img.shields.io/npm/v/repocontext.svg?color=blue)](https://www.npmjs.com/package/repocontext)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-brightgreen.svg)](https://modelcontextprotocol.io)

**专为 AI 编码助手与 Agent 设计的下一代 AST 代码图谱、Token 智能压缩与上下文打包引擎**

[English](./README.md) | [中文说明](./README_zh.md)

</div>

---

## 🌟 为什么需要 RepoContext？

在使用 **Claude Code**、**Cursor**、**Windsurf**、**OpenAI Codex** 等 AI 编码工具时，开发者常面临三大痛点：

1. 💥 **Token 爆炸与高昂成本**：直接塞入整个仓库动辄数十万 Token，超出上下文窗口限制或产生高额 API 账单。
2. 📉 **信噪比极低**：80% 的代码实现细节对大模型理解架构是冗余的，大模型只需要类、接口、函数签名与文档注释。
3. 🔓 **敏感密钥泄露**：不慎将 `.env` 配置文件中的 API Key、数据库密码、私钥打包进 Prompt。

**RepoContext** 通过**多语言 AST 骨架提取**、**任务导向的语义相关性排序**、**敏感信息自动脱敏**以及**标准 MCP 协议集成**，一站式解决这些痛点。

---

## 🚀 核心特性

* ⚡ **AST 骨架提取与代码图谱**：提取函数/类/接口签名与文档，剔除内部冗长实现，**Token 压缩率达 70%~85%**。
* 🎯 **基于任务的语义修剪（Smart Relevance）**：输入需求描述（如 `repocontext pack -q "修复 JWT 过期错误"`），智能挑选最相关的核心文件打包。
* 🛡️ **敏感信息自动扫描与脱敏**：内置 10+ 种安全规则，自动识别并打码 OpenAI Key、GitHub Token、AWS 密钥、JWT 及数据库连接串。
* 🔌 **标准 MCP 服务器**：直接接入 Cursor、Windsurf、Claude Desktop、Antigravity，供 AI Agent 按需调用。
* 📑 **多格式 Prompt 导出**：支持标准 Markdown（带目录树）、Claude 推荐的 XML 格式及结构化 JSON。
* 📊 **多模型 Token 与成本预算看板**：实时计算 GPT-4o、GPT-5、Claude 3.5 Sonnet、Gemini 1.5 Pro 的 Token 与费用预估。

---

## 📦 快速上手

### 1. 免安装一键运行
```bash
# 打包当前仓库为优化后的 Markdown Prompt
npx repocontext pack

# 针对特定任务仅提取最相关上下文
npx repocontext pack -q "实现微信支付回调处理" -o prompt.md

# 生成高紧凑度的 AST 架构图谱
npx repocontext map -o codebase-map.md
```

### 2. 全局安装
```bash
npm install -g repocontext
```

---

## 🔌 配置 MCP 服务器（Cursor / Claude Desktop）

在配置文件中添加：
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

---

## 📄 开源许可证

本项目基于 [MIT 许可证](./LICENSE) 开源。
