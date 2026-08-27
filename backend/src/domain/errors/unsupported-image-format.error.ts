import { DomainError } from './domain.error';

export class UnsupportedImageFormatError extends DomainError {
  readonly code = 'UNSUPPORTED_MEDIA_TYPE';

  constructor() {
    super('File content is not a supported image format (jpeg, png, webp, gif)');
  }
}
