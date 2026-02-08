import axios from 'axios';
import { RegistryClient } from '../src/registry.js';
import type { MCPServerManifest, RegistryIndex } from '../src/types.js';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

const makeManifest = (id: string, name = `Server ${id}`): MCPServerManifest => ({
  id,
  name,
  description: `Description for ${id}`,
  version: '1.0.0',
  author: { name: 'Test Author' },
  license: 'MIT',
  keywords: ['test', id],
  mcpVersion: '1.0',
  runtime: {
    type: 'node',
    entry: 'index.js',
  },
  installation: {
    npmPackage: `${id}-package`,
  },
  capabilities: [],
  stats: {
    downloads: 10,
    rating: 4.2,
    reviewCount: 3,
    lastUpdated: '2024-01-01T00:00:00Z',
  },
});

const makeIndex = (entries: RegistryIndex['servers']): RegistryIndex => ({
  version: '1',
  lastUpdated: '2024-01-01T00:00:00Z',
  totalServers: entries.length,
  servers: entries,
});

describe('RegistryClient', () => {
  const baseUrl = 'https://test.registry.dev';

  beforeEach(() => {
    mockedAxios.get.mockReset();
  });

  it('getIndex fetches the registry index', async () => {
    const index = makeIndex([]);
    mockedAxios.get.mockResolvedValueOnce({ data: index });

    const client = new RegistryClient(baseUrl);
    await expect(client.getIndex()).resolves.toEqual(index);

    expect(mockedAxios.get).toHaveBeenCalledWith(`${baseUrl}/index.json`);
  });

  it('getManifest fetches a server manifest', async () => {
    const manifest = makeManifest('alpha');
    mockedAxios.get.mockResolvedValueOnce({ data: manifest });

    const client = new RegistryClient(baseUrl);
    await expect(client.getManifest('alpha')).resolves.toEqual(manifest);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${baseUrl}/servers/alpha/manifest.json`
    );
  });

  it('search filters by query and paginates results', async () => {
    const index = makeIndex([
      {
        id: 'alpha',
        version: '1.0.0',
        description: 'Alpha server',
        author: 'Alice',
        keywords: ['tools'],
        downloads: 10,
        rating: 4.5,
        manifestPath: 'servers/alpha/manifest.json',
      },
      {
        id: 'beta',
        version: '1.1.0',
        description: 'Search helpers',
        author: 'Bob',
        keywords: ['search', 'query'],
        downloads: 20,
        rating: 4.1,
        manifestPath: 'servers/beta/manifest.json',
      },
      {
        id: 'gamma',
        version: '1.2.0',
        description: 'Misc tools',
        author: 'Cara',
        keywords: ['misc'],
        downloads: 5,
        rating: 3.8,
        manifestPath: 'servers/gamma/manifest.json',
      },
    ]);

    const manifests: Record<string, MCPServerManifest> = {
      alpha: makeManifest('alpha'),
      beta: makeManifest('beta'),
      gamma: makeManifest('gamma'),
    };

    mockedAxios.get.mockImplementation(async (url: string) => {
      if (url.endsWith('/index.json')) {
        return { data: index };
      }

      const match = url.match(/\/servers\/(.+)\/manifest\.json$/);
      if (match && manifests[match[1]]) {
        return { data: manifests[match[1]] };
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    const client = new RegistryClient(baseUrl);
    const results = await client.search('search', { page: 1, pageSize: 1 });

    expect(results.total).toBe(1);
    expect(results.servers).toHaveLength(1);
    expect(results.servers[0].id).toBe('beta');
    expect(results.page).toBe(1);
    expect(results.pageSize).toBe(1);
  });

  it('list returns paginated manifests', async () => {
    const index = makeIndex([
      {
        id: 'alpha',
        version: '1.0.0',
        description: 'Alpha server',
        author: 'Alice',
        keywords: ['tools'],
        downloads: 10,
        rating: 4.5,
        manifestPath: 'servers/alpha/manifest.json',
      },
      {
        id: 'beta',
        version: '1.1.0',
        description: 'Beta server',
        author: 'Bob',
        keywords: ['utilities'],
        downloads: 20,
        rating: 4.1,
        manifestPath: 'servers/beta/manifest.json',
      },
      {
        id: 'gamma',
        version: '1.2.0',
        description: 'Gamma server',
        author: 'Cara',
        keywords: ['misc'],
        downloads: 5,
        rating: 3.8,
        manifestPath: 'servers/gamma/manifest.json',
      },
    ]);

    const manifests: Record<string, MCPServerManifest> = {
      alpha: makeManifest('alpha'),
      beta: makeManifest('beta'),
      gamma: makeManifest('gamma'),
    };

    mockedAxios.get.mockImplementation(async (url: string) => {
      if (url.endsWith('/index.json')) {
        return { data: index };
      }

      const match = url.match(/\/servers\/(.+)\/manifest\.json$/);
      if (match && manifests[match[1]]) {
        return { data: manifests[match[1]] };
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    const client = new RegistryClient(baseUrl);
    const results = await client.list({ page: 1, pageSize: 2 });

    expect(results.total).toBe(3);
    expect(results.servers).toHaveLength(2);
    expect(results.servers[0].id).toBe('alpha');
    expect(results.servers[1].id).toBe('beta');
  });
});
