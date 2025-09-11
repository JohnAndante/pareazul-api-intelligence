// src/utils/crypto.util.ts

import { randomUUID, createHash } from 'crypto';

export class CryptoUtil {
  /**
   * Gerar UUID v4
   */
  static generateUUID(): string {
    return randomUUID();
  }

  /**
   * Gerar ID de sessão único
   */
  static generateSessionId(userId?: string): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    const base = `${timestamp}-${random}`;

    if (userId) {
      return `${userId}-${base}`;
    }

    return base;
  }

  /**
   * Hash SHA-256 de uma string
   */
  static hash(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  /**
   * Gerar token de autenticação simples
   */
  static generateAuthToken(): string {
    return createHash('sha256')
      .update(`${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Validar se uma string é um UUID válido
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Sanitizar string para uso como ID
   */
  static sanitizeId(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '')
      .substring(0, 50);
  }
}
