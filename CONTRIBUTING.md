# Contributing to MCP Server Registry

Thank you for your interest in contributing! This document provides guidelines for contributing to the registry.

## Adding a Server

To add your MCP server to the registry:

1. **Fork this repository**
2. **Create a new directory** under `registry/servers/<your-server-id>/`
3. **Add your manifest.json** following the schema below
4. **Add a README.md** with usage documentation
5. **Submit a pull request**

## Manifest Schema

Your `manifest.json` must include:

```json
{
  "id": "unique-server-id",
  "name": "Display Name",
  "description": "Short description of what your server does",
  "version": "1.0.0",
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "license": "MIT",
  "keywords": ["relevant", "tags"],
  "mcpVersion": "1.0",
  "runtime": {
    "type": "node",
    "entry": "dist/index.js"
  },
  "installation": {
    "npmPackage": "your-package-name"
  },
  "capabilities": []
}
```

## Review Process

1. Automated validation will check your manifest
2. Maintainers will review for quality and security
3. Once approved, your server will be published

## Code of Conduct

- Be respectful and constructive
- Focus on helping users
- Prioritize security and privacy

## Questions?

Open an issue for discussion before submitting if you're unsure about anything.
