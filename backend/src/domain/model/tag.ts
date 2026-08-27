import { InvalidTagError } from '../errors/invalid-tag.error';

/**
 * A label describing image content, with a confidence normalized to [0, 1].
 * Immutable value object: two tags with the same label and confidence are
 * interchangeable.
 */
export class Tag {
  private constructor(
    readonly label: string,
    readonly confidence: number,
  ) {}

  static create(label: string, confidence: number): Tag {
    const normalizedLabel = label.trim();
    if (normalizedLabel.length === 0) {
      throw new InvalidTagError('label must not be empty');
    }
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      throw new InvalidTagError(`confidence must be a number between 0 and 1, got ${confidence}`);
    }
    return new Tag(normalizedLabel, confidence);
  }
}
