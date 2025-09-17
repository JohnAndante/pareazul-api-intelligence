// src/utils/logger.util.ts

import winston from 'winston';
import { env } from '../config/environment.config';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    // Captura informações de stack trace para debug
    const stackInfo = stack && typeof stack === 'string' ? stack.split('\n')[1]?.trim() : null;
    const fileInfo = stackInfo ? ` | ${stackInfo}` : '';

    return JSON.stringify({
      timestamp,
      level,
      message,
      stack: stack,
      fileInfo: fileInfo,
      ...meta
    });
  })
);

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'pareazul-assistant-server' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

// Helper function to get caller info
export const getCallerInfo = (): string => {
  const stack = new Error().stack;
  if (!stack) return 'unknown';

  const lines = stack.split('\n');
  // Pula as primeiras linhas (Error, getCallerInfo, logger method)
  const callerLine = lines[3] || lines[2] || 'unknown';

  // Extrai apenas o arquivo e linha: /path/to/file.ts:123:45
  const match = callerLine.match(/\(([^)]+)\)/) || callerLine.match(/at ([^\s]+)/);
  return match ? match[1] : callerLine.trim();
};

// Enhanced logger methods with automatic caller info
export const enhancedLogger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    logger.info(message, { ...meta, caller: getCallerInfo() });
  },

  error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
    logger.error(message, {
      ...meta,
      caller: getCallerInfo(),
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    });
  },

  warn: (message: string, meta?: Record<string, unknown>) => {
    logger.warn(message, { ...meta, caller: getCallerInfo() });
  },

  debug: (message: string, meta?: Record<string, unknown>) => {
    logger.debug(message, { ...meta, caller: getCallerInfo() });
  }
};

// Create logs directory if it doesn't exist
import { mkdirSync } from 'fs';
try {
  mkdirSync('logs', { recursive: true });
} catch {
  // Directory already exists
}
