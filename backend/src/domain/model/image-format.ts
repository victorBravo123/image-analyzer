export const SUPPORTED_IMAGE_FORMATS = ['jpeg', 'png', 'webp', 'gif'] as const;

export type ImageFormat = (typeof SUPPORTED_IMAGE_FORMATS)[number];

/**
 * Detects the real image format by inspecting the file's magic bytes.
 * Extension and client-declared mime type are never trusted: a .jpg that is
 * actually an executable must be rejected, which matters in any system that
 * accepts user uploads — and especially in a payments company.
 */
export function detectImageFormat(content: Buffer): ImageFormat | null {
  if (startsWith(content, [0xff, 0xd8, 0xff])) {
    return 'jpeg';
  }
  if (startsWith(content, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'png';
  }
  if (hasAscii(content, 'RIFF', 0) && hasAscii(content, 'WEBP', 8)) {
    return 'webp';
  }
  if (hasAscii(content, 'GIF87a', 0) || hasAscii(content, 'GIF89a', 0)) {
    return 'gif';
  }
  return null;
}

function startsWith(content: Buffer, signature: readonly number[]): boolean {
  return signature.length <= content.length && signature.every((byte, i) => content[i] === byte);
}

function hasAscii(content: Buffer, text: string, offset: number): boolean {
  return content.subarray(offset, offset + text.length).toString('ascii') === text;
}
