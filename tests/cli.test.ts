import type { MCPServerManifest } from '../src/types.js';

const flushPromises = async () =>
  new Promise<void>((resolve) => setImmediate(resolve));

const makeManifest = (id: string): MCPServerManifest => ({
  id,
  name: `Server ${id}`,
  description: `Description for ${id}`,
  version: '1.0.0',
  author: { name: 'Test Author' },
  license: 'MIT',
  keywords: ['test', id],
  mcpVersion: '1.0',
  runtime: {
    type: 'node',
    entry: 'index.js',
    env: ['API_KEY'],
  },
  installation: {
    npmPackage: `${id}-package`,
  },
  capabilities: [],
  stats: {
    downloads: 42,
    rating: 4.6,
    reviewCount: 5,
    lastUpdated: '2024-01-01T00:00:00Z',
  },
});

const runCli = async (
  args: string[],
  {
    client,
    installer,
  }: {
    client: Record<string, jest.Mock>;
    installer: Record<string, jest.Mock>;
  }
) => {
  jest.resetModules();

  const logs: string[] = [];
  const errors: string[] = [];
  const spinner = { stop: jest.fn(), succeed: jest.fn(), fail: jest.fn() };

  jest.doMock('ora', () => ({
    __esModule: true,
    default: jest.fn(() => ({ start: () => spinner })),
  }));
  jest.doMock('chalk', () => ({
    __esModule: true,
    default: {
      bold: (value: string) => value,
      gray: (value: string) => value,
      cyan: (value: string) => value,
      yellow: (value: string) => value,
      red: (value: string) => value,
      green: (value: string) => value,
    },
  }));
  jest.doMock('../src/registry.js', () => ({
    RegistryClient: jest.fn(() => client),
  }));
  jest.doMock('../src/installer.js', () => ({
    Installer: jest.fn(() => installer),
  }));

  const logSpy = jest
    .spyOn(console, 'log')
    .mockImplementation((...values) => logs.push(values.join(' ')));
  const errorSpy = jest
    .spyOn(console, 'error')
    .mockImplementation((...values) => errors.push(values.join(' ')));
  const exitSpy = jest
    .spyOn(process, 'exit')
    .mockImplementation(((code?: number) => {
      throw new Error(`process.exit: ${code ?? 0}`);
    }) as never);

  const originalArgv = process.argv;
  process.argv = ['node', 'cli', ...args];

  jest.isolateModules(() => {
    require('../src/cli.js');
  });

  await flushPromises();

  process.argv = originalArgv;
  logSpy.mockRestore();
  errorSpy.mockRestore();
  exitSpy.mockRestore();

  return { logs, errors, spinner };
};

describe('CLI integration', () => {
  it('search prints results and pagination info', async () => {
    const manifest = makeManifest('alpha');
    const client = {
      search: jest.fn().mockResolvedValue({
        servers: [manifest],
        total: 1,
        page: 1,
        pageSize: 20,
      }),
    };
    const installer = {};

    const { logs } = await runCli(['search', 'alpha'], {
      client,
      installer: installer as Record<string, jest.Mock>,
    });

    expect(client.search).toHaveBeenCalledWith('alpha', {
      page: 1,
      pageSize: 20,
    });
    const output = logs.join('\n');
    expect(output).toContain('Found 1 server(s)');
    expect(output).toContain('Server alpha');
    expect(output).toContain('Page 1 of 1');
  });

  it('list prints available servers', async () => {
    const manifest = makeManifest('beta');
    const client = {
      list: jest.fn().mockResolvedValue({
        servers: [manifest],
        total: 1,
        page: 1,
        pageSize: 20,
      }),
    };
    const installer = {};

    const { logs } = await runCli(['list'], {
      client,
      installer: installer as Record<string, jest.Mock>,
    });

    expect(client.list).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    const output = logs.join('\n');
    expect(output).toContain('Available servers (1 total)');
    expect(output).toContain('Server beta');
  });

  it('install fetches manifest, installs, and prints run command', async () => {
    const manifest = makeManifest('gamma');
    const client = {
      getManifest: jest.fn().mockResolvedValue(manifest),
    };
    const installer = {
      install: jest.fn().mockResolvedValue({
        id: 'gamma',
        version: '1.0.0',
        path: '/tmp/servers/gamma',
        installedAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }),
      getRunCommand: jest.fn().mockReturnValue('node /tmp/servers/gamma/index.js'),
    };

    const { logs, spinner } = await runCli(['install', 'gamma'], {
      client,
      installer,
    });

    expect(client.getManifest).toHaveBeenCalledWith('gamma');
    expect(installer.install).toHaveBeenCalledWith(manifest);
    expect(installer.getRunCommand).toHaveBeenCalledWith('gamma');
    expect(spinner.succeed).toHaveBeenCalledWith(
      'Installed Server gamma v1.0.0'
    );

    const output = logs.join('\n');
    expect(output).toContain('Required environment variables:');
    expect(output).toContain('API_KEY');
    expect(output).toContain('Run command: node /tmp/servers/gamma/index.js');
  });

  it('update fetches manifest and installs updates', async () => {
    const manifest = makeManifest('delta');
    const client = {
      getManifest: jest.fn().mockResolvedValue(manifest),
    };
    const installer = {
      update: jest.fn().mockResolvedValue({
        id: 'delta',
        version: '1.0.0',
        path: '/tmp/servers/delta',
        installedAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }),
    };

    const { spinner } = await runCli(['update', 'delta'], {
      client,
      installer,
    });

    expect(client.getManifest).toHaveBeenCalledWith('delta');
    expect(installer.update).toHaveBeenCalledWith(manifest);
    expect(spinner.succeed).toHaveBeenCalledWith(
      'Updated Server delta to v1.0.0'
    );
  });

  it('remove deletes an installed server', async () => {
    const installer = {
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const { spinner } = await runCli(['remove', 'epsilon'], {
      client: {},
      installer,
    });

    expect(installer.remove).toHaveBeenCalledWith('epsilon');
    expect(spinner.succeed).toHaveBeenCalledWith('Removed epsilon');
  });
});
