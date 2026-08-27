import { DomainError } from './domain.error';

export class InvalidTagError extends DomainError {
  readonly code = 'INVALID_TAG';

  constructor(reason: string) {
    super(`Invalid tag: ${reason}`);
  }
}
