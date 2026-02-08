import { getConfig } from '../src/config.js';

describe('Config', () => {
  it('returns defaults merged with any user config', () => {
    const config = getConfig();

    expect(config).toHaveProperty('registryUrl');
    expect(config).toHaveProperty('installDir');
    expect(config).toHaveProperty('cacheDir');
    expect(config).toHaveProperty('mcpConfigPath');
  });
});
