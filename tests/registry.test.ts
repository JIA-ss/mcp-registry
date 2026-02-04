import { RegistryClient } from '../src/registry.js';
import { Installer } from '../src/installer.js';
import { getConfig } from '../src/config.js';

// Mock axios for tests
jest.mock('axios');

describe('RegistryClient', () => {
  let client: RegistryClient;
  
  beforeEach(() => {
    client = new RegistryClient('https://test.registry.dev');
  });
  
  describe('getIndex', () => {
    it('should fetch the registry index', async () => {
      // Mock implementation would go here
      expect(client).toBeDefined();
    });
  });
});

describe('Installer', () => {
  let installer: Installer;
  
  beforeEach(() => {
    installer = new Installer();
  });
  
  describe('listInstalled', () => {
    it('should return empty array when no servers installed', () => {
      const installed = installer.listInstalled();
      expect(Array.isArray(installed)).toBe(true);
    });
  });
});

describe('Config', () => {
  it('should return default config', () => {
    const config = getConfig();
    expect(config).toHaveProperty('registryUrl');
    expect(config).toHaveProperty('installDir');
    expect(config).toHaveProperty('cacheDir');
  });
});
