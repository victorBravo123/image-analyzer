import type { Tag } from './tag';

/**
 * Result of analyzing one image: its tags ordered by descending confidence,
 * so every consumer (HTTP, logs, future persistence) sees the same ranking.
 */
export class ImageAnalysis {
  private constructor(readonly tags: readonly Tag[]) {}

  static fromTags(tags: readonly Tag[]): ImageAnalysis {
    const ranked = [...tags].sort((a, b) => b.confidence - a.confidence);
    return new ImageAnalysis(ranked);
  }
}
