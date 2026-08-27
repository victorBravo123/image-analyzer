import { Router } from 'express';
import multer from 'multer';
import type { AnalyzeImageUseCase } from '../../../application/analyze-image.use-case';
import type { ImageAnalysis } from '../../../domain/model/image-analysis';

interface AnalyzeResponseBody {
  tags: Array<{ label: string; confidence: number }>;
}

/**
 * POST /api/analyze — driving adapter for the analyze use case.
 * Uploads stay in memory: the image is forwarded to the provider and
 * discarded, never written to disk.
 */
export function analyzeRouter(useCase: AnalyzeImageUseCase, maxImageBytes: number): Router {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxImageBytes, files: 1 },
  });

  const router = Router();

  router.post('/analyze', upload.single('image'), (req, res, next) => {
    if (!req.file) {
      res.status(400).json({
        error: { code: 'IMAGE_REQUIRED', message: 'An image file is required in the "image" field' },
      });
      return;
    }

    useCase
      .execute({ content: req.file.buffer })
      .then((analysis) => res.status(200).json(toResponseBody(analysis)))
      .catch(next);
  });

  return router;
}

function toResponseBody(analysis: ImageAnalysis): AnalyzeResponseBody {
  return {
    tags: analysis.tags.map((tag) => ({ label: tag.label, confidence: tag.confidence })),
  };
}
