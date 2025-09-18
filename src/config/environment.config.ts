import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().transform(Number).default(3000),

  // Pareazul API
  PAREAZUL_API_WEBSERVICE: z.string().url(),
  PAREAZUL_API_BACKEND: z.string().url().optional(),

  // Database
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // OpenAI
  OPENAI_API_KEY: z.string(),

  // Security
  CORS_ORIGINS: z.string().optional(),
  API_BEARER_TOKEN: z.string(),

  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).default(10 * 1024 * 1024),
  UPLOAD_DIR: z.string().default('uploads'),
  TEMP_DIR: z.string().default('temp'),

  // Audio processing
  AUDIO_MAX_DURATION: z.string().transform(Number).default(5 * 60),

  // Session management
  SESSION_TTL: z.string().transform(Number).default(6 * 60), // 60 minutes
  MEMORY_BUFFER_SIZE: z.string().transform(Number).default(20),
  VECTOR_DIMENSIONS: z.string().transform(Number).default(1536),

  // External services Health Check URLs
  OPENAI_HEALTH_URL: z.string().url().default('https://status.openai.com/api/v2/summary.json'),
});

export const env = envSchema.parse(process.env);
export type Environment = z.infer<typeof envSchema>;
