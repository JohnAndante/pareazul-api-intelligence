// src/utils/validation.util.ts

import { z } from 'zod';
import { logger } from './logger.util';

export class ValidationUtil {
  /**
   * Validar dados usando schema Zod
   */
  static validate<T>(
    schema: z.ZodSchema<T>,
    data: unknown
  ): { success: true; data: T } | { success: false; errors: string[] } {
    try {
      const result = schema.safeParse(data);

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        const errors = result.error.issues.map(
          (err: any) => `${err.path.join('.')}: ${err.message}`
        );
        return { success: false, errors };
      }
    } catch (error) {
      logger.error('Validation error:', error);
      return { success: false, errors: ['Validation failed'] };
    }
  }

  /**
   * Sanitizar HTML básico (remove tags perigosas)
   */
  static sanitizeHtml(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+="[^"]*"/gi, '');
  }

  /**
   * Validar e sanitizar entrada de texto
   */
  static sanitizeText(input: string, maxLength: number = 1000): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .trim()
      .substring(0, maxLength)
      .replace(/[\u0000-\u001f\u007f-\u009f]/g, '') // Remove control characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Validar email
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validar URL
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validar JSON string
   */
  static isValidJson(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extrair números de uma string
   */
  static extractNumbers(input: string): number[] {
    const matches = input.match(/-?\d+\.?\d*/g);
    return matches ? matches.map(Number).filter(n => !isNaN(n)) : [];
  }

  /**
   * Validar se é um número válido
   */
  static isValidNumber(value: any): boolean {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }
}
