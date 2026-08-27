import { loadEnv, maxImageBytes } from '../../../src/infrastructure/config/env';

describe('loadEnv', () => {
  it('applies safe defaults for an empty environment', () => {
    const env = loadEnv({});

    expect(env).toMatchObject({ PORT: 3000, MAX_IMAGE_MB: 5, ANNOTATOR: 'fake' });
  });

  it('parses numeric values from strings', () => {
    const env = loadEnv({ PORT: '8080', MAX_IMAGE_MB: '2' });

    expect(env.PORT).toBe(8080);
    expect(maxImageBytes(env)).toBe(2 * 1024 * 1024);
  });

  it('requires Imagga credentials when the real annotator is selected', () => {
    expect(() => loadEnv({ ANNOTATOR: 'imagga' })).toThrow(/IMAGGA_API_KEY/);
  });

  it('accepts the imagga annotator once credentials are present', () => {
    const env = loadEnv({
      ANNOTATOR: 'imagga',
      IMAGGA_API_KEY: 'key',
      IMAGGA_API_SECRET: 'secret',
    });

    expect(env.ANNOTATOR).toBe('imagga');
  });

  it('rejects an unknown annotator', () => {
    expect(() => loadEnv({ ANNOTATOR: 'skynet' })).toThrow(/Invalid environment/);
  });
});
