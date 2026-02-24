# MCP Server Registry

> MCP 服务器的 npm 式注册中心 —— 发现、安装、管理 Model Context Protocol 服务器的一站式平台

[![npm version](https://badge.fury.io/js/@oss-ai%2Fmcp-registry.svg)](https://www.npmjs.com/package/@oss-ai/mcp-registry)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Servers](https://img.shields.io/badge/servers-23-blue)](./registry/servers)

---

## 📖 背景与动机

### 什么是 MCP？

**Model Context Protocol (MCP)** 是 Anthropic 推出的开放协议，让 AI 助手（如 Claude）能够安全地连接外部工具和数据源。

### 当前痛点

开发者在使用 Claude Desktop 等 MCP 客户端时面临：

- **发现困难**：MCP 服务器散落在 GitHub 各处，没有统一目录
- **质量未知**：不知道哪个服务器稳定、好用
- **安装繁琐**：每个服务器都有不同的配置方式
- **版本管理**：更新和回滚麻烦

### 解决方案

MCP Server Registry 提供 **npm 式的包管理体验**：

```bash
# 搜索需要的功能
mcp-registry search filesystem

# 一键安装
mcp-registry install filesystem

# 自动配置到 Claude Desktop
```

---

## 🚀 快速开始

### 安装

```bash
npm install -g @oss-ai/mcp-registry
```

### 基础命令

```bash
# 搜索服务器
mcp-registry search filesystem
mcp-registry search "@category:database"

# 查看详情
mcp-registry show filesystem

# 安装服务器（自动配置 Claude Desktop）
mcp-registry install filesystem

# 列出已安装
mcp-registry list

# 更新服务器
mcp-registry update filesystem

# 移除服务器
mcp-registry remove filesystem
```

### 启动 Web 注册表

```bash
# 本地浏览注册表
mcp-registry serve

# 自定义端口
mcp-registry serve --port 8080

# 允许外部访问
mcp-registry serve --host 0.0.0.0
```

访问 http://localhost:3000 浏览 Web 界面。

---

## 📊 功能特性

### 1. 统一发现

```bash
# 按关键词搜索
mcp-registry search "github"

# 按分类浏览
mcp-registry search "@category:database"
mcp-registry search "@category:filesystem"

# 查看热门
mcp-registry search "@sort:downloads"

# 查看最新
mcp-registry search "@sort:updated"
```

### 2. 自动安装与配置

```bash
# 安装并自动配置 Claude Desktop
mcp-registry install filesystem

# 安装特定版本
mcp-registry install filesystem@1.2.0

# 测试配置
mcp-registry test filesystem
```

### 3. Web 注册表界面

```bash
mcp-registry serve
```

特性：
- 🔍 实时搜索与筛选
- 📊 下载统计与趋势
- ⭐ 用户评分与评论
- 📖 集成文档浏览

### 4. 服务器管理

```bash
# 检查更新
mcp-registry outdated

# 更新全部
mcp-registry update --all

# 导出配置
mcp-registry export > mcp-config.json

# 导入配置
mcp-registry import mcp-config.json
```

---

## 🏗️ 架构设计

### 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Server Registry                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│   │   CLI Tool   │    │  Web Server  │    │   Registry   │     │
│   │  (npm pkg)   │    │   (HTTP API) │    │    (Data)    │     │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘     │
│          │                   │                   │              │
│          └───────────────────┼───────────────────┘              │
│                              │                                  │
│   ┌──────────────────────────▼──────────────────────────┐      │
│   │              Registry Index (JSON)                   │      │
│   │  ┌──────────────────────────────────────────────┐   │      │
│   │  │  {                                            │   │      │
│   │  │    "servers": [                               │   │      │
│   │  │      {                                        │   │      │
│   │  │        "id": "filesystem",                  │   │      │
│   │  │        "name": "Filesystem MCP",            │   │      │
│   │  │        "version": "1.0.0",                  │   │      │
│   │  │        "downloads": 15000,                  │   │      │
│   │  │        "rating": 4.8,                       │   │      │
│   │  │        "categories": ["filesystem"]         │   │      │
│   │  │      }                                        │   │      │
│   │  │    ]                                          │   │      │
│   │  │  }                                            │   │      │
│   │  └──────────────────────────────────────────────┘   │      │
│   └──────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 服务器清单结构

```
registry/
├── index.json              # 服务器索引
├── servers/
│   ├── filesystem/
│   │   ├── manifest.json   # 服务器元数据
│   │   ├── README.md       # 文档
│   │   └── config.json     # 默认配置
│   ├── github/
│   │   ├── manifest.json
│   │   └── ...
│   └── ...
└── categories.json         # 分类定义
```

### manifest.json 格式

```json
{
  "id": "filesystem",
  "name": "Filesystem MCP Server",
  "description": "Secure file system access for AI assistants",
  "version": "1.0.0",
  "author": "modelcontextprotocol",
  "license": "MIT",
  "categories": ["filesystem", "utility"],
  "repository": {
    "type": "git",
    "url": "https://github.com/modelcontextprotocol/servers"
  },
  "install": {
    "type": "npm",
    "package": "@modelcontextprotocol/server-filesystem"
  },
  "config": {
    "allowedDirectories": {
      "type": "array",
      "items": "string",
      "description": "Directories the server can access"
    }
  },
  "tools": [
    {
      "name": "read_file",
      "description": "Read contents of a file",
      "parameters": {
        "path": { "type": "string" }
      }
    }
  ]
}
```

---

## 📚 HTTP API 文档

### 基础信息

```bash
GET /
```

```json
{
  "name": "MCP Server Registry",
  "version": "0.2.0",
  "servers_count": 23,
  "api_version": "v1"
}
```

### 列出所有服务器

```bash
GET /api/servers?page=1&limit=20
```

```json
{
  "servers": [
    {
      "id": "filesystem",
      "name": "Filesystem MCP",
      "version": "1.0.0",
      "downloads": 15000,
      "rating": 4.8,
      "categories": ["filesystem"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 23
  }
}
```

### 搜索服务器

```bash
GET /api/search?q=github&category=database
```

### 获取服务器详情

```bash
GET /api/servers/:id
```

### 按分类列出

```bash
GET /api/categories
GET /api/categories/:category/servers
```

### 热门/最新

```bash
GET /api/servers/popular
GET /api/servers/recent
```

---

## 🛠️ 开发指南

### 本地开发

```bash
git clone https://github.com/your-org/mcp-registry.git
cd mcp-registry
npm install
npm run dev

# 运行测试
npm test

# 构建
npm run build
```

### 添加新服务器

1. Fork 本仓库
2. 在 `registry/servers/` 下创建新目录
3. 添加 `manifest.json` 和 `README.md`
4. 运行验证：`npm run validate`
5. 提交 PR

### manifest.json 验证规则

```bash
# 验证单个清单
mcp-registry validate manifest.json

# 验证整个注册表
npm run validate:all
```

---

## 📦 已收录服务器

### 官方服务器（Anthropic）

| 服务器 | 功能 | 下载量 | 评分 |
|--------|------|--------|------|
| filesystem | 文件系统访问 | 15,000+ | 4.8 |
| github | GitHub API 集成 | 12,000+ | 4.7 |
| postgres | PostgreSQL 数据库 | 8,000+ | 4.6 |
| sqlite | SQLite 数据库 | 6,000+ | 4.5 |
| fetch | HTTP 请求 | 10,000+ | 4.7 |

### 社区服务器

| 服务器 | 作者 | 功能 | 评分 |
|--------|------|------|------|
| brave-search | community | Brave 搜索 API | 4.5 |
| puppeteer | community | 浏览器自动化 | 4.4 |
| slack | community | Slack 集成 | 4.3 |

---

## 🧪 测试

```bash
# 单元测试
npm run test:unit

# 集成测试
npm run test:integration

# 验证注册表数据
npm run validate

# 端到端测试
npm run test:e2e
```

---

## 🗺️ 路线图

### ✅ v0.1.0 — 已发布
- [x] 核心 CLI 命令（search/install/list/update/remove）
- [x] 服务器清单管理
- [x] Claude Desktop 自动配置
- [x] **23 个服务器已收录**

### ✅ v0.2.0 — 已发布
- [x] Web 注册表界面
- [x] HTTP API
- [x] 分类系统
- [x] 下载统计

### 🔄 v0.3.0 — 开发中
- [ ] 服务器评分与评论
- [ ] 用户账户系统
- [ ] 收藏功能
- [ ] 服务器验证徽章

### 📅 v0.4.0 — 规划中
- [ ] 自动服务器验证（CI/CD）
- [ ] 版本依赖管理
- [ ] 配置模板系统
- [ ] 批量安装

### 📅 v1.0.0 — 规划中
- [ ] 公共注册表上线
- [ ] 发布者认证
- [ ] 私有服务器支持
- [ ] 企业级功能

---

## 🤝 贡献指南

### 提交新服务器

1. Fork 仓库
2. 创建分支：`git checkout -b add-server-mcp-name`
3. 添加服务器到 `registry/servers/`
4. 运行验证：`npm run validate`
5. 提交 PR

### PR 模板

```markdown
## 新服务器: [名称]

- **ID**: unique-id
- **类别**: database/filesystem/etc
- **仓库**: https://github.com/...
- **描述**: 一句话描述

### 清单检查
- [ ] manifest.json 有效
- [ ] README.md 完整
- [ ] 已测试 Claude Desktop 集成
- [ ] 包含示例配置
```

---

## 📄 许可证

MIT © OSS AI Tools

---

## 🔗 相关项目

- [AI Cost Tracker](./ai-cost-tracker) — AI 成本追踪与优化
- [Prompt VCS](./prompt-vcs) — Prompt 版本控制与 A/B 测试
- [MCP Protocol](https://modelcontextprotocol.io) — 官方 MCP 文档
