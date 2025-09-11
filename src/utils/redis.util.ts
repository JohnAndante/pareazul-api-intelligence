// src/utils/redis.util.ts

import { redis } from '../config/redis.config';
import { logger } from './logger.util';

export class RedisUtil {
  // Session operations
  static async setSession(key: string, value: any, ttl: number = 3600): Promise<boolean> {
    try {
      await redis.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis setSession error:', error);
      return false;
    }
  }

  static async getSession(key: string): Promise<any | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis getSession error:', error);
      return null;
    }
  }

  static async deleteSession(key: string): Promise<boolean> {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      logger.error('Redis deleteSession error:', error);
      return false;
    }
  }

  // Memory buffer operations
  static async pushToBuffer(key: string, message: any, maxLength: number = 20): Promise<boolean> {
    try {
      await redis.lPush(key, JSON.stringify(message));
      await redis.lTrim(key, 0, maxLength - 1);
      await redis.expire(key, 3600); // 1 hour TTL
      return true;
    } catch (error) {
      logger.error('Redis pushToBuffer error:', error);
      return false;
    }
  }

  static async getBuffer(key: string, limit: number = 10): Promise<any[]> {
    try {
      const messages = await redis.lRange(key, 0, limit - 1);
      return messages.map(msg => JSON.parse(msg));
    } catch (error) {
      logger.error('Redis getBuffer error:', error);
      return [];
    }
  }

  static async clearBuffer(key: string): Promise<boolean> {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      logger.error('Redis clearBuffer error:', error);
      return false;
    }
  }

  // Health check
  static async ping(): Promise<boolean> {
    try {
      const result = await redis.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis ping error:', error);
      return false;
    }
  }
}

export { redis };
