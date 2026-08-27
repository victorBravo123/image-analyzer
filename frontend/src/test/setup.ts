import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// jsdom does not implement object URLs; the preview flow needs stable stubs.
Object.assign(URL, {
  createObjectURL: vi.fn(() => 'blob:mock-preview'),
  revokeObjectURL: vi.fn(),
});
