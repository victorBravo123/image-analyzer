import type { Env } from '../config/env';
import type { ImageAnnotator } from '../../domain/ports/image-annotator';
import { FakeAnnotator } from './fake.annotator';
import { ImaggaAnnotator } from './imagga.annotator';

/**
 * Chooses the concrete adapter for the ImageAnnotator port from configuration.
 * loadEnv already guarantees credentials exist when ANNOTATOR=imagga; the
 * guard here keeps the factory safe if it is ever called with a raw env.
 */
export function createAnnotator(env: Env): ImageAnnotator {
  if (env.ANNOTATOR === 'imagga') {
    if (!env.IMAGGA_API_KEY || !env.IMAGGA_API_SECRET) {
      throw new Error('Imagga credentials missing: set IMAGGA_API_KEY and IMAGGA_API_SECRET');
    }
    return new ImaggaAnnotator({
      apiKey: env.IMAGGA_API_KEY,
      apiSecret: env.IMAGGA_API_SECRET,
      timeoutMs: env.IMAGGA_TIMEOUT_MS,
    });
  }
  return new FakeAnnotator();
}
