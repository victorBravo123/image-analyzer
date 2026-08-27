import { useCallback, useRef, useState } from 'react';
import type { DragEvent, ChangeEvent } from 'react';

interface ImageDropzoneProps {
  previewUrl: string | null;
  fileName: string | null;
  disabled: boolean;
  onSelect: (file: File) => void;
}

export function ImageDropzone({ previewUrl, fileName, disabled, onSelect }: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.item(0);
      if (file) {
        onSelect(file);
      }
    },
    [onSelect],
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    if (!disabled) {
      handleFiles(event.dataTransfer.files);
    }
  };

  return (
    <button
      type="button"
      className={`dropzone${isDragOver ? ' dropzone--active' : ''}${previewUrl ? ' dropzone--filled' : ''}`}
      disabled={disabled}
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      aria-label="Seleccionar imagen para analizar"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleChange}
        hidden
        data-testid="file-input"
      />
      {previewUrl ? (
        <figure className="dropzone__preview">
          <img src={previewUrl} alt={`Vista previa de ${fileName ?? 'la imagen'}`} />
          <figcaption>{fileName}</figcaption>
        </figure>
      ) : (
        <div className="dropzone__placeholder">
          <span className="dropzone__icon" aria-hidden="true">
            🖼️
          </span>
          <p>
            <strong>Haz clic para elegir una imagen</strong> o arrástrala aquí
          </p>
          <p className="dropzone__hint">JPG, PNG, WebP o GIF · máx. 5 MB</p>
        </div>
      )}
    </button>
  );
}
