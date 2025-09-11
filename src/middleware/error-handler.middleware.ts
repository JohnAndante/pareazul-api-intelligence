// src/middleware/error-handler.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.util';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class AppError extends Error implements ApiError {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'INTERNAL_ERROR';
    this.details = details;
    this.name = 'AppError';

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware global de tratamento de erros
 */
export const errorHandler = (error: ApiError, req: Request, res: Response, next: NextFunction) => {
  // Se response já foi enviado, delegar para o handler padrão do Express
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const message = error.message || 'Internal server error';

  // Log do erro
  const logData = {
    error: {
      name: error.name,
      message: error.message,
      code: code,
      stack: error.stack,
    },
    request: {
      method: req.method,
      url: req.url,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
    },
    statusCode: statusCode,
  };

  if (statusCode >= 500) {
    logger.error('Server error:', logData);
  } else if (statusCode >= 400) {
    logger.warn('Client error:', logData);
  }

  // Resposta de erro
  const errorResponse: any = {
    error: message,
    code: code,
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  // Incluir detalhes apenas em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = error.details;
    errorResponse.stack = error.stack;
  }

  // Incluir requestId se disponível
  if ((req as any).requestId) {
    errorResponse.requestId = (req as any).requestId;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Middleware para capturar erros assíncronos
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware para tratar rotas não encontradas
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Route ${req.method} ${req.path} not found`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};

/**
 * Classes de erro específicas
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, service?: string) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', { service });
    this.name = 'ExternalServiceError';
  }
}
