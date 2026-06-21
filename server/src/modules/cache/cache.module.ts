import { Global, Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

/**
 * CacheModule sets up two Redis integrations:
 *
 * 1. NestJS CacheManager (via @nestjs/cache-manager) – used with @UseInterceptors(CacheInterceptor)
 *    and the CACHE_MANAGER injection token for simple TTL-based HTTP response caching.
 *
 * 2. RedisService – a direct redis v4 client wrapper that provides full access to Redis
 *    commands (get/set, pub/sub, hashes, lists, sorted sets). Inject RedisService wherever
 *    you need fine-grained control over Redis (e.g. session storage, pub/sub notifications,
 *    rate-limit counters, analytics caching).
 *
 * @Global() makes both available application-wide without re-importing this module.
 */
@Global()
@Module({
  imports: [
    ConfigModule,
    NestCacheModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        // Use in-memory store as NestJS cache-manager fallback.
        // The direct redis v4 client (RedisService) handles all Redis operations.
        ttl: configService.get<number>('CACHE_TTL') || 300,
        max: configService.get<number>('CACHE_MAX_SIZE') || 1000,
      }),
    }),
  ],
  providers: [RedisService],
  exports: [NestCacheModule, RedisService],
})
export class CacheModule {}
