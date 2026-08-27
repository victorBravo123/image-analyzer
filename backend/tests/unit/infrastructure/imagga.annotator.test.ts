import { ImaggaAnnotator } from '../../../src/infrastructure/providers/imagga.annotator';
import { AnalysisFailedError } from '../../../src/domain/errors/analysis-failed.error';
import { AnnotatorUnavailableError } from '../../../src/domain/errors/annotator-unavailable.error';
import type { ImageToAnnotate } from '../../../src/domain/ports/image-annotator';

const IMAGE: ImageToAnnotate = {
  content: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  format: 'jpeg',
};

const CONFIG = {
  apiKey: 'test-key',
  apiSecret: 'test-secret',
  timeoutMs: 5000,
};

function imaggaJson(tags: Array<{ confidence?: number; tag?: { en?: string } }>): Response {
  return new Response(JSON.stringify({ result: { tags } }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

describe('ImaggaAnnotator', () => {
  let fetchSpy: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  it('maps Imagga tags to domain tags, normalizing confidence from 0-100 to 0-1', async () => {
    fetchSpy.mockResolvedValue(
      imaggaJson([
        { confidence: 98.32, tag: { en: 'dog' } },
        { confidence: 91.5, tag: { en: 'park' } },
      ]),
    );

    const tags = await new ImaggaAnnotator(CONFIG).annotate(IMAGE);

    expect(tags.map((tag) => ({ label: tag.label, confidence: tag.confidence }))).toEqual([
      { label: 'dog', confidence: 0.9832 },
      { label: 'park', confidence: 0.915 },
    ]);
  });

  it('authenticates with Basic auth and sends the image as multipart form data', async () => {
    fetchSpy.mockResolvedValue(imaggaJson([]));

    await new ImaggaAnnotator(CONFIG).annotate(IMAGE);

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.imagga.com/v2/tags?limit=10');
    expect(init.method).toBe('POST');
    const expectedAuth = `Basic ${Buffer.from('test-key:test-secret').toString('base64')}`;
    expect((init.headers as Record<string, string>).Authorization).toBe(expectedAuth);
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get('image')).toBeInstanceOf(Blob);
  });

  it('skips malformed entries and clamps out-of-range confidence', async () => {
    fetchSpy.mockResolvedValue(
      imaggaJson([
        { confidence: 120, tag: { en: 'sun' } },
        { confidence: 90 },
        { tag: { en: '   ' } },
      ]),
    );

    const tags = await new ImaggaAnnotator(CONFIG).annotate(IMAGE);

    expect(tags).toHaveLength(1);
    expect(tags[0]).toMatchObject({ label: 'sun', confidence: 1 });
  });

  it('translates HTTP 429 into AnnotatorUnavailableError', async () => {
    fetchSpy.mockResolvedValue(new Response('rate limited', { status: 429 }));

    await expect(new ImaggaAnnotator(CONFIG).annotate(IMAGE)).rejects.toThrow(
      AnnotatorUnavailableError,
    );
  });

  it('translates other upstream errors into AnalysisFailedError', async () => {
    fetchSpy.mockResolvedValue(new Response('bad credentials', { status: 401 }));

    await expect(new ImaggaAnnotator(CONFIG).annotate(IMAGE)).rejects.toThrow(AnalysisFailedError);
  });

  it('translates a timeout into AnalysisFailedError mentioning the deadline', async () => {
    const timeout = new Error('aborted');
    timeout.name = 'TimeoutError';
    fetchSpy.mockRejectedValue(timeout);

    await expect(new ImaggaAnnotator(CONFIG).annotate(IMAGE)).rejects.toThrow(/5000ms/);
  });

  it('translates a network failure into AnalysisFailedError', async () => {
    fetchSpy.mockRejectedValue(new TypeError('fetch failed'));

    await expect(new ImaggaAnnotator(CONFIG).annotate(IMAGE)).rejects.toThrow(AnalysisFailedError);
  });
});
