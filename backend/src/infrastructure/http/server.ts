import express from 'express';
import { pinoHttp } from 'pino-http';
import type { Logger } from 'pino';
import type { AnalyzeImageUseCase } from '../../application/analyze-image.use-case';
import { analyzeRouter } from './routes/analyze.route';
import { errorHandler } from './middleware/error-handler';

export interface ServerDependencies {
  analyzeImage: AnalyzeImageUseCase;
  maxImageBytes: number;
  logger: Logger;
}

/**
 * App factory: receives fully-built dependencies so tests can inject stubs
 * and the composition root (main.ts) stays the only place that knows about
 * concrete adapters.
 */
export function buildApp({ analyzeImage, maxImageBytes, logger }: ServerDependencies): express.Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });
  app.use('/api', analyzeRouter(analyzeImage, maxImageBytes));

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } });
  });
  app.use(errorHandler(logger));

  return app;
}
