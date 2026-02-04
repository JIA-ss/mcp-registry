/**
 * MCP Server Registry - Core Types
 */

export interface MCPServerManifest {
  /** Unique identifier for the server */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Short description */
  description: string;
  
  /** Current version (semver) */
  version: string;
  
  /** Author information */
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  
  /** Repository URL */
  repository?: string;
  
  /** Homepage URL */
  homepage?: string;
  
  /** License identifier (SPDX) */
  license: string;
  
  /** Keywords for search */
  keywords: string[];
  
  /** MCP protocol version compatibility */
  mcpVersion: string;
  
  /** Runtime configuration */
  runtime: {
    /** Runtime type */
    type: 'node' | 'python' | 'docker' | 'binary';
    
    /** Entry point or command */
    entry: string;
    
    /** Required environment variables */
    env?: string[];
    
    /** Optional environment variables with defaults */
    envOptional?: Record<string, string>;
  };
  
  /** Installation configuration */
  installation: {
    /** NPM package name (if published) */
    npmPackage?: string;
    
    /** PyPI package name (if published) */
    pypiPackage?: string;
    
    /** Docker image (if available) */
    dockerImage?: string;
    
    /** GitHub repository for source install */
    githubRepo?: string;
    
    /** Installation command override */
    command?: string;
  };
  
  /** Capabilities this server provides */
  capabilities: MCPCapability[];
  
  /** Statistics (populated by registry) */
  stats?: {
    downloads: number;
    rating: number;
    reviewCount: number;
    lastUpdated: string;
  };
}

export interface MCPCapability {
  /** Capability type */
  type: 'tool' | 'resource' | 'prompt';
  
  /** Capability name */
  name: string;
  
  /** Description of what it does */
  description: string;
  
  /** Input schema (JSON Schema) */
  inputSchema?: Record<string, unknown>;
  
  /** Output schema (JSON Schema) */
  outputSchema?: Record<string, unknown>;
}

export interface RegistryIndex {
  /** Registry version */
  version: string;
  
  /** Last updated timestamp */
  lastUpdated: string;
  
  /** Total number of servers */
  totalServers: number;
  
  /** Server entries */
  servers: RegistryEntry[];
}

export interface RegistryEntry {
  /** Server ID */
  id: string;
  
  /** Current version */
  version: string;
  
  /** Short description */
  description: string;
  
  /** Author name */
  author: string;
  
  /** Keywords */
  keywords: string[];
  
  /** Download count */
  downloads: number;
  
  /** Rating (0-5) */
  rating: number;
  
  /** Path to manifest (relative to registry root) */
  manifestPath: string;
}

export interface InstalledServer {
  /** Server ID */
  id: string;
  
  /** Installed version */
  version: string;
  
  /** Installation path */
  path: string;
  
  /** Installation date */
  installedAt: string;
  
  /** Last updated */
  updatedAt: string;
  
  /** Active configuration */
  config?: Record<string, unknown>;
}

export interface SearchResult {
  servers: MCPServerManifest[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RegistryConfig {
  /** Registry URL */
  registryUrl: string;
  
  /** Cache directory */
  cacheDir: string;
  
  /** Installation directory */
  installDir: string;
  
  /** Default MCP config path */
  mcpConfigPath: string;
}
