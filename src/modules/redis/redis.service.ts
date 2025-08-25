import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async onModuleInit() {
    try {
      await this.checkRedisConnection();
    } catch (error) {
      this.logger.warn('Redis connection failed during initialization, but application will continue to run');
    }
  }

  /**
   * Check if Redis is connected and ready
   */
  async checkRedisConnection(): Promise<boolean> {
    try {
      const result = await this.redisClient.ping();
      if (result === 'PONG') {
        this.logger.log('✅ Redis connection established successfully');
        return true;
      } else {
        this.logger.warn('❌ Redis PING failed');
        return false;
      }
    } catch (error) {
      this.logger.warn('❌ Redis connection failed:', error.message);
      return false;
    }
  }

  /**
   * Check if Redis is available for operations
   */
  private isRedisAvailable(): boolean {
    return this.redisClient && this.redisClient.status === 'ready';
  }

  /**
   * Get all keys matching a pattern
   */
  async getKeys(pattern: string = '*'): Promise<string[]> {
    try {
      if (!this.isRedisAvailable()) {
        this.logger.warn('Redis not available for getKeys operation');
        return [];
      }
      return await this.redisClient.keys(pattern);
    } catch (error) {
      this.logger.warn('Error getting Redis keys:', error.message);
      return [];
    }
  }

  /**
   * Clear all keys with a specific prefix
   */
  async clearKeysByPrefix(prefix: string): Promise<number> {
    try {
      if (!this.isRedisAvailable()) {
        this.logger.warn('Redis not available for clearKeysByPrefix operation');
        return 0;
      }

      const keys = await this.redisClient.keys(`${prefix}*`);
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
        this.logger.log(`Cleared ${keys.length} keys with prefix: ${prefix}`);
        return keys.length;
      }
      return 0;
    } catch (error) {
      this.logger.warn('Error clearing keys by prefix:', error.message);
      return 0;
    }
  }

  /**
   * Set a key with JSON serialization
   */
  async setJson(key: string, value: any, ttl?: number): Promise<void> {
    try {
      if (!this.isRedisAvailable()) {
        this.logger.warn(`Redis not available for setJson operation on key: ${key}`);
        return;
      }
      const jsonValue = JSON.stringify(value);
      if (ttl) {
        await this.redisClient.setex(key, ttl, jsonValue);
      } else {
        await this.redisClient.set(key, jsonValue);
      }
    } catch (error) {
      this.logger.warn(`Error setting JSON key ${key}:`, error.message);
    }
  }

  /**
   * Get a key and parse as JSON
   */
  async getJson<T>(key: string): Promise<T | null> {
    try {
      if (!this.isRedisAvailable()) {
        this.logger.warn(`Redis not available for getJson operation on key: ${key}`);
        return null;
      }
      const value = await this.redisClient.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      this.logger.warn(`Error getting JSON key ${key}:`, error.message);
      return null;
    }
  }
}
