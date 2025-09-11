// src/middleware/rate-limit.middleware.ts

import rateLimit from 'express-rate-limit';
import { redis } from '../utils/redis.util';
import { logger } from '../utils/logger.util';
import { Request, Response, NextFunction } from 'express';

export interface RateLimitConfig {
  windowMs?: number;
  max?: number;
  keyGenerator?: (req: Request) => string;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
  message?: string;
  headers?: boolean;
}

/**
 * Rate limiter padrão usando Redis como store
 */
export const createRateLimit = (config: RateLimitConfig = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutos
    max = 100, // 100 requests por janela
    keyGenerator,
    skipFailedRequests = false,
    skipSuccessfulRequests = false,
    message = 'Too many requests, please try again later',
    headers = true,
  } = config;

  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(windowMs / 1000),
    },
    keyGenerator: keyGenerator || ((req: Request) => req.ip || '127.0.0.1'),
    skipFailedRequests,
    skipSuccessfulRequests,
    standardHeaders: headers,
    legacyHeaders: false,
    // Store usando Redis
    store: {
      incr: async (key: string) => {
        try {
          const redisKey = `rate_limit:${key}`;
          const current = await redis.incr(redisKey);

          if (current === 1) {
            await redis.expire(redisKey, Math.ceil(windowMs / 1000));
          }

          return {
            totalHits: current,
            resetTime: new Date(Date.now() + windowMs),
          };
        } catch (error) {
          logger.error('Rate limit store error:', error);
          // Fallback: permitir request se Redis falhar
          return {
            totalHits: 1,
            resetTime: new Date(Date.now() + windowMs),
          };
        }
      },
      decrement: async (key: string) => {
        try {
          const redisKey = `rate_limit:${key}`;
          await redis.decr(redisKey);
        } catch (error) {
          logger.error('Rate limit decrement error:', error);
        }
      },
      resetKey: async (key: string) => {
        try {
          const redisKey = `rate_limit:${key}`;
          await redis.del(redisKey);
        } catch (error) {
          logger.error('Rate limit reset error:', error);
        }
      },
    },
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        userId: (req as any).user?.id,
      });

      res.status(429).json({
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString(),
      });
    },
  });
};

/**
 * Rate limit por IP (padrão)
 */
export const ipRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: 'Too many requests from this IP',
});

/**
 * Rate limit por usuário autenticado
 */
export const userRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // 200 requests por usuário
  keyGenerator: req => (req as any).user?.id || req.ip,
  message: 'Too many requests from this user',
});

/**
 * Rate limit rigoroso para APIs sensíveis
 */
export const strictRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 10, // 10 requests por janela
  message: 'Rate limit exceeded for sensitive endpoint',
});

/**
 * Rate limit para upload de arquivos
 */
export const uploadRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // 50 uploads por hora
  keyGenerator: req => (req as any).user?.id || req.ip,
  message: 'Upload rate limit exceeded',
});

/**
 * Rate limit dinâmico baseado em tipo de usuário
 */
export const dynamicRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  // Diferentes limites baseados no tipo de usuário
  let config: RateLimitConfig = {
    windowMs: 15 * 60 * 1000,
    max: 100,
  };

  if (user?.type === 'premium') {
    config.max = 500;
  } else if (user?.type === 'api') {
    config.max = 1000;
  }

  const limitMiddleware = createRateLimit(config);
  limitMiddleware(req, res, next);
};
