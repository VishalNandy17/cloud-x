import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Core modules
import { ResourceModule } from './modules/resource/resource.module';
import { UserModule } from './modules/user/user.module';
import { BookingModule } from './modules/booking/booking.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

// Service modules
import { AuthModule } from './modules/auth/auth.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { CloudModule } from './modules/cloud/cloud.module';
import { SocketModule } from './modules/socket/socket.module';
import { NotificationModule } from './modules/notification/notification.module';

// Infrastructure modules
import { DatabaseModule } from './modules/database/database.module';
import { CacheModule } from './modules/cache/cache.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),

    // Infrastructure modules (must be first)
    DatabaseModule,
    CacheModule,
    MonitoringModule,

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Job queue
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'diverse-sunstruck-positive-21353.db.redis.io',
        port: parseInt(process.env.REDIS_PORT || '14164'),
        password: process.env.REDIS_PASSWORD || 'clq4n955pTdvmUVPfAw55fXvt8gIvivO',
        username: process.env.REDIS_USERNAME || 'default',
        tls: {},
      },
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Event emitter
    EventEmitterModule.forRoot(),

    // Service modules
    AuthModule,
    BlockchainModule,
    CloudModule,
    SocketModule,
    NotificationModule,

    // Core modules
    ResourceModule,
    UserModule,
    BookingModule,
    TransactionModule,
    AnalyticsModule,
  ],
})
export class AppModule {}