// src/config/redis.config.ts

import Redis from 'redis';
import { env } from './environment.config';
import { logger } from '../utils/logger.util';

const redisConfig = {
  url: env.REDIS_URL,
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
};

export const redis = Redis.createClient(redisConfig);

redis.on('error', err => {
  logger.error('Redis connection error:', err);
});

redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

export const connectRedis = async () => {
  try {
    await redis.connect();
    logger.info('Redis client connected');
  } catch (error) {
    logger.error('Failed to connect Redis:', error);
    throw error;
  }
};
