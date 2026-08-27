import { z } from 'zod';

const envSchema = z
  .object({
    PORT: z.coerce.number().int().positive().default(3000),
    MAX_IMAGE_MB: z.coerce.number().positive().default(5),
    ANNOTATOR: z.enum(['imagga', 'fake']).default('fake'),
    IMAGGA_API_KEY: z.string().trim().optional(),
    IMAGGA_API_SECRET: z.string().trim().optional(),
    IMAGGA_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  })
  .superRefine((env, ctx) => {
    if (env.ANNOTATOR === 'imagga' && (!env.IMAGGA_API_KEY || !env.IMAGGA_API_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'IMAGGA_API_KEY and IMAGGA_API_SECRET are required when ANNOTATOR=imagga. ' +
          'Use ANNOTATOR=fake to run without credentials.',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

/**
 * Fail-fast configuration: the process refuses to boot with an invalid or
 * incomplete environment instead of failing later on the first request.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues.map((issue) => issue.message).join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return result.data;
}

export function maxImageBytes(env: Env): number {
  return Math.floor(env.MAX_IMAGE_MB * 1024 * 1024);
}
