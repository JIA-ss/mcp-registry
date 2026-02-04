/**
 * MCP Server Registry - Configuration Management
 */

import { homedir } from 'os';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import type { RegistryConfig } from './types.js';

const DEFAULT_CONFIG: RegistryConfig = {
  registryUrl: 'https://registry.mcp.dev',
  cacheDir: join(homedir(), '.mcp-registry', 'cache'),
  installDir: join(homedir(), '.mcp-registry', 'servers'),
  mcpConfigPath: join(homedir(), '.config', 'mcp', 'settings.json'),
};

const CONFIG_PATH = join(homedir(), '.mcp-registry', 'config.json');

export function getConfig(): RegistryConfig {
  if (existsSync(CONFIG_PATH)) {
    try {
      const userConfig = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
      return { ...DEFAULT_CONFIG, ...userConfig };
    } catch {
      return DEFAULT_CONFIG;
    }
  }
  return DEFAULT_CONFIG;
}

export function setConfig(updates: Partial<RegistryConfig>): void {
  const config = getConfig();
  const newConfig = { ...config, ...updates };
  
  // Ensure config directory exists
  const configDir = join(homedir(), '.mcp-registry');
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
  
  writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
}

export function ensureDirectories(): void {
  const config = getConfig();
  
  for (const dir of [config.cacheDir, config.installDir]) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}

export { DEFAULT_CONFIG, CONFIG_PATH };
