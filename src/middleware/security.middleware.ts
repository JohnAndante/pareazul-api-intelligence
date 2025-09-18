// src/middleware/security.middleware.ts

import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.util';
import { CryptoUtil } from '../utils/crypto.util';

/**
 * Middleware básico de segurança usando Helmet
 */
export const basicSecurity = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Permitir embedding
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * Middleware para adicionar request ID único
 */
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || CryptoUtil.generateUUID();

  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
};

/**
 * Middleware para logging de requests
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = (req as any).requestId;

  // Log da request
  logger.info('Request started', {
    requestId,
    method: req.method,
    url: req.url,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    userId: (req as any).user?.id,
  });

  // Hook para log da response
  const originalSend = res.send;
  res.send = function (body: any) {
    const duration = Date.now() - start;

    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      userId: (req as any).user?.id,
    });

    return originalSend.call(this, body);
  };

  next();
};

/**
 * Middleware para remover headers sensíveis
 */
export const sanitizeHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remover headers que podem vazar informações
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  next();
};

/**
 * Middleware para detectar ataques comuns
 */
export const attackDetection = (req: Request, res: Response, next: NextFunction) => {
  const suspicious = [];

  // Detectar SQL Injection
  const sqlPatterns = /(union|select|insert|delete|update|drop|create|alter|exec|script)/i;
  if (sqlPatterns.test(req.url) || sqlPatterns.test(JSON.stringify(req.body))) {
    suspicious.push('SQL_INJECTION');
  }

  // Detectar XSS
  const xssPatterns = /(<script|javascript:|on\w+\s*=)/i;
  if (xssPatterns.test(req.url) || xssPatterns.test(JSON.stringify(req.body))) {
    suspicious.push('XSS_ATTEMPT');
  }

  // Detectar Path Traversal
  const pathTraversalPatterns = /(\.\.|\/etc\/|\/proc\/|\/var\/)/i;
  if (pathTraversalPatterns.test(req.url)) {
    suspicious.push('PATH_TRAVERSAL');
  }

  if (suspicious.length > 0) {
    logger.warn('Suspicious request detected', {
      ip: req.ip,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      attacks: suspicious,
      requestId: (req as any).requestId,
    });

    // Em produção, você pode querer bloquear essas requests
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Suspicious request blocked',
        code: 'SECURITY_VIOLATION',
      });
    }
  }

  next();
};

/**
 * Middleware para controle de tamanho de upload
 */
export const uploadSizeLimit = (maxSize: number = 10 * 1024 * 1024) => {
  // 10MB default
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];

    if (contentLength && parseInt(contentLength) > maxSize) {
      logger.warn('Upload size limit exceeded', {
        ip: req.ip,
        contentLength: contentLength,
        maxSize: maxSize,
        requestId: (req as any).requestId,
      });

      return res.status(413).json({
        error: 'File too large',
        code: 'FILE_TOO_LARGE',
        maxSize: maxSize,
      });
    }

    next();
  };
};

/**
 * Middleware para adicionar headers de segurança customizados
 */
export const customSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Adicionar headers de segurança
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};
