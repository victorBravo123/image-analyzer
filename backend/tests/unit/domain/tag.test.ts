import { Tag } from '../../../src/domain/model/tag';
import { InvalidTagError } from '../../../src/domain/errors/invalid-tag.error';

describe('Tag', () => {
  it('creates a tag with a trimmed label and its confidence', () => {
    const tag = Tag.create('  Golden Retriever  ', 0.95);

    expect(tag.label).toBe('Golden Retriever');
    expect(tag.confidence).toBe(0.95);
  });

  it.each([0, 1])('accepts boundary confidence %p', (confidence) => {
    expect(Tag.create('Dog', confidence).confidence).toBe(confidence);
  });

  it('rejects an empty label', () => {
    expect(() => Tag.create('   ', 0.5)).toThrow(InvalidTagError);
  });

  it.each([-0.1, 1.1, NaN, Infinity])('rejects out-of-range confidence %p', (confidence) => {
    expect(() => Tag.create('Dog', confidence)).toThrow(InvalidTagError);
  });
});
