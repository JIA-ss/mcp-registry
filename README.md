# MCP Server Registry

> npm-like registry for Model Context Protocol servers

[![npm version](https://badge.fury.io/js/@oss-ai%2Fmcp-registry.svg)](https://www.npmjs.com/package/@oss-ai/mcp-registry)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Problem

Developers using Claude Desktop and other MCP-compatible tools currently have to manually hunt for MCP servers on GitHub. There's no centralized way to discover, evaluate, and install MCP servers.

## Solution

MCP Server Registry provides:
- 🔍 **Discovery**: Searchable registry of MCP servers
- ⭐ **Quality**: Ratings, reviews, and download counts
- 📦 **Installation**: One-line install: `mcp install server-name`
- 📚 **Documentation**: Centralized docs for all servers

## Installation

```bash
npm install -g @oss-ai/mcp-registry
```

## Quick Start

```bash
# Search for servers
mcp-registry search filesystem

# Install a server
mcp-registry install filesystem

# List installed servers
mcp-registry list

# Update a server
mcp-registry update filesystem

# Remove a server
mcp-registry remove filesystem
```

## Registry Structure

```
registry/
├── servers/
│   ├── filesystem/
│   │   ├── manifest.json
│   │   └── README.md
│   ├── github/
│   │   ├── manifest.json
│   │   └── README.md
│   └── ...
└── index.json
```

## Contributing a Server

1. Fork this repository
2. Add your server to `registry/servers/`
3. Submit a PR

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## Roadmap

- [x] v0.1.0 - Core CLI commands
- [ ] v0.2.0 - Web registry interface
- [ ] v0.3.0 - Server ratings & reviews
- [ ] v0.4.0 - Automated server validation
- [ ] v1.0.0 - Public registry launch

## License

MIT © OSS AI Tools
