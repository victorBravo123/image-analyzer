import type { AnalysisResult } from '../../domain/types';

export type ApiErrorCode =
  | 'IMAGE_REQUIRED'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'IMAGE_TOO_LARGE'
  | 'ANALYSIS_FAILED'
  | 'SERVICE_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'UNEXPECTED';

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ErrorEnvelope {
  error?: { code?: string; message?: string };
}

const KNOWN_CODES: ReadonlySet<string> = new Set([
  'IMAGE_REQUIRED',
  'UNSUPPORTED_MEDIA_TYPE',
  'IMAGE_TOO_LARGE',
  'ANALYSIS_FAILED',
  'SERVICE_UNAVAILABLE',
]);

/**
 * Driven adapter towards the backend. The rest of the app only sees
 * AnalysisResult or a typed ApiError — never raw fetch/HTTP details.
 */
export async function analyzeImage(file: File): Promise<AnalysisResult> {
  const body = new FormData();
  body.append('image', file);

  let response: Response;
  try {
    response = await fetch('/api/analyze', { method: 'POST', body });
  } catch {
    throw new ApiError('NETWORK_ERROR', 'Could not reach the API');
  }

  if (!response.ok) {
    throw await toApiError(response);
  }
  return (await response.json()) as AnalysisResult;
}

async function toApiError(response: Response): Promise<ApiError> {
  let envelope: ErrorEnvelope = {};
  try {
    envelope = (await response.json()) as ErrorEnvelope;
  } catch {
    // Non-JSON error body: fall through to the generic code below.
  }
  const code = envelope.error?.code;
  if (code && KNOWN_CODES.has(code)) {
    return new ApiError(code as ApiErrorCode, envelope.error?.message ?? code);
  }
  return new ApiError('UNEXPECTED', `API responded with HTTP ${response.status}`);
}
