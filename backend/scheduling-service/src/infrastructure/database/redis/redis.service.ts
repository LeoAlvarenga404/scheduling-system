import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;

  onModuleInit() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }

  get redisClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client holds no valid connection');
    }
    return this.client;
  }

  /**
   * Acquires a lock using SET NX PX
   * @param key the lock name
   * @param ttlMs time to live in milliseconds
   * @returns true if lock was acquired, false otherwise
   */
  async acquireLock(key: string, ttlMs: number): Promise<boolean> {
    const result = await this.redisClient.set(key, 'LOCKED', 'PX', ttlMs, 'NX');
    return result === 'OK';
  }

  async releaseLock(key: string): Promise<void> {
    await this.redisClient.del(key);
  }
}
