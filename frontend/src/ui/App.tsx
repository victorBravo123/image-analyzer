import { useImageSelection } from '../application/useImageSelection';
import { useImageAnalysis } from '../application/useImageAnalysis';
import type { ApiErrorCode } from '../infrastructure/api/analyze-client';
import type { ImageValidationError } from '../domain/image-validation';
import { ImageDropzone } from './components/ImageDropzone';
import { LoadingSpinner } from './components/LoadingSpinner';
import { TagList } from './components/TagList';
import { ErrorBanner } from './components/ErrorBanner';

const VALIDATION_MESSAGES: Record<ImageValidationError, string> = {
  NOT_AN_IMAGE: 'El archivo seleccionado no es una imagen. Usa JPG, PNG, WebP o GIF.',
  TOO_LARGE: 'La imagen supera el máximo de 5 MB. Elige un archivo más liviano.',
};

const API_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  IMAGE_REQUIRED: 'No se envió ninguna imagen. Selecciona un archivo e intenta de nuevo.',
  UNSUPPORTED_MEDIA_TYPE: 'El servidor rechazó el archivo: no es una imagen válida.',
  IMAGE_TOO_LARGE: 'El servidor rechazó la imagen por superar el tamaño máximo (5 MB).',
  ANALYSIS_FAILED: 'El servicio de IA no pudo analizar la imagen. Intenta de nuevo en unos segundos.',
  SERVICE_UNAVAILABLE: 'El servicio de IA está saturado en este momento. Espera un momento y reintenta.',
  NETWORK_ERROR: 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.',
  UNEXPECTED: 'Ocurrió un error inesperado. Intenta de nuevo.',
};

export function App() {
  const selection = useImageSelection();
  const analysis = useImageAnalysis();
  const isLoading = analysis.status === 'loading';

  const handleSelect = (file: File) => {
    analysis.reset();
    selection.select(file);
  };

  const handleAnalyze = () => {
    if (selection.file) {
      void analysis.analyze(selection.file);
    }
  };

  return (
    <div className="page">
      <header className="page__header">
        <h1>Analizador de Imágenes</h1>
        <p>Sube una imagen y descubre qué contiene usando inteligencia artificial.</p>
      </header>

      <main className="card">
        <ImageDropzone
          previewUrl={selection.previewUrl}
          fileName={selection.file?.name ?? null}
          disabled={isLoading}
          onSelect={handleSelect}
        />

        {selection.validationError && (
          <ErrorBanner message={VALIDATION_MESSAGES[selection.validationError]} />
        )}

        <button
          type="button"
          className="analyze-button"
          disabled={!selection.file || isLoading}
          onClick={handleAnalyze}
        >
          {isLoading ? 'Analizando…' : 'Analizar'}
        </button>

        {isLoading && <LoadingSpinner />}

        {analysis.status === 'error' && analysis.errorCode && (
          <ErrorBanner message={API_ERROR_MESSAGES[analysis.errorCode]} />
        )}

        {analysis.status === 'success' && analysis.result && <TagList tags={analysis.result.tags} />}
      </main>
    </div>
  );
}
