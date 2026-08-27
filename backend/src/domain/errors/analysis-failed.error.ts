import { DomainError } from './domain.error';

/** The AI provider could not analyze the image (upstream error or timeout). */
export class AnalysisFailedError extends DomainError {
  readonly code = 'ANALYSIS_FAILED';

  constructor(reason: string) {
    super(`Image analysis failed: ${reason}`);
  }
}
