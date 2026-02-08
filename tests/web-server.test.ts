/**
 * Web Server Tests - TDD Approach
 * Tests written BEFORE implementation
 */

import request from 'supertest';
import { createServer, startServer, stopServer } from '../src/web-server';
import { RegistryClient } from '../src/registry';

// Mock the RegistryClient
jest.mock('../src/registry');

describe('Web Server - Core', () => {
  let app: ReturnType<typeof createServer>;
  let mockRegistry: jest.Mocked<RegistryClient>;

  beforeEach(() => {
    mockRegistry = new RegistryClient() as jest.Mocked<RegistryClient>;
    app = createServer(mockRegistry);
  });

  describe('GET /', () => {
    it('should return registry info', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'MCP Server Registry');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('api');
    });
  });

  describe('GET /api/servers', () => {
    it('should return list of servers', async () => {
      const mockResult = {
        servers: [
          { id: 'filesystem', name: 'Filesystem', version: '1.0.0' },
          { id: 'github', name: 'GitHub', version: '1.0.0' },
        ],
        total: 2,
        page: 1,
        pageSize: 20,
      };
      mockRegistry.listServers = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app).get('/api/servers');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('servers');
      expect(response.body.servers).toHaveLength(2);
      expect(response.body).toHaveProperty('total', 2);
    });

    it('should support pagination', async () => {
      mockRegistry.listServers = jest.fn().mockResolvedValue({
        servers: [], total: 0, page: 2, pageSize: 10
      });

      const response = await request(app)
        .get('/api/servers')
        .query({ page: 2, limit: 10 });

      expect(response.status).toBe(200);
      expect(mockRegistry.listServers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, pageSize: 10 })
      );
    });
  });

  describe('GET /api/servers/:id', () => {
    it('should return server details', async () => {
      const mockServer = {
        id: 'filesystem',
        name: 'Filesystem MCP Server',
        version: '1.0.0',
        description: 'File operations',
      };
      mockRegistry.getServer = jest.fn().mockResolvedValue(mockServer);

      const response = await request(app).get('/api/servers/filesystem');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockServer);
    });

    it('should return 404 for non-existent server', async () => {
      mockRegistry.getServer = jest.fn().mockResolvedValue(null);

      const response = await request(app).get('/api/servers/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/search', () => {
    it('should search servers by query', async () => {
      const mockResults = {
        servers: [{ id: 'filesystem', name: 'Filesystem' }],
        total: 1,
        page: 1,
        pageSize: 20,
      };
      mockRegistry.search = jest.fn().mockResolvedValue(mockResults);

      const response = await request(app)
        .get('/api/search')
        .query({ q: 'file' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('servers');
      expect(mockRegistry.search).toHaveBeenCalledWith('file', expect.any(Object));
    });

    it('should return 400 if query is missing', async () => {
      const response = await request(app).get('/api/search');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/categories', () => {
    it('should return list of categories', async () => {
      const mockCategories = ['tools', 'resources', 'prompts'];
      mockRegistry.getCategories = jest.fn().mockResolvedValue(mockCategories);

      const response = await request(app).get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('categories');
      expect(response.body.categories).toEqual(mockCategories);
    });
  });
});

describe('Web Server - Lifecycle', () => {
  let server: { close: () => Promise<void>; port: number } | null = null;

  afterEach(async () => {
    if (server) {
      await stopServer(server);
      server = null;
    }
  });

  it('should start server on specified port', async () => {
    const mockRegistry = new RegistryClient() as jest.Mocked<RegistryClient>;
    server = await startServer(mockRegistry, { port: 0 }); // 0 = random port
    
    expect(server).toBeDefined();
    expect(server!.close).toBeDefined();
    expect(server!.port).toBeDefined();
  });
});
