import Redis from 'ioredis';
import { env } from '../config/env';
import logger from './logger';

const redisUrl = env.REDIS_URL || 'redis://localhost:6379';

// The cache is optional: getCache/setCache swallow errors and the app runs without it.
// Log an unreachable Redis only once so it doesn't spam the logs every couple of seconds.
let redisErrorLogged = false;

export const redis = new Redis(redisUrl, {
  family: 0, // resolve both IPv4 and IPv6 (Railway private networking is IPv6-only)
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
  retryStrategy: (times) => Math.min(times * 200, 5000),
});

redis.on('error', (err) => {
  if (!redisErrorLogged) {
    logger.warn('Redis unavailable - continuing without cache', { error: err.message });
    redisErrorLogged = true;
  }
});

redis.on('connect', () => {
  redisErrorLogged = false;
  logger.info('Redis connected successfully');
});

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key);
    if (!cached) return null;
    return JSON.parse(cached) as T;
  } catch (err) {
    logger.error('Redis getCache error', { key, error: (err as Error).message });
    return null;
  }
}

export async function setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    logger.error('Redis setCache error', { key, error: (err as Error).message });
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    logger.error('Redis deleteCache error', { key, error: (err as Error).message });
  }
}

export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    logger.error('Redis invalidatePattern error', { pattern, error: (err as Error).message });
  }
}
