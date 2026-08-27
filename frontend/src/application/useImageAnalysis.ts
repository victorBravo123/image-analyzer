import { useCallback, useState } from 'react';
import { analyzeImage, ApiError } from '../infrastructure/api/analyze-client';
import type { ApiErrorCode } from '../infrastructure/api/analyze-client';
import type { AnalysisResult } from '../domain/types';

export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ImageAnalysisState {
  status: AnalysisStatus;
  result: AnalysisResult | null;
  errorCode: ApiErrorCode | null;
  analyze: (file: File) => Promise<void>;
  reset: () => void;
}

/** Explicit state machine for the analysis flow: idle → loading → success | error. */
export function useImageAnalysis(): ImageAnalysisState {
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorCode, setErrorCode] = useState<ApiErrorCode | null>(null);

  const analyze = useCallback(async (file: File) => {
    setStatus('loading');
    setResult(null);
    setErrorCode(null);
    try {
      setResult(await analyzeImage(file));
      setStatus('success');
    } catch (error) {
      setErrorCode(error instanceof ApiError ? error.code : 'UNEXPECTED');
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setErrorCode(null);
  }, []);

  return { status, result, errorCode, analyze, reset };
}
