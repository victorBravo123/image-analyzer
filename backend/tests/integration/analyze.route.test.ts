import request from 'supertest';
import { pino } from 'pino';
import { buildApp } from '../../src/infrastructure/http/server';
import { AnalyzeImageUseCase } from '../../src/application/analyze-image.use-case';
import { Tag } from '../../src/domain/model/tag';
import { AnalysisFailedError } from '../../src/domain/errors/analysis-failed.error';
import { AnnotatorUnavailableError } from '../../src/domain/errors/annotator-unavailable.error';
import type { ImageAnnotator } from '../../src/domain/ports/image-annotator';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const ONE_MB = 1024 * 1024;

interface ErrorEnvelope {
  error: { code: string; message: string };
}

function errorCode(body: unknown): string {
  return (body as ErrorEnvelope).error.code;
}

function appWith(annotator: ImageAnnotator, maxImageBytes = ONE_MB) {
  return buildApp({
    analyzeImage: new AnalyzeImageUseCase(annotator),
    maxImageBytes,
    logger: pino({ enabled: false }),
  });
}

const happyAnnotator: ImageAnnotator = {
  annotate: () =>
    Promise.resolve([Tag.create('Grass', 0.88), Tag.create('Dog', 0.98), Tag.create('Park', 0.91)]),
};

describe('POST /api/analyze', () => {
  it('returns ranked tags for a valid image', async () => {
    const response = await request(appWith(happyAnnotator))
      .post('/api/analyze')
      .attach('image', PNG, 'dog.png');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      tags: [
        { label: 'Dog', confidence: 0.98 },
        { label: 'Park', confidence: 0.91 },
        { label: 'Grass', confidence: 0.88 },
      ],
    });
  });

  it('rejects a request without a file with 400 IMAGE_REQUIRED', async () => {
    const response = await request(appWith(happyAnnotator)).post('/api/analyze');

    expect(response.status).toBe(400);
    expect(errorCode(response.body)).toBe('IMAGE_REQUIRED');
  });

  it('rejects an upload under a wrong field name with 400 INVALID_UPLOAD', async () => {
    const response = await request(appWith(happyAnnotator))
      .post('/api/analyze')
      .attach('photo', PNG, 'dog.png');

    expect(response.status).toBe(400);
    expect(errorCode(response.body)).toBe('INVALID_UPLOAD');
  });

  it('rejects non-image content with 415 UNSUPPORTED_MEDIA_TYPE', async () => {
    const response = await request(appWith(happyAnnotator))
      .post('/api/analyze')
      .attach('image', Buffer.from('plain text pretending to be a photo'), 'fake.jpg');

    expect(response.status).toBe(415);
    expect(errorCode(response.body)).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  it('rejects an oversized file with 413 IMAGE_TOO_LARGE', async () => {
    const oversized = Buffer.concat([PNG, Buffer.alloc(ONE_MB)]);

    const response = await request(appWith(happyAnnotator, ONE_MB))
      .post('/api/analyze')
      .attach('image', oversized, 'huge.png');

    expect(response.status).toBe(413);
    expect(errorCode(response.body)).toBe('IMAGE_TOO_LARGE');
  });

  it('maps a provider failure to 502 ANALYSIS_FAILED', async () => {
    const failing: ImageAnnotator = {
      annotate: () => Promise.reject(new AnalysisFailedError('upstream timeout')),
    };

    const response = await request(appWith(failing)).post('/api/analyze').attach('image', PNG, 'dog.png');

    expect(response.status).toBe(502);
    expect(errorCode(response.body)).toBe('ANALYSIS_FAILED');
  });

  it('maps provider rate limiting to 503 SERVICE_UNAVAILABLE', async () => {
    const rateLimited: ImageAnnotator = {
      annotate: () => Promise.reject(new AnnotatorUnavailableError('rate limit exceeded')),
    };

    const response = await request(appWith(rateLimited))
      .post('/api/analyze')
      .attach('image', PNG, 'dog.png');

    expect(response.status).toBe(503);
    expect(errorCode(response.body)).toBe('SERVICE_UNAVAILABLE');
  });

  it('hides unexpected errors behind 500 INTERNAL_ERROR', async () => {
    const broken: ImageAnnotator = {
      annotate: () => Promise.reject(new Error('secret connection string leaked in message')),
    };

    const response = await request(appWith(broken)).post('/api/analyze').attach('image', PNG, 'dog.png');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' },
    });
  });
});

describe('GET /api/health', () => {
  it('reports service health', async () => {
    const response = await request(appWith(happyAnnotator)).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

describe('unknown routes', () => {
  it('returns a JSON 404 envelope', async () => {
    const response = await request(appWith(happyAnnotator)).get('/api/unknown');

    expect(response.status).toBe(404);
    expect(errorCode(response.body)).toBe('NOT_FOUND');
  });
});
