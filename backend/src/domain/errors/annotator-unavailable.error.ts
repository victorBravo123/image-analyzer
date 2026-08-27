import { DomainError } from './domain.error';

/** The AI provider is temporarily rejecting requests (rate limit, maintenance). */
export class AnnotatorUnavailableError extends DomainError {
  readonly code = 'SERVICE_UNAVAILABLE';

  constructor(reason: string) {
    super(`Image annotator unavailable: ${reason}`);
  }
}
