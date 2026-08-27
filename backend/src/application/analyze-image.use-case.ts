import { ImageAnalysis } from '../domain/model/image-analysis';
import { detectImageFormat } from '../domain/model/image-format';
import { UnsupportedImageFormatError } from '../domain/errors/unsupported-image-format.error';
import type { ImageAnnotator } from '../domain/ports/image-annotator';

export interface AnalyzeImageCommand {
  readonly content: Buffer;
}

/**
 * Orchestrates the single business flow of the app: validate that the upload
 * really is an image, hand it to the annotator port, and return the ranked
 * analysis. Which provider sits behind the port is decided at composition time.
 */
export class AnalyzeImageUseCase {
  constructor(private readonly annotator: ImageAnnotator) {}

  async execute(command: AnalyzeImageCommand): Promise<ImageAnalysis> {
    const format = detectImageFormat(command.content);
    if (format === null) {
      throw new UnsupportedImageFormatError();
    }

    const tags = await this.annotator.annotate({ content: command.content, format });
    return ImageAnalysis.fromTags(tags);
  }
}
