import { execSync } from 'child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Installer } from '../src/installer.js';
import { ensureDirectories, getConfig } from '../src/config.js';
import type { MCPServerManifest } from '../src/types.js';

jest.mock('child_process', () => ({ execSync: jest.fn() }));
jest.mock('../src/config.js', () => {
  const actual = jest.requireActual('../src/config.js');
  return {
    ...actual,
    getConfig: jest.fn(),
    ensureDirectories: jest.fn(),
  };
});

const mockedExecSync = execSync as jest.MockedFunction<typeof execSync>;
const mockedGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;
const mockedEnsureDirectories = ensureDirectories as jest.MockedFunction<
  typeof ensureDirectories
>;

const makeManifest = (id: string, version: string): MCPServerManifest => ({
  id,
  name: `Server ${id}`,
  description: `Description for ${id}`,
  version,
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
});

describe('Installer', () => {
  let tempRoot: string;
  let installDir: string;
  let cacheDir: string;

  beforeEach(() => {
    tempRoot = mkdtempSync(join(tmpdir(), 'mcp-registry-test-'));
    installDir = join(tempRoot, 'servers');
    cacheDir = join(tempRoot, 'cache');

    mockedGetConfig.mockReturnValue({
      registryUrl: 'https://registry.test',
      cacheDir,
      installDir,
      mcpConfigPath: join(tempRoot, 'settings.json'),
    });

    mockedEnsureDirectories.mockImplementation(() => {
      mkdirSync(installDir, { recursive: true });
      mkdirSync(cacheDir, { recursive: true });
    });

    mockedExecSync.mockClear();
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
    jest.clearAllMocks();
  });

  it('installs a server and records it in installed.json', async () => {
    const installer = new Installer();
    const manifest = makeManifest('alpha', '1.0.0');

    const installed = await installer.install(manifest);

    const serverDir = join(installDir, 'alpha');
    const manifestPath = join(serverDir, 'manifest.json');
    const dbPath = join(installDir, 'installed.json');

    expect(installed.id).toBe('alpha');
    expect(installed.version).toBe('1.0.0');
    expect(installed.path).toBe(serverDir);
    expect(existsSync(serverDir)).toBe(true);
    expect(existsSync(manifestPath)).toBe(true);
    expect(new Date(installed.installedAt).toString()).not.toBe('Invalid Date');
    expect(new Date(installed.updatedAt).toString()).not.toBe('Invalid Date');

    const storedManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    expect(storedManifest.id).toBe('alpha');

    const installedDb = JSON.parse(readFileSync(dbPath, 'utf-8'));
    expect(installedDb).toHaveLength(1);
    expect(installedDb[0].id).toBe('alpha');

    expect(mockedExecSync).toHaveBeenCalledWith(
      'npm install alpha-package',
      expect.objectContaining({ cwd: serverDir, stdio: 'pipe' })
    );
  });

  it('updates an installed server by reinstalling it', async () => {
    const installer = new Installer();
    const manifestV1 = makeManifest('beta', '1.0.0');
    const manifestV2 = makeManifest('beta', '1.1.0');

    await installer.install(manifestV1);
    mockedExecSync.mockClear();

    const updated = await installer.update(manifestV2);

    const dbPath = join(installDir, 'installed.json');
    const installedDb = JSON.parse(readFileSync(dbPath, 'utf-8'));

    expect(updated.version).toBe('1.1.0');
    expect(installedDb).toHaveLength(1);
    expect(installedDb[0].version).toBe('1.1.0');
    expect(mockedExecSync).toHaveBeenCalled();
  });

  it('removes an installed server and updates installed.json', async () => {
    const installer = new Installer();
    const manifest = makeManifest('gamma', '2.0.0');

    await installer.install(manifest);
    await installer.remove('gamma');

    const serverDir = join(installDir, 'gamma');
    const dbPath = join(installDir, 'installed.json');

    expect(existsSync(serverDir)).toBe(false);
    const installedDb = JSON.parse(readFileSync(dbPath, 'utf-8'));
    expect(installedDb).toHaveLength(0);
  });

  it('throws when installing a server that already exists', async () => {
    const installer = new Installer();
    const manifest = makeManifest('delta', '1.0.0');

    await installer.install(manifest);
    await expect(installer.install(manifest)).rejects.toThrow(
      "Server delta is already installed. Use 'update' instead."
    );
  });
});
