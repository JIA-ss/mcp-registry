/**
 * MCP Server Registry - Registry Client
 */

import axios from 'axios';
import type { 
  MCPServerManifest, 
  RegistryIndex, 
  SearchResult
} from './types.js';
import { getConfig } from './config.js';

export class RegistryClient {
  private baseUrl: string;
  
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getConfig().registryUrl;
  }
  
  /**
   * Get the full registry index
   */
  async getIndex(): Promise<RegistryIndex> {
    const response = await axios.get(`${this.baseUrl}/index.json`);
    return response.data;
  }
  
  /**
   * Get a specific server's manifest
   */
  async getManifest(serverId: string): Promise<MCPServerManifest> {
    const response = await axios.get(
      `${this.baseUrl}/servers/${serverId}/manifest.json`
    );
    return response.data;
  }
  
  /**
   * Search for servers
   */
  async search(
    query: string, 
    options: { page?: number; pageSize?: number } = {}
  ): Promise<SearchResult> {
    const { page = 1, pageSize = 20 } = options;
    
    // For now, client-side search against index
    // Server-side search would be: 
    // const response = await axios.get(`${this.baseUrl}/search`, { params: { q: query, page, pageSize } });
    
    const index = await this.getIndex();
    const lowerQuery = query.toLowerCase();
    
    const filtered = index.servers.filter(entry => 
      entry.id.toLowerCase().includes(lowerQuery) ||
      entry.description.toLowerCase().includes(lowerQuery) ||
      entry.keywords.some(k => k.toLowerCase().includes(lowerQuery))
    );
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginated = filtered.slice(start, end);
    
    // Fetch full manifests for results
    const servers = await Promise.all(
      paginated.map(entry => this.getManifest(entry.id))
    );
    
    return {
      servers,
      total: filtered.length,
      page,
      pageSize,
    };
  }
  
  /**
   * List all servers (paginated)
   */
  async list(options: { page?: number; pageSize?: number } = {}): Promise<SearchResult> {
    const { page = 1, pageSize = 20 } = options;
    const index = await this.getIndex();
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginated = index.servers.slice(start, end);
    
    const servers = await Promise.all(
      paginated.map(entry => this.getManifest(entry.id))
    );
    
    return {
      servers,
      total: index.servers.length,
      page,
      pageSize,
    };
  }
  
  /**
   * Get popular servers
   */
  async getPopular(limit: number = 10): Promise<MCPServerManifest[]> {
    const index = await this.getIndex();
    
    const sorted = [...index.servers]
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
    
    return Promise.all(
      sorted.map(entry => this.getManifest(entry.id))
    );
  }
  
  /**
   * Get recently updated servers
   */
  async getRecent(limit: number = 10): Promise<MCPServerManifest[]> {
    const index = await this.getIndex();
    
    const sorted = [...index.servers]
      .sort((a, b) => 
        new Date(b.manifestPath).getTime() - new Date(a.manifestPath).getTime()
      )
      .slice(0, limit);
    
    return Promise.all(
      sorted.map(entry => this.getManifest(entry.id))
    );
  }
  
  // Alias methods for consistent API naming
  
  /**
   * Alias for list() - List all servers
   */
  async listServers(options?: { page?: number; pageSize?: number }): Promise<SearchResult> {
    return this.list(options);
  }
  
  /**
   * Alias for getManifest() - Get a specific server
   */
  async getServer(id: string): Promise<MCPServerManifest | null> {
    try {
      return await this.getManifest(id);
    } catch {
      return null;
    }
  }
  
  /**
   * Get all unique categories/keywords
   */
  async getCategories(): Promise<string[]> {
    const index = await this.getIndex();
    const categories = new Set<string>();
    
    index.servers.forEach(server => {
      server.keywords.forEach(keyword => {
        categories.add(keyword);
      });
    });
    
    return Array.from(categories).sort();
  }
}
