import { createAnnotator } from '../../../src/infrastructure/providers/annotator.factory';
import { FakeAnnotator } from '../../../src/infrastructure/providers/fake.annotator';
import { ImaggaAnnotator } from '../../../src/infrastructure/providers/imagga.annotator';
import { loadEnv } from '../../../src/infrastructure/config/env';

describe('createAnnotator', () => {
  it('returns the fake annotator by default (demo mode without credentials)', () => {
    expect(createAnnotator(loadEnv({}))).toBeInstanceOf(FakeAnnotator);
  });

  it('returns the Imagga annotator when configured with credentials', () => {
    const env = loadEnv({
      ANNOTATOR: 'imagga',
      IMAGGA_API_KEY: 'key',
      IMAGGA_API_SECRET: 'secret',
    });

    expect(createAnnotator(env)).toBeInstanceOf(ImaggaAnnotator);
  });
});
