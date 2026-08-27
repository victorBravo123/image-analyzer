import { AnalyzeImageUseCase } from '../../../src/application/analyze-image.use-case';
import { UnsupportedImageFormatError } from '../../../src/domain/errors/unsupported-image-format.error';
import { Tag } from '../../../src/domain/model/tag';
import type { ImageAnnotator, ImageToAnnotate } from '../../../src/domain/ports/image-annotator';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

class StubAnnotator implements ImageAnnotator {
  received: ImageToAnnotate | undefined;

  constructor(private readonly tags: Tag[]) {}

  annotate(image: ImageToAnnotate): Promise<Tag[]> {
    this.received = image;
    return Promise.resolve(this.tags);
  }
}

describe('AnalyzeImageUseCase', () => {
  it('detects the format and forwards the image to the annotator', async () => {
    const annotator = new StubAnnotator([Tag.create('Dog', 0.98)]);
    const useCase = new AnalyzeImageUseCase(annotator);

    await useCase.execute({ content: PNG });

    expect(annotator.received).toEqual({ content: PNG, format: 'png' });
  });

  it('returns tags ranked by descending confidence', async () => {
    const annotator = new StubAnnotator([
      Tag.create('Grass', 0.88),
      Tag.create('Dog', 0.98),
    ]);
    const useCase = new AnalyzeImageUseCase(annotator);

    const analysis = await useCase.execute({ content: PNG });

    expect(analysis.tags.map((tag) => tag.label)).toEqual(['Dog', 'Grass']);
  });

  it('rejects non-image content without ever calling the annotator', async () => {
    const annotator = new StubAnnotator([]);
    const useCase = new AnalyzeImageUseCase(annotator);

    await expect(useCase.execute({ content: Buffer.from('not an image') })).rejects.toThrow(
      UnsupportedImageFormatError,
    );
    expect(annotator.received).toBeUndefined();
  });

  it('propagates annotator failures untouched', async () => {
    const failure = new Error('provider exploded');
    const annotator: ImageAnnotator = {
      annotate: () => Promise.reject(failure),
    };
    const useCase = new AnalyzeImageUseCase(annotator);

    await expect(useCase.execute({ content: PNG })).rejects.toBe(failure);
  });
});
