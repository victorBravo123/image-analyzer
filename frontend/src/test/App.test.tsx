import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { App } from '../ui/App';
import { ApiError } from '../infrastructure/api/analyze-client';

vi.mock('../infrastructure/api/analyze-client', async (importOriginal) => {
  const original = await importOriginal<typeof import('../infrastructure/api/analyze-client')>();
  return { ...original, analyzeImage: vi.fn() };
});

const { analyzeImage } = await import('../infrastructure/api/analyze-client');
const analyzeImageMock = vi.mocked(analyzeImage);

function pngFile(name = 'dog.png', sizeBytes = 1024): File {
  const file = new File([new Uint8Array(8)], name, { type: 'image/png' });
  Object.defineProperty(file, 'size', { value: sizeBytes });
  return file;
}

async function selectFile(file: File) {
  const input = screen.getByTestId('file-input');
  await userEvent.upload(input as HTMLInputElement, file);
}

describe('App', () => {
  beforeEach(() => {
    analyzeImageMock.mockReset();
  });

  it('keeps the analyze button disabled until a valid image is selected', async () => {
    render(<App />);

    expect(screen.getByRole('button', { name: 'Analizar' })).toBeDisabled();

    await selectFile(pngFile());

    expect(screen.getByRole('button', { name: 'Analizar' })).toBeEnabled();
    expect(screen.getByAltText(/dog\.png/)).toBeInTheDocument();
  });

  it('shows a validation error for files over 5 MB and keeps the button disabled', async () => {
    render(<App />);

    await selectFile(pngFile('huge.png', 6 * 1024 * 1024));

    expect(screen.getByRole('alert')).toHaveTextContent(/supera el máximo de 5 MB/);
    expect(screen.getByRole('button', { name: 'Analizar' })).toBeDisabled();
  });

  it('shows the spinner while analyzing and then renders the ranked tags', async () => {
    let resolveAnalysis!: (value: { tags: { label: string; confidence: number }[] }) => void;
    analyzeImageMock.mockImplementation(
      () => new Promise((resolve) => (resolveAnalysis = resolve)),
    );
    render(<App />);
    await selectFile(pngFile());

    await userEvent.click(screen.getByRole('button', { name: 'Analizar' }));

    expect(screen.getByRole('status')).toHaveTextContent(/Analizando/);

    resolveAnalysis({
      tags: [
        { label: 'perro', confidence: 0.98 },
        { label: 'parque', confidence: 0.91 },
      ],
    });

    expect(await screen.findByText('perro')).toBeInTheDocument();
    expect(screen.getByText('98%')).toBeInTheDocument();
    expect(screen.getByText('parque')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows a readable message when the AI provider fails', async () => {
    analyzeImageMock.mockRejectedValue(new ApiError('ANALYSIS_FAILED', 'upstream error'));
    render(<App />);
    await selectFile(pngFile());

    await userEvent.click(screen.getByRole('button', { name: 'Analizar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/no pudo analizar la imagen/);
  });

  it('shows an empty state when the AI finds no tags', async () => {
    analyzeImageMock.mockResolvedValue({ tags: [] });
    render(<App />);
    await selectFile(pngFile());

    await userEvent.click(screen.getByRole('button', { name: 'Analizar' }));

    expect(await screen.findByText(/no reconoció contenido/)).toBeInTheDocument();
  });
});
