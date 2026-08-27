import type { ImageFormat } from '../model/image-format';
import type { Tag } from '../model/tag';

export interface ImageToAnnotate {
  readonly content: Buffer;
  readonly format: ImageFormat;
}

/**
 * Driven port: the domain's contract with any AI vision provider.
 * Imagga is one adapter; Google Vision or OpenAI would be others. Swapping
 * providers never touches the domain or the use case — only the wiring in
 * the composition root.
 */
export interface ImageAnnotator {
  annotate(image: ImageToAnnotate): Promise<Tag[]>;
}
