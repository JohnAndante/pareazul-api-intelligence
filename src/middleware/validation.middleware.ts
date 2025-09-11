// src/middleware/validation.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationUtil } from '../utils/validation.util';
import { logger } from '../utils/logger.util';

export interface ValidationConfig {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
  headers?: z.ZodSchema;
}

/**
 * Middleware para validação usando schemas Zod
 */
export const validate = (config: ValidationConfig) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    try {
      // Validar body
      if (config.body) {
        const bodyResult = ValidationUtil.validate(config.body, req.body);
        if (!bodyResult.success) {
          errors.push(...bodyResult.errors.map(err => `body.${err}`));
        } else {
          req.body = bodyResult.data;
        }
      }

      // Validar query parameters
      if (config.query) {
        const queryResult = ValidationUtil.validate(config.query, req.query);
        if (!queryResult.success) {
          errors.push(...queryResult.errors.map(err => `query.${err}`));
        } else {
          req.query = queryResult.data as any;
        }
      }

      // Validar path parameters
      if (config.params) {
        const paramsResult = ValidationUtil.validate(config.params, req.params);
        if (!paramsResult.success) {
          errors.push(...paramsResult.errors.map(err => `params.${err}`));
        } else {
          req.params = paramsResult.data as any;
        }
      }

      // Validar headers
      if (config.headers) {
        const headersResult = ValidationUtil.validate(config.headers, req.headers);
        if (!headersResult.success) {
          errors.push(...headersResult.errors.map(err => `headers.${err}`));
        }
      }

      if (errors.length > 0) {
        logger.warn('Validation failed', {
          path: req.path,
          method: req.method,
          errors: errors,
          ip: req.ip,
        });

        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors,
        });
      }

      next();
    } catch (error) {
      logger.error('Validation middleware error:', error);
      return res.status(500).json({
        error: 'Validation error',
        code: 'VALIDATION_EXCEPTION',
      });
    }
  };
};

/**
 * Middleware para sanitização de entrada
 */
export const sanitize = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitizar body strings
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitizar query strings
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    next();
  } catch (error) {
    logger.error('Sanitization error:', error);
    next();
  }
};

/**
 * Função auxiliar para sanitizar objetos recursivamente
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return ValidationUtil.sanitizeText(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Middleware para validação de content-type
 */
export const requireJsonContent = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers['content-type'];

    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        error: 'Content-Type must be application/json',
        code: 'INVALID_CONTENT_TYPE',
      });
    }
  }

  next();
};

/**
 * Middleware para validação de tamanho do body
 */
export const limitBodySize = (maxSize: number = 1024 * 1024) => {
  // 1MB default
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];

    if (contentLength && parseInt(contentLength) > maxSize) {
      return res.status(413).json({
        error: 'Request body too large',
        code: 'BODY_TOO_LARGE',
        maxSize: maxSize,
      });
    }

    next();
  };
};
