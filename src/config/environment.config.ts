import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().transform(Number).default(3000),

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

  // Auth
  API_SECRET_KEY: z.string(),

  // File upload
  MAX_FILE_SIZE: z.string().transform(Number).default(10 * 1024 * 1024),
  UPLOAD_DIR: z.string().default('uploads'),
  TEMP_DIR: z.string().default('temp'),

  // Audio processing
  AUDIO_MAX_DURATION: z.string().transform(Number).default(5 * 60), // 5 minutes
  AUDIO_ALLOWED_FORMATS: z.array(z.string()).default(['mp3', 'wav', 'm4a', 'ogg', 'flac']),

  // Session management
  SESSION_TTL: z.string().transform(Number).default(6 * 60), // 60 minutes
  MEMORY_BUFFER_SIZE: z.string().transform(Number).default(20),
  VECTOR_DIMENSIONS: z.string().transform(Number).default(1536),

  // External services Health Check URLs
  OPENAI_HEALTH_URL: z.string().url().default('https://status.openai.com/api/v2/summary.json'),
});

export const env = envSchema.parse(process.env);
export type Environment = z.infer<typeof envSchema>;
