// src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.util';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

export interface AuthMiddlewareConfig {
  headerName?: string;
  requiredAuth?: boolean;
  validateToken?: (token: string) => Promise<any>;
}

/**
 * Middleware de autenticação baseado em header (como no n8n)
 * Extrai o token do header e opcionalmente valida
 */
export const createAuthMiddleware = (config: AuthMiddlewareConfig = {}) => {
  const { headerName = 'authorization', requiredAuth = true, validateToken } = config;

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers[headerName.toLowerCase()] as string;

      if (!authHeader) {
        if (requiredAuth) {
          logger.warn('Missing authorization header', {
            ip: req.ip,
            path: req.path,
            method: req.method,
          });

          return res.status(401).json({
            error: 'Authorization header required',
            code: 'MISSING_AUTH_HEADER',
          });
        } else {
          // Auth não obrigatória, continuar sem user
          return next();
        }
      }

      // Extrair token (suporte a Bearer token ou token direto)
      let token = authHeader;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }

      if (!token) {
        if (requiredAuth) {
          logger.warn('Invalid authorization header format', {
            ip: req.ip,
            path: req.path,
            method: req.method,
          });

          return res.status(401).json({
            error: 'Invalid authorization header format',
            code: 'INVALID_AUTH_FORMAT',
          });
        } else {
          return next();
        }
      }

      // Validação customizada do token (se fornecida)
      if (validateToken) {
        try {
          const user = await validateToken(token);
          req.user = user;

          logger.debug('User authenticated', {
            userId: user?.id,
            path: req.path,
            method: req.method,
          });
        } catch (error) {
          logger.warn('Token validation failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip,
            path: req.path,
            method: req.method,
          });

          return res.status(401).json({
            error: 'Invalid authentication token',
            code: 'INVALID_TOKEN',
          });
        }
      } else {
        // Sem validação customizada, apenas extrair informações básicas do token
        // Aqui você pode implementar sua lógica básica de extração de user ID
        req.user = {
          id: token, // Simplificado - usar o token como ID
          token: token,
        };
      }

      next();
    } catch (error) {
      logger.error('Auth middleware error:', error);
      return res.status(500).json({
        error: 'Authentication error',
        code: 'AUTH_ERROR',
      });
    }
  };
};

/**
 * Middleware de autenticação simples (compatível com n8n HeaderAuth)
 */
export const simpleAuth = createAuthMiddleware({
  headerName: 'authorization',
  requiredAuth: true,
});

/**
 * Middleware de autenticação opcional
 */
export const optionalAuth = createAuthMiddleware({
  headerName: 'authorization',
  requiredAuth: false,
});

/**
 * Middleware para verificar se usuário está autenticado
 */
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
  }
  next();
};

/**
 * Middleware para extrair user ID de diferentes fontes
 */
export const extractUserId = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Prioridade: req.user.id > authorization header > body.userId > query.userId
    let userId: string | null = null;

    if (req.user?.id) {
      userId = req.user.id;
    } else if (req.headers.authorization) {
      userId = req.headers.authorization.replace('Bearer ', '');
    } else if (req.body?.userId) {
      userId = req.body.userId;
    } else if (req.query?.userId) {
      userId = req.query.userId as string;
    }

    if (userId) {
      req.user = { ...req.user, id: userId };
    }

    next();
  } catch (error) {
    logger.error('Extract userId error:', error);
    next();
  }
};
