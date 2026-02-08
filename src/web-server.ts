/**
 * MCP Server Registry - Web Server
 * Provides HTTP API for browsing and searching registry
 */

import express, { Express, Request, Response } from 'express';
import { RegistryClient } from './registry.js';

export interface ServerOptions {
  port?: number;
  host?: string;
}

interface ServerInstance {
  close: () => Promise<void>;
  port: number;
}

/**
 * Create Express app with registry API routes
 */
export function createServer(registry: RegistryClient): Express {
  const app = express();
  
  app.use(express.json());
  
  // Health check / API info
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'MCP Server Registry',
      version: '0.2.0',
      api: {
        version: 'v1',
        endpoints: [
          'GET /api/servers',
          'GET /api/servers/:id',
          'GET /api/search?q=query',
          'GET /api/categories',
        ],
      },
    });
  });
  
  // List all servers with pagination
  app.get('/api/servers', async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.limit as string) || parseInt(req.query.pageSize as string) || 20;
      
      const result = await registry.listServers({ page, pageSize });
      
      res.json({
        servers: result.servers,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch servers' });
    }
  });
  
  // Get specific server details
  app.get('/api/servers/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // Skip reserved routes
      if (['popular', 'recent', 'categories'].includes(id)) {
        return;
      }
      const server = await registry.getServer(id);
      
      if (!server) {
        res.status(404).json({ error: `Server '${id}' not found` });
        return;
      }
      
      res.json(server);
    } catch (error) {
      res.status(404).json({ error: `Server '${req.params.id}' not found` });
    }
  });
  
  // Search servers
  app.get('/api/search', async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.trim() === '') {
        res.status(400).json({ error: 'Query parameter "q" is required' });
        return;
      }
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await registry.search(query, { page, pageSize: limit });
      
      res.json({
        servers: result.servers,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      });
    } catch (error) {
      res.status(500).json({ error: 'Search failed' });
    }
  });
  
  // Get categories
  app.get('/api/categories', async (_req: Request, res: Response) => {
    try {
      const categories = await registry.getCategories();
      
      res.json({
        categories,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });
  
  // Popular servers
  app.get('/api/servers/popular', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const servers = await registry.getPopular(limit);
      
      res.json({ servers });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch popular servers' });
    }
  });
  
  // Recently updated servers
  app.get('/api/servers/recent', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const servers = await registry.getRecent(limit);
      
      res.json({ servers });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch recent servers' });
    }
  });
  
  return app;
}

/**
 * Start the web server
 */
export async function startServer(
  registry: RegistryClient,
  options: ServerOptions = {}
): Promise<ServerInstance> {
  const { port = 3000, host = 'localhost' } = options;
  
  const app = createServer(registry);
  
  return new Promise((resolve, reject) => {
    const server = app.listen(port, host, () => {
      const actualPort = (server.address() as { port: number }).port;
      console.log(`🚀 MCP Registry server running at http://${host}:${actualPort}`);
      
      resolve({
        port: actualPort,
        close: () => {
          return new Promise((res) => {
            server.close(() => res());
          });
        },
      });
    });
    
    server.on('error', reject);
  });
}

/**
 * Stop the web server
 */
export async function stopServer(server: ServerInstance): Promise<void> {
  await server.close();
}
