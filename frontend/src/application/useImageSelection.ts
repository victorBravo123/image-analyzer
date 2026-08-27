import { useCallback, useEffect, useState } from 'react';
import { validateImageFile } from '../domain/image-validation';
import type { ImageValidationError } from '../domain/image-validation';

export interface ImageSelection {
  file: File | null;
  previewUrl: string | null;
  validationError: ImageValidationError | null;
  select: (candidate: File) => void;
  clear: () => void;
}

/**
 * Owns the selected file and its preview URL. The object URL is revoked on
 * every change and on unmount so repeated uploads do not leak memory.
 */
export function useImageSelection(): ImageSelection {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<ImageValidationError | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const select = useCallback((candidate: File) => {
    const error = validateImageFile(candidate);
    setValidationError(error);
    setFile(error ? null : candidate);
  }, []);

  const clear = useCallback(() => {
    setFile(null);
    setValidationError(null);
  }, []);

  return { file, previewUrl, validationError, select, clear };
}
