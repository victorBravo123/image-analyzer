import { ImageAnalysis } from '../../../src/domain/model/image-analysis';
import { Tag } from '../../../src/domain/model/tag';

describe('ImageAnalysis', () => {
  it('ranks tags by descending confidence', () => {
    const analysis = ImageAnalysis.fromTags([
      Tag.create('Grass', 0.88),
      Tag.create('Dog', 0.98),
      Tag.create('Park', 0.91),
    ]);

    expect(analysis.tags.map((tag) => tag.label)).toEqual(['Dog', 'Park', 'Grass']);
  });

  it('supports an empty result (image with no recognizable content)', () => {
    expect(ImageAnalysis.fromTags([]).tags).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const input = [Tag.create('Grass', 0.1), Tag.create('Dog', 0.9)];

    ImageAnalysis.fromTags(input);

    expect(input.map((tag) => tag.label)).toEqual(['Grass', 'Dog']);
  });
});
