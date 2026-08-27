import { detectImageFormat } from '../../../src/domain/model/image-format';

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const GIF = Buffer.from('GIF89a\x01\x00', 'ascii');
const WEBP = Buffer.concat([
  Buffer.from('RIFF', 'ascii'),
  Buffer.from([0x24, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP', 'ascii'),
]);

describe('detectImageFormat', () => {
  it.each([
    ['jpeg', JPEG],
    ['png', PNG],
    ['gif', GIF],
    ['webp', WEBP],
  ] as const)('detects %s by magic bytes', (format, content) => {
    expect(detectImageFormat(content)).toBe(format);
  });

  it('rejects plain text renamed to .jpg', () => {
    expect(detectImageFormat(Buffer.from('definitely not an image', 'utf8'))).toBeNull();
  });

  it('rejects an empty file', () => {
    expect(detectImageFormat(Buffer.alloc(0))).toBeNull();
  });

  it('rejects a truncated signature', () => {
    expect(detectImageFormat(Buffer.from([0xff, 0xd8]))).toBeNull();
  });

  it('rejects a RIFF container that is not WebP (e.g. WAV audio)', () => {
    const wav = Buffer.concat([
      Buffer.from('RIFF', 'ascii'),
      Buffer.from([0x24, 0x00, 0x00, 0x00]),
      Buffer.from('WAVE', 'ascii'),
    ]);
    expect(detectImageFormat(wav)).toBeNull();
  });
});
