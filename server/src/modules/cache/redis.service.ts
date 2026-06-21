import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType;
  private subscriber: RedisClientType;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST') || 'diverse-sunstruck-positive-21353.db.redis.io';
    const port = this.configService.get<number>('REDIS_PORT') || 14164;
    const password = this.configService.get<string>('REDIS_PASSWORD') || 'clq4n955pTdvmUVPfAw55fXvt8gIvivO';
    const username = this.configService.get<string>('REDIS_USERNAME') || 'default';

    const clientOptions = {
      username,
      password,
      socket: { host, port },
    };

    // Main client for get/set/publish
    this.client = createClient(clientOptions) as RedisClientType;
    this.client.on('error', (err) => this.logger.error('Redis Client Error', err));
    this.client.on('connect', () => this.logger.log('✅ Redis client connected'));
    await this.client.connect();

    // Subscriber client (separate connection required for pub/sub)
    this.subscriber = createClient(clientOptions) as RedisClientType;
    this.subscriber.on('error', (err) => this.logger.error('Redis Subscriber Error', err));
    this.subscriber.on('connect', () => this.logger.log('✅ Redis subscriber connected'));
    await this.subscriber.connect();
  }

  async onModuleDestroy() {
    await this.client?.quit();
    await this.subscriber?.quit();
    this.logger.log('Redis connections closed');
  }

  // ─── Key/Value Operations ───────────────────────────────────────────────────

  async get<T = string>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialised = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.setEx(key, ttlSeconds, serialised);
    } else {
      await this.client.set(key, serialised);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) > 0;
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  // ─── Hash Operations (useful for session/user data) ─────────────────────────

  async hSet(key: string, field: string, value: unknown): Promise<void> {
    const serialised = typeof value === 'string' ? value : JSON.stringify(value);
    await this.client.hSet(key, field, serialised);
  }

  async hGet<T = string>(key: string, field: string): Promise<T | null> {
    const value = await this.client.hGet(key, field);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async hGetAll<T = Record<string, string>>(key: string): Promise<T> {
    return (await this.client.hGetAll(key)) as unknown as T;
  }

  // ─── Pub/Sub ─────────────────────────────────────────────────────────────────

  async publish(channel: string, message: unknown): Promise<void> {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    await this.client.publish(channel, payload);
  }

  async subscribe(channel: string, handler: (message: string) => void): Promise<void> {
    await this.subscriber.subscribe(channel, handler);
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(channel);
  }

  // ─── List Operations (useful for activity logs / queues) ─────────────────────

  async lPush(key: string, ...values: string[]): Promise<number> {
    return this.client.lPush(key, values);
  }

  async lRange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lRange(key, start, stop);
  }

  async lTrim(key: string, start: number, stop: number): Promise<void> {
    await this.client.lTrim(key, start, stop);
  }

  // ─── Sorted Set (leaderboards / analytics) ───────────────────────────────────

  async zAdd(key: string, score: number, member: string): Promise<void> {
    await this.client.zAdd(key, { score, value: member });
  }

  async zRange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.zRange(key, start, stop);
  }

  async zRevRangeWithScores(key: string, start: number, stop: number): Promise<{ value: string; score: number }[]> {
    return this.client.zRangeWithScores(key, start, stop, { REV: true });
  }

  // ─── Utility ─────────────────────────────────────────────────────────────────

  getClient(): RedisClientType {
    return this.client;
  }
}
