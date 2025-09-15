import cors, { CorsOptions } from 'cors';
import { logger } from '../utils/logger.util';

export interface CorsConfig {
  origins?: string[] | string;
  credentials?: boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  maxAge?: number;
}

/**
 * Configuração CORS flexível
 */
export const createCorsMiddleware = (config: CorsConfig = {}) => {
  const {
    origins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials = true,
    methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders = ['X-Total-Count', 'X-Page-Count'],
    maxAge = 86400, // 24 horas
  } = config;

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Permitir requests sem origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Verificar se origin está na lista permitida
      const allowedOrigins = Array.isArray(origins) ? origins : [origins];

      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn('CORS blocked origin:', { origin, allowedOrigins });
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials,
    methods,
    allowedHeaders,
    exposedHeaders,
    maxAge,
    optionsSuccessStatus: 200, // Para suportar browsers legados
  };

  return cors(corsOptions);
};

/**
 * CORS permissivo para desenvolvimento
 */
export const devCors = createCorsMiddleware({
  origins: '*',
  credentials: true,
});

/**
 * CORS restritivo para produção
 */
export const prodCors = createCorsMiddleware({
  origins: process.env.CORS_ORIGINS?.split(',') || [],
  credentials: true,
});

/**
 * CORS para APIs públicas
 */
export const publicApiCors = createCorsMiddleware({
  origins: '*',
  credentials: false,
  methods: ['GET', 'POST'],
});

/**
 * CORS padrão baseado no ambiente
 */
export const defaultCors = process.env.NODE_ENV === 'production' ? prodCors : devCors;
